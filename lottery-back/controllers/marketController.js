const Market = require("../models/Market");

// Create Market (Admin Only)
exports.createMarket = async (req, res) => {
  try {
    const {
      name,
      marketId,
      gameType,
      openTime,
      closeTime,
      resultTime,
      minBid,
      maxBid,
      winningMultiplier,
      description,
    } = req.body;

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

    const existingMarket = await Market.findOne({
      $or: [
        { name: name.trim() },
        { marketId: marketId.trim() },
      ],
    });

    if (existingMarket) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }

    const market = await Market.create({
      name: name.trim(),
      marketId: marketId.trim(),
      gameType,
      openTime,
      closeTime,
      resultTime,
      minBid: minBid || 10,
      maxBid: maxBid || 10000,
      winningMultiplier: winningMultiplier || 10,
      description,
      createdBy: req.user.id,
      isActive: true,
      isResultDeclared: false,
    });

    return res.status(201).json({
      success: true,
      message: "Market created successfully",
      data: market,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Market (Admin Only)
exports.updateMarket = async (req, res) => {
  try {
    const { marketId } = req.params;

    const allowedGameTypes = [
      "single",
      "jodi",
      "panna",
      "half-sangam",
      "full-sangam",
      "last-digit",
      "first-digit",
    ];

    if (
      req.body.gameType &&
      !allowedGameTypes.includes(req.body.gameType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid game type",
      });
    }

    if (req.body.name) {
      const existingName = await Market.findOne({
        name: req.body.name.trim(),
        _id: { $ne: marketId },
      });

      if (existingName) {
        return res.status(400).json({
          success: false,
          message: "Market name already exists",
        });
      }

      req.body.name = req.body.name.trim();
    }

    if (req.body.marketId) {
      const existingId = await Market.findOne({
        marketId: req.body.marketId.trim(),
        _id: { $ne: marketId },
      });

      if (existingId) {
        return res.status(400).json({
          success: false,
          message: "Market ID already exists",
        });
      }

      req.body.marketId = req.body.marketId.trim();
    }

    const market = await Market.findByIdAndUpdate(
      marketId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Market updated successfully",
      data: market,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all markets
exports.getAllMarkets = async (req, res) => {
  try {
    const { isActive, gameType, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (gameType) filter.gameType = gameType;

    const markets = await Market.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Market.countDocuments(filter);

    res.json({
      success: true,
      data: markets,
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

// Get market by ID
exports.getMarketById = async (req, res) => {
  try {
    const { marketId } = req.params;

    const market = await Market.findById(marketId).populate(
      "createdBy",
      "name email"
    );

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    res.json({
      success: true,
      data: market,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Toggle market status (Admin Only)
exports.toggleMarketStatus = async (req, res) => {
  try {
    const { marketId } = req.params;
    const { isActive } = req.body;

    const market = await Market.findByIdAndUpdate(
      marketId,
      { isActive },
      { new: true }
    );

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    res.json({
      success: true,
      message: `Market ${isActive ? "activated" : "deactivated"} successfully`,
      data: market,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active markets for user
exports.getActiveMarkets = async (req, res) => {
  try {
    const markets = await Market.find({
      isActive: true,
      isResultDeclared: false,
    }).select("name marketId gameType openTime closeTime minBid maxBid");

    res.json({
      success: true,
      data: markets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete market (Admin Only)
exports.deleteMarket = async (req, res) => {
  try {
    const { marketId } = req.params;

    const market = await Market.findByIdAndDelete(marketId);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    res.json({
      success: true,
      message: "Market deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};