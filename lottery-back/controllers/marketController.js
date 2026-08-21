const Market = require("../models/Market");

// ==========================================================
// CREATE MARKET
// ==========================================================

exports.createMarket = async (req, res) => {
  try {
    const {
      name,
      marketId,
      openTime,
      closeTime,
      resultTime,
      minBid,
      maxBid,
      winningMultiplier,
      description,
    } = req.body;

    // Required fields validation
    if (!name || !marketId || !openTime || !closeTime || !resultTime) {
      return res.status(400).json({
        success: false,
        message: "Name, market ID, open time, close time and result time are required",
      });
    }

    const existingMarket = await Market.findOne({
      $or: [{ name: name.trim() }, { marketId: marketId.trim() }],
    });

    if (existingMarket) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }

    // ❌ No gameTypes - Market doesn't have game types
    const market = await Market.create({
      name: name.trim(),
      marketId: marketId.trim(),
      openTime,
      closeTime,
      resultTime,
      minBid: minBid ?? 10,
      maxBid: maxBid ?? 10000,
      winningMultiplier: winningMultiplier ?? 10,
      description: description || null,
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// UPDATE MARKET
// ==========================================================

exports.updateMarket = async (req, res) => {
  try {
    const { marketId } = req.params;
    const updateData = { ...req.body };

    // Never allow createdBy to be changed
    delete updateData.createdBy;
    
    // ❌ Remove gameTypes if frontend sends it
    delete updateData.gameTypes;
    delete updateData.gameType;

    // Trim name
    if (updateData.name) {
      updateData.name = updateData.name.trim();

      const existingName = await Market.findOne({
        name: updateData.name,
        _id: { $ne: marketId },
      });

      if (existingName) {
        return res.status(400).json({
          success: false,
          message: "Market name already exists",
        });
      }
    }

    // Trim market ID
    if (updateData.marketId) {
      updateData.marketId = updateData.marketId.trim();

      const existingId = await Market.findOne({
        marketId: updateData.marketId,
        _id: { $ne: marketId },
      });

      if (existingId) {
        return res.status(400).json({
          success: false,
          message: "Market ID already exists",
        });
      }
    }

    const market = await Market.findByIdAndUpdate(
      marketId,
      updateData,
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// GET ALL MARKETS
// ==========================================================

exports.getAllMarkets = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;

    const currentPage = Math.max(parseInt(page) || 1, 1);
    const currentLimit = Math.max(parseInt(limit) || 20, 1);

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const markets = await Market.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * currentLimit)
      .limit(currentLimit);

    const total = await Market.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: markets,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        pages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// GET MARKET BY ID
// ==========================================================

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

    return res.status(200).json({
      success: true,
      data: market,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// TOGGLE MARKET STATUS
// ==========================================================

exports.toggleMarketStatus = async (req, res) => {
  try {
    const { marketId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const market = await Market.findByIdAndUpdate(
      marketId,
      { isActive },
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
      message: `Market ${isActive ? "activated" : "deactivated"} successfully`,
      data: market,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// GET ACTIVE MARKETS FOR USER
// ==========================================================

exports.getActiveMarkets = async (req, res) => {
  try {
    const markets = await Market.find({
      isActive: true,
      isResultDeclared: false,
    })
      .select(
        "name marketId openTime closeTime resultTime minBid maxBid winningMultiplier description"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: markets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// DELETE MARKET
// ==========================================================

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

    return res.status(200).json({
      success: true,
      message: "Market deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};