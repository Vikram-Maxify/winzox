const Result = require("../models/Result");
const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const mongoose = require("mongoose");

// ============================================================
// ================= DECLARE RESULT ===========================
// ============================================================

exports.declareResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { marketId, winningNumbers, resultDate } = req.body;

    // ✅ Validate required fields
    if (!marketId) {
      return res.status(400).json({
        success: false,
        message: "Market ID is required",
      });
    }

    if (!winningNumbers || typeof winningNumbers !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Winning numbers object is required",
      });
    }

    // Find market
    const market = await Market.findById(marketId).session(session);
    if (!market) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    if (market.isResultDeclared) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Result already declared for this market",
      });
    }

    // ✅ Validate and format all winning numbers
    const formattedWinningNumbers = {};
    const errors = [];

    for (const [gameType, number] of Object.entries(winningNumbers)) {
      if (number && number.trim() !== '') {
        try {
          formattedWinningNumbers[gameType] = Result.formatWinningNumber(number, gameType);
        } catch (error) {
          errors.push(`${gameType}: ${error.message}`);
        }
      }
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid winning numbers",
        errors,
      });
    }

    // ✅ Find ALL pending bids for this market (all game types)
    const pendingBids = await Bid.find({
      marketId,
      status: "pending",
    }).session(session);

    if (pendingBids.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "No pending bids found for this market",
      });
    }

    // ✅ Process each bid
    let totalWon = 0;
    let totalLost = 0;
    let totalPayout = 0;
    const winningBidsList = [];
    const gameTypeStats = {};

    // Initialize game type stats
    const gameTypes = ['single', 'jodi', 'panna', 'half-sangam', 'full-sangam', 'last-digit', 'first-digit'];
    for (const type of gameTypes) {
      gameTypeStats[type] = { won: 0, lost: 0, total: 0 };
    }

    for (const bid of pendingBids) {
      // Update game type total
      if (gameTypeStats[bid.gameType]) {
        gameTypeStats[bid.gameType].total++;
      }

      // Check if bid wins based on its game type
      const isWin = checkBidWin(bid, formattedWinningNumbers);

      if (isWin) {
        // Mark as won
        bid.status = "won";
        bid.winAmount = bid.possibleWinAmount;
        bid.wonAt = new Date();
        bid.resultNumber = formattedWinningNumbers[bid.gameType] || null;

        // Add winnings to user balance
        const user = await User.findById(bid.userId).session(session);
        if (user) {
          user.balance += bid.possibleWinAmount;
          await user.save({ session });
          totalPayout += bid.possibleWinAmount;
        }
        totalWon++;
        winningBidsList.push(bid);
        
        // Update game type stats
        if (gameTypeStats[bid.gameType]) {
          gameTypeStats[bid.gameType].won++;
        }
      } else {
        // Mark as lost
        bid.status = "lost";
        bid.lostAt = new Date();
        bid.resultNumber = formattedWinningNumbers[bid.gameType] || null;
        totalLost++;
        
        // Update game type stats
        if (gameTypeStats[bid.gameType]) {
          gameTypeStats[bid.gameType].lost++;
        }
      }

      await bid.save({ session });
    }

    // ✅ Create Result record
    const resultData = {
      marketId: market._id,
      marketName: market.name,
      winningNumber: formattedWinningNumbers,
      resultDate: resultDate ? new Date(resultDate) : new Date(),
      declaredBy: req.user.id,
      totalBids: pendingBids.length,
      totalWinningBids: totalWon,
      totalPayout: totalPayout,
      status: "declared",
    };

    const result = await Result.create([resultData], { session });

    // Update market
    market.isResultDeclared = true;
    market.resultDeclaredAt = new Date();
    await market.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Result declared successfully",
      data: {
        market: {
          id: market._id,
          name: market.name,
        },
        result: result[0],
        summary: {
          totalBidsProcessed: pendingBids.length,
          totalWon,
          totalLost,
          totalPayout,
          gameTypeStats,
        },
        winningBids: winningBidsList.map((b) => ({
          id: b._id,
          userId: b.userId,
          gameType: b.gameType,
          number: b.number,
          bidAmount: b.bidAmount,
          winAmount: b.winAmount,
        })),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Declare Result Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ============================================================
// ================= HELPER: CHECK BID WIN ===================
// ============================================================

const checkBidWin = (bid, winningNumbers) => {
  const winningNumber = winningNumbers[bid.gameType];
  
  if (!winningNumber) {
    return false;
  }

  const winningNumStr = String(winningNumber).trim();
  const bidNumStr = String(bid.number).trim();

  switch (bid.gameType) {
    case "single":
      return winningNumStr === bidNumStr;
      
    case "jodi":
      return winningNumStr === bidNumStr.padStart(2, "0");
      
    case "panna":
      return winningNumStr === bidNumStr.padStart(3, "0");
      
    case "half-sangam":
      return winningNumStr === bidNumStr || 
             winningNumStr.slice(-1) === bidNumStr.slice(-1);
             
    case "full-sangam":
      return winningNumStr.slice(-2) === bidNumStr.padStart(2, "0");
      
    case "last-digit": {
      const bidLastDigit = bidNumStr.slice(-1);
      const winningLastDigit = winningNumStr.slice(-1);
      return bidLastDigit === winningLastDigit;
    }
    
    case "first-digit": {
      const bidFirstDigit = bidNumStr.charAt(0);
      const winningFirstDigit = winningNumStr.charAt(0);
      return bidFirstDigit === winningFirstDigit;
    }
    
    default:
      return false;
  }
};

// ============================================================
// ================= GET RESULTS ==============================
// ============================================================

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
    console.error("Get Results Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ================= GET RESULT BY ID ========================
// ============================================================

exports.getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId)
      .populate("marketId", "name marketId")
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
      status: "won",
    })
      .populate("userId", "name email mobile")
      .select("userId gameType number bidAmount winAmount");

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
// ================= GET TODAY'S RESULTS =====================
// ============================================================

exports.getTodayResults = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await Result.find({
      resultDate: { $gte: today, $lt: tomorrow },
    })
      .populate("marketId", "name marketId")
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