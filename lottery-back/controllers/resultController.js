const Result = require("../models/Result");
const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const mongoose = require("mongoose");

// ================= HELPER FUNCTIONS =================

// Check if a bid wins based on game type and winning number
const checkBidWin = (bidNumber, gameType, winningNumber) => {
  const winningNumStr = String(winningNumber).trim();
  const bidNumStr = String(bidNumber).trim();
  
  switch (gameType) {
    case 'single':
      return winningNumStr === bidNumStr;
      
    case 'jodi':
      return winningNumStr === bidNumStr;
      
    case 'panna':
      return winningNumStr === bidNumStr;
      
    case 'half-sangam':
      // Half-Sangam: Check if either 1-digit or 3-digit matches
      return winningNumStr === bidNumStr || 
             winningNumStr.slice(-1) === bidNumStr.slice(-1);
             
    case 'full-sangam':
      // Full-Sangam: Check last 2 digits
      return winningNumStr.slice(-2) === bidNumStr;
      
    case 'last-digit':
      // Last Digit: Check if last digit matches
      const bidLastDigit = bidNumStr.slice(-1);
      const winningLastDigit = winningNumStr.slice(-1);
      return bidLastDigit === winningLastDigit;
      
    case 'first-digit':
      // First Digit: Check if first digit matches
      const bidFirstDigit = bidNumStr.charAt(0);
      const winningFirstDigit = winningNumStr.charAt(0);
      return bidFirstDigit === winningFirstDigit;
      
    default:
      return false;
  }
};

// ============================================================
// ================= DECLARE RESULT ===========================
// ============================================================

// Declare result (Admin Only)
exports.declareResult = async (req, res) => {
  try {
    const { marketId, winningNumber, resultDate } = req.body;
    const adminId = req.user.id; // From protect middleware

    // Validate required fields
    if (!marketId || !winningNumber) {
      return res.status(400).json({
        success: false,
        message: "Market ID and winning number are required",
      });
    }

    // Check market
    const market = await Market.findById(marketId);
    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    if (market.isResultDeclared) {
      return res.status(400).json({
        success: false,
        message: "Result already declared for this market",
      });
    }

    // Check if result already exists for this date
    const resultDateObj = new Date(resultDate || new Date());
    const existingResult = await Result.findOne({
      marketId,
      resultDate: resultDateObj,
    });

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: "Result already declared for this date",
      });
    }

    // Get all pending bids for this market
    const pendingBids = await Bid.find({
      marketId: marketId,
      status: "pending"
    });

    if (pendingBids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No pending bids found for this market",
      });
    }

    // Process each bid based on game type
    let totalPayout = 0;
    let totalWinningBids = 0;
    const winningBidsList = [];
    const losingBidsList = [];
    const processedUsers = new Set();

    for (const bid of pendingBids) {
      const isWin = checkBidWin(bid.number, market.gameType, winningNumber);
      
      if (isWin) {
        // Bid is won
        const winAmount = bid.possibleWinAmount || 0;
        totalPayout += winAmount;
        totalWinningBids++;
        
        // Update user balance
        const user = await User.findById(bid.userId);
        if (user) {
          user.balance += winAmount;
          await user.save();
        }

        // Update bid
        bid.status = "won";
        bid.winAmount = winAmount;
        bid.resultNumber = String(winningNumber).trim();
        await bid.save();
        
        winningBidsList.push(bid);
      } else {
        // Bid is lost
        bid.status = "lost";
        bid.resultNumber = String(winningNumber).trim();
        await bid.save();
        losingBidsList.push(bid);
      }
    }

    // Create result record
    const result = new Result({
      marketId,
      marketName: market.name,
      gameType: market.gameType,
      winningNumber: String(winningNumber).trim(),
      resultDate: resultDateObj,
      declaredBy: adminId,
      totalBids: pendingBids.length,
      totalWinningBids: totalWinningBids,
      totalPayout: totalPayout,
      status: "declared",
    });

    await result.save();

    // Update market
    market.isResultDeclared = true;
    await market.save();

    return res.status(200).json({
      success: true,
      message: "Result declared successfully",
      data: {
        result: {
          id: result._id,
          marketId: result.marketId,
          marketName: result.marketName,
          gameType: result.gameType,
          winningNumber: result.winningNumber,
          resultDate: result.resultDate,
          totalBids: result.totalBids,
          totalWinningBids: result.totalWinningBids,
          totalPayout: result.totalPayout,
          status: result.status,
          createdAt: result.createdAt,
        },
        summary: {
          totalBids: pendingBids.length,
          totalWinningBids: totalWinningBids,
          totalLosingBids: pendingBids.length - totalWinningBids,
          totalPayout: totalPayout,
        },
        winningBids: winningBidsList.map(bid => ({
          id: bid._id,
          userId: bid.userId,
          number: bid.number,
          bidAmount: bid.bidAmount,
          winAmount: bid.winAmount,
        })),
      },
    });
  } catch (error) {
    console.error("Declare Result Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ================= GET RESULTS ==============================
// ============================================================

// Get all results
exports.getResults = async (req, res) => {
  try {
    const { marketId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (marketId) filter.marketId = marketId;
    if (startDate || endDate) {
      filter.resultDate = {};
      if (startDate) filter.resultDate.$gte = new Date(startDate);
      if (endDate) filter.resultDate.$lte = new Date(endDate);
    }

    const results = await Result.find(filter)
      .populate("marketId", "name marketId gameType")
      .populate("declaredBy", "name email")
      .sort({ resultDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Result.countDocuments(filter);

    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Results Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ================= GET RESULT BY ID =========================
// ============================================================

// Get result by ID
exports.getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId)
      .populate("marketId", "name marketId gameType")
      .populate("declaredBy", "name email");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Get winning bids for this result
    const winningBids = await Bid.find({
      marketId: result.marketId,
      resultNumber: result.winningNumber,
      status: "won",
    })
      .populate("userId", "name email mobile")
      .select("userId bidAmount winAmount number");

    res.json({
      success: true,
      data: {
        result,
        winningBids,
        totalWinners: winningBids.length,
      },
    });
  } catch (error) {
    console.error("Get Result By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ================= GET TODAY'S RESULTS ======================
// ============================================================

// Get today's results
exports.getTodayResults = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await Result.find({
      resultDate: { $gte: today, $lt: tomorrow },
    })
      .populate("marketId", "name marketId gameType")
      .sort({ resultDate: -1 });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Get Today Results Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ================= GET RESULT STATISTICS ====================
// ============================================================

// Get result statistics
exports.getResultStats = async (req, res) => {
  try {
    const stats = await Result.aggregate([
      {
        $group: {
          _id: "$marketId",
          totalResults: { $sum: 1 },
          totalPayout: { $sum: "$totalPayout" },
          totalWinningBids: { $sum: "$totalWinningBids" },
          avgPayout: { $avg: "$totalPayout" },
        },
      },
      {
        $lookup: {
          from: "markets",
          localField: "_id",
          foreignField: "_id",
          as: "market",
        },
      },
      {
        $unwind: "$market",
      },
      {
        $project: {
          _id: 0,
          marketId: "$_id",
          marketName: "$market.name",
          totalResults: 1,
          totalPayout: 1,
          totalWinningBids: 1,
          avgPayout: { $round: ["$avgPayout", 2] },
        },
      },
      {
        $sort: { totalResults: -1 },
      },
    ]);

    // Get overall stats
    const overallStats = await Result.aggregate([
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          totalPayout: { $sum: "$totalPayout" },
          totalWinningBids: { $sum: "$totalWinningBids" },
          totalBids: { $sum: "$totalBids" },
          avgPayout: { $avg: "$totalPayout" },
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byMarket: stats,
        overall: overallStats[0] || {
          totalResults: 0,
          totalPayout: 0,
          totalWinningBids: 0,
          totalBids: 0,
          avgPayout: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get Result Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ================= GET RESULTS BY GAME TYPE =================
// ============================================================

// Get results by game type
exports.getResultsByGameType = async (req, res) => {
  try {
    const { gameType } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const validGameTypes = [
      "single", "jodi", "panna", "half-sangam", 
      "full-sangam", "last-digit", "first-digit"
    ];

    if (!validGameTypes.includes(gameType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game type",
      });
    }

    const filter = { gameType };
    if (startDate || endDate) {
      filter.resultDate = {};
      if (startDate) filter.resultDate.$gte = new Date(startDate);
      if (endDate) filter.resultDate.$lte = new Date(endDate);
    }

    const results = await Result.find(filter)
      .populate("marketId", "name marketId")
      .populate("declaredBy", "name email")
      .sort({ resultDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Result.countDocuments(filter);

    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Results By Game Type Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ================= EXPORT FUNCTIONS =========================
// ============================================================

module.exports = {
  declareResult: exports.declareResult,
  getResults: exports.getResults,
  getResultById: exports.getResultById,
  getTodayResults: exports.getTodayResults,
  getResultStats: exports.getResultStats,
  getResultsByGameType: exports.getResultsByGameType,
};