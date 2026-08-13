const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const mongoose = require("mongoose");

// ================= HELPER FUNCTIONS =================

// Generate unique transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BID${timestamp}${random}`;
};

// Calculate possible win amount
const calculateWinAmount = (gameType, bidAmount) => {
  const multipliers = {
    single: 9,
    jodi: 90,
    panna: 90,
    "half-sangam": 450,
    "full-sangam": 900,
    "last-digit": 9,     // Last digit win gives 9x multiplier
    "first-digit": 9,    // First digit win gives 9x multiplier
  };

  return bidAmount * (multipliers[gameType] || 0);
};

// Validate number according to game type
const validateNumber = (gameType, number) => {
  const str = String(number).trim();
  
  switch (gameType) {
    case "single":
      return /^[0-9]$/.test(str);

    case "jodi":
      return /^[0-9]{2}$/.test(str);

    case "panna":
      return /^[0-9]{3}$/.test(str);

    case "half-sangam":
      // Half-Sangam: can be 1-digit or 3-digit
      return /^[0-9]{1}$/.test(str) || /^[0-9]{3}$/.test(str);

    case "full-sangam":
      // Full-Sangam: 2-digit number
      return /^[0-9]{2}$/.test(str);

    case "last-digit":
      // Last Digit: User can bid on any 2-digit number (00-99)
      // The last digit of this number will be checked against winning number's last digit
      return /^[0-9]{2}$/.test(str);

    case "first-digit":
      // First Digit: User can bid on any 2-digit number (00-99)
      // The first digit of this number will be checked against winning number's first digit
      return /^[0-9]{2}$/.test(str);

    default:
      return false;
  }
};

// ============================================================
// ================= CHECK WIN LOGIC ==========================
// ============================================================

// Check if a bid wins based on game type and winning number
const checkBidWin = (bid, winningNumber) => {
  const winningNumStr = String(winningNumber).trim();
  const bidNumStr = String(bid.number).trim().padStart(2, '0');
  
  switch (bid.gameType) {
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
      // Last Digit: Check if last digit of user's bid matches last digit of winning number
      const bidLastDigit = bidNumStr.slice(-1);
      const winningLastDigit = winningNumStr.slice(-1);
      return bidLastDigit === winningLastDigit;
      
    case 'first-digit':
      // First Digit: Check if first digit of user's bid matches first digit of winning number
      const bidFirstDigit = bidNumStr.charAt(0);
      const winningFirstDigit = winningNumStr.charAt(0);
      return bidFirstDigit === winningFirstDigit;
      
    default:
      return false;
  }
};

// ============================================================
// ================= PLACE BID ================================
// ============================================================

exports.placeBid = async (req, res) => {
  try {
    const { marketId, gameType, number, bidAmount } = req.body;
    const userId = req.user.id;

    // Required fields validation
    if (!marketId || !gameType || !number || !bidAmount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Allowed game types
    const allowedGameTypes = [
      "single",
      "jodi",
      "panna",
      "half-sangam",
      "full-sangam",
      "last-digit",
      "first-digit",
    ];

    if (!allowedGameTypes.includes(gameType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game type",
      });
    }

    // Validate number
    if (!validateNumber(gameType, number)) {
      return res.status(400).json({
        success: false,
        message: `Invalid number for ${gameType}. Please check the format.`,
      });
    }

    // Validate amount
    if (Number(bidAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid bid amount",
      });
    }

    // Find market
    const market = await Market.findById(marketId);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    if (!market.isActive) {
      return res.status(400).json({
        success: false,
        message: "Market is not active",
      });
    }

    if (market.isResultDeclared) {
      return res.status(400).json({
        success: false,
        message: "Result already declared for this market",
      });
    }

    // Validate bid amount
    if (
      Number(bidAmount) < market.minBid ||
      Number(bidAmount) > market.maxBid
    ) {
      return res.status(400).json({
        success: false,
        message: `Bid amount should be between ${market.minBid} and ${market.maxBid}`,
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Balance check
    if (user.balance < Number(bidAmount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        balance: user.balance,
      });
    }

    // Calculate winning amount
    const possibleWinAmount = calculateWinAmount(
      gameType,
      Number(bidAmount)
    );

    if (possibleWinAmount === 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate winning amount",
      });
    }

    // Format number - pad with leading zeros for 2-digit numbers
    let formattedNumber = String(number).trim();
    if (gameType === 'jodi' || gameType === 'full-sangam' || 
        gameType === 'last-digit' || gameType === 'first-digit') {
      formattedNumber = formattedNumber.padStart(2, '0');
    }

    // Create bid
    const bid = await Bid.create({
      userId,
      marketId,
      gameType,
      number: formattedNumber,
      bidAmount: Number(bidAmount),
      possibleWinAmount,
      transactionId: generateTransactionId(),
      status: "pending",
    });

    // Deduct balance
    user.balance -= Number(bidAmount);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: {
        bid: {
          id: bid._id,
          transactionId: bid.transactionId,
          marketId: market._id,
          marketName: market.name,
          gameType: bid.gameType,
          number: bid.number,
          bidAmount: bid.bidAmount,
          possibleWinAmount: bid.possibleWinAmount,
          status: bid.status,
          createdAt: bid.createdAt,
        },
        wallet: {
          deducted: Number(bidAmount),
          remainingBalance: user.balance,
        },
      },
    });
  } catch (error) {
    console.error("Place Bid Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's bidding history
exports.getBiddingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, marketId, page = 1, limit = 20 } = req.query;

    const filter = { userId };
    if (status) filter.status = status;
    if (marketId) filter.marketId = marketId;

    const bids = await Bid.find(filter)
      .populate("marketId", "name marketId gameType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    res.json({
      success: true,
      data: bids,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get bid by ID (User)
exports.getBidById = async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.id;

    const bid = await Bid.findOne({ _id: bidId, userId })
      .populate("marketId", "name marketId gameType")
      .populate("userId", "name email mobile");

    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    res.json({ success: true, data: bid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get today's bids summary for user
exports.getTodayBidsSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Summary by status
    const summary = await Bid.aggregate([
      {
        $match: {
          userId: objectUserId,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          totalBids: {
            $sum: 1,
          },
          totalAmount: {
            $sum: "$bidAmount",
          },
          totalPossibleWin: {
            $sum: "$possibleWinAmount",
          },
        },
      },
    ]);

    // Total bids
    const totalBids = await Bid.countDocuments({
      userId: objectUserId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Total bid amount
    const totalAmountResult = await Bid.aggregate([
      {
        $match: {
          userId: objectUserId,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$bidAmount",
          },
        },
      },
    ]);

    const pending =
      summary.find((item) => item._id === "pending") || {
        totalBids: 0,
        totalAmount: 0,
        totalPossibleWin: 0,
      };

    const won =
      summary.find((item) => item._id === "won") || {
        totalBids: 0,
        totalAmount: 0,
        totalPossibleWin: 0,
      };

    const lost =
      summary.find((item) => item._id === "lost") || {
        totalBids: 0,
        totalAmount: 0,
        totalPossibleWin: 0,
      };

    return res.status(200).json({
      success: true,
      data: {
        totalBids,
        totalAmount: totalAmountResult[0]?.total || 0,
        pending,
        won,
        lost,
      },
    });
  } catch (error) {
    console.error("getTodayBidsSummary Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Cancel bid (only if not processed)
exports.cancelBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.id;

    const bid = await Bid.findOne({ _id: bidId, userId, status: "pending" });
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found or already processed",
      });
    }

    const user = await User.findById(userId);
    user.balance += bid.bidAmount;
    await user.save();

    bid.status = "cancelled";
    await bid.save();

    res.json({
      success: true,
      message: "Bid cancelled successfully",
      data: {
        bidId: bid._id,
        refundAmount: bid.bidAmount,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ================= ADMIN FUNCTIONS ===========================
// ============================================================

// Get all bids (Admin)
exports.adminGetAllBids = async (req, res) => {
  try {
    const {
      status,
      marketId,
      userId,
      gameType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (marketId) filter.marketId = marketId;
    if (userId) filter.userId = userId;
    if (gameType) filter.gameType = gameType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const bids = await Bid.find(filter)
      .populate("userId", "name email mobile balance")
      .populate("marketId", "name marketId gameType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    const summary = await Bid.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: bids,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get bid stats (Admin)
exports.adminGetBidStats = async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Total Bids
    const totalBids = await Bid.countDocuments();

    // Today's Bids
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBids = await Bid.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Status wise stats
    const statusStats = await Bid.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    // Game type wise stats
    const gameTypeStats = await Bid.aggregate([
      {
        $group: {
          _id: "$gameType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    // Daily stats
    const dailyStats = await Bid.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Market wise stats
    const marketStats = await Bid.aggregate([
      {
        $group: {
          _id: "$marketId",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
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
        $unwind: {
          path: "$market",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          marketName: "$market.name",
          marketId: "$market.marketId",
          count: 1,
          totalAmount: 1,
          totalWinAmount: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // User wise stats (Top bidders)
    const userStats = await Bid.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
          wonCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "won"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userName: "$user.name",
          userEmail: "$user.email",
          count: 1,
          totalAmount: 1,
          totalWinAmount: 1,
          wonCount: 1,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Hourly distribution
    const hourlyStats = await Bid.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Monthly stats
    const monthlyStats = await Bid.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalBids,
        todayBids,
        statusStats,
        gameTypeStats,
        dailyStats,
        marketStats,
        userStats,
        hourlyStats,
        monthlyStats,
        period,
        startDate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get today's bids (Admin)
exports.adminGetTodayBids = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bids = await Bid.find({
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .populate("userId", "name email mobile")
      .populate("marketId", "name marketId")
      .sort({ createdAt: -1 });

    const stats = await Bid.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          totalWinAmount: { $sum: "$winAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        bids,
        stats,
        total: bids.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get bid by ID (Admin)
exports.adminGetBidById = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId)
      .populate("userId", "name email mobile balance")
      .populate("marketId", "name marketId gameType openTime closeTime");

    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    res.json({ success: true, data: bid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update bid status (Admin)
exports.adminUpdateBidStatus = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status, remarks } = req.body;

    if (!["pending", "won", "lost", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: pending, won, lost, cancelled",
      });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    // If status is changing to won, update user balance
    if (status === "won" && bid.status !== "won") {
      const user = await User.findById(bid.userId);
      if (user) {
        user.balance += bid.possibleWinAmount;
        await user.save();
        bid.winAmount = bid.possibleWinAmount;
      }
    }

    // If status was won and now changing to something else, deduct balance
    if (bid.status === "won" && status !== "won") {
      const user = await User.findById(bid.userId);
      if (user) {
        user.balance -= bid.winAmount;
        await user.save();
        bid.winAmount = 0;
      }
    }

    bid.status = status;
    if (remarks) bid.remarks = remarks;
    await bid.save();

    res.json({
      success: true,
      message: "Bid status updated successfully",
      data: bid,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete bid (Admin)
exports.adminDeleteBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    // Refund if pending
    if (bid.status === "pending") {
      const user = await User.findById(bid.userId);
      if (user) {
        user.balance += bid.bidAmount;
        await user.save();
      }
    }

    await Bid.findByIdAndDelete(bidId);

    res.json({
      success: true,
      message: "Bid deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};