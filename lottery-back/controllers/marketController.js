const mongoose = require("mongoose");
const Market = require("../models/Market");
const uploadToImgBB = require("../utils/uploadToImgBB");

// ======================================================
// ALLOWED GAME TYPES
// ======================================================

const ALLOWED_GAME_TYPES = [
  "single",
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
];

// ======================================================
// HELPER: PARSE GAME TYPES
// ======================================================

const parseGameTypes = (gameTypes) => {
  if (!gameTypes) {
    return [];
  }

  // Already array
  if (Array.isArray(gameTypes)) {
    return gameTypes
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  // JSON string:
  // ["single","jodi","panna"]
  if (typeof gameTypes === "string") {
    try {
      const parsed = JSON.parse(gameTypes);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch (error) {
      // Continue below
    }

    // Comma separated:
    // single,jodi,panna
    return gameTypes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

// ======================================================
// HELPER: VALIDATE GAME TYPES
// ======================================================

const validateGameTypes = (gameTypes) => {
  if (!Array.isArray(gameTypes) || gameTypes.length === 0) {
    return {
      valid: false,
      message: "At least one game type is required",
    };
  }

  const uniqueGameTypes = [...new Set(gameTypes)];

  const invalidTypes = uniqueGameTypes.filter(
    (type) => !ALLOWED_GAME_TYPES.includes(type)
  );

  if (invalidTypes.length > 0) {
    return {
      valid: false,
      message: `Invalid game type(s): ${invalidTypes.join(", ")}`,
    };
  }

  return {
    valid: true,
    gameTypes: uniqueGameTypes,
  };
};

// ======================================================
// CREATE MARKET
// ======================================================

exports.createMarket = async (req, res) => {
  try {
    const {
      name,
      marketId,
      gameTypes,
      openTime,
      closeTime,
      resultTime,
      minBid,
      maxBid,
      winningMultiplier,
      description,
    } = req.body;

    // --------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Market name is required",
      });
    }

    if (!marketId || !marketId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Market ID is required",
      });
    }

    if (!openTime) {
      return res.status(400).json({
        success: false,
        message: "Open time is required",
      });
    }

    if (!closeTime) {
      return res.status(400).json({
        success: false,
        message: "Close time is required",
      });
    }

    if (!resultTime) {
      return res.status(400).json({
        success: false,
        message: "Result time is required",
      });
    }

    // --------------------------------------------------
    // PARSE GAME TYPES
    // --------------------------------------------------

    const parsedGameTypes = parseGameTypes(gameTypes);

    const gameTypeValidation =
      validateGameTypes(parsedGameTypes);

    if (!gameTypeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: gameTypeValidation.message,
      });
    }

    const uniqueGameTypes =
      gameTypeValidation.gameTypes;

    // --------------------------------------------------
    // CHECK DUPLICATE MARKET
    // --------------------------------------------------

    const existingMarket = await Market.findOne({
      $or: [
        {
          name: name.trim(),
        },
        {
          marketId: marketId.trim(),
        },
      ],
    });

    if (existingMarket) {
      return res.status(400).json({
        success: false,
        message: "Market name or ID already exists",
      });
    }

    // --------------------------------------------------
    // IMAGE UPLOAD TO IMGBB
    // --------------------------------------------------

    let image = null;

    if (req.file) {
      console.log("Uploading market image...");

      image = await uploadToImgBB(req.file);

      console.log(
        "Market Image URL:",
        image
      );
    }

    // --------------------------------------------------
    // CREATE MARKET
    // --------------------------------------------------

    const market = await Market.create({
      name: name.trim(),

      marketId: marketId.trim(),

      gameTypes: uniqueGameTypes,

      image,

      openTime,

      closeTime,

      resultTime,

      minBid:
        minBid !== undefined &&
        minBid !== ""
          ? Number(minBid)
          : 10,

      maxBid:
        maxBid !== undefined &&
        maxBid !== ""
          ? Number(maxBid)
          : 10000,

      winningMultiplier:
        winningMultiplier !== undefined &&
        winningMultiplier !== ""
          ? Number(winningMultiplier)
          : 10,

      description:
        description && description.trim()
          ? description.trim()
          : null,

      createdBy: req.user.id,

      isActive: true,

      isResultDeclared: false,
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Market created successfully",
      data: market,
    });
  } catch (error) {
    console.error(
      "Create Market Error:",
      error
    );

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Market name or Market ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE MARKET
// ======================================================

exports.updateMarket = async (req, res) => {
  try {
    const { marketId } = req.params;

    // --------------------------------------------------
    // VALIDATE OBJECT ID
    // --------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(marketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid market ID",
      });
    }

    // --------------------------------------------------
    // FIND MARKET
    // --------------------------------------------------

    const market = await Market.findById(
      marketId
    );

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // --------------------------------------------------
    // UPDATE DATA
    // --------------------------------------------------

    const updateData = {};

    // --------------------------------------------------
    // NAME
    // --------------------------------------------------

    if (
      req.body.name !== undefined
    ) {
      const name =
        String(req.body.name).trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            "Market name cannot be empty",
        });
      }

      const existingName =
        await Market.findOne({
          name,
          _id: {
            $ne: marketId,
          },
        });

      if (existingName) {
        return res.status(400).json({
          success: false,
          message:
            "Market name already exists",
        });
      }

      updateData.name = name;
    }

    // --------------------------------------------------
    // MARKET ID
    // --------------------------------------------------

    if (
      req.body.marketId !== undefined
    ) {
      const newMarketId =
        String(
          req.body.marketId
        ).trim();

      if (!newMarketId) {
        return res.status(400).json({
          success: false,
          message:
            "Market ID cannot be empty",
        });
      }

      const existingId =
        await Market.findOne({
          marketId: newMarketId,
          _id: {
            $ne: marketId,
          },
        });

      if (existingId) {
        return res.status(400).json({
          success: false,
          message:
            "Market ID already exists",
        });
      }

      updateData.marketId =
        newMarketId;
    }

    // --------------------------------------------------
    // GAME TYPES
    // --------------------------------------------------

    if (
      req.body.gameTypes !== undefined
    ) {
      const parsedGameTypes =
        parseGameTypes(
          req.body.gameTypes
        );

      const gameTypeValidation =
        validateGameTypes(
          parsedGameTypes
        );

      if (!gameTypeValidation.valid) {
        return res.status(400).json({
          success: false,
          message:
            gameTypeValidation.message,
        });
      }

      updateData.gameTypes =
        gameTypeValidation.gameTypes;
    }

    // --------------------------------------------------
    // OPEN TIME
    // --------------------------------------------------

    if (
      req.body.openTime !== undefined
    ) {
      updateData.openTime =
        req.body.openTime;
    }

    // --------------------------------------------------
    // CLOSE TIME
    // --------------------------------------------------

    if (
      req.body.closeTime !== undefined
    ) {
      updateData.closeTime =
        req.body.closeTime;
    }

    // --------------------------------------------------
    // RESULT TIME
    // --------------------------------------------------

    if (
      req.body.resultTime !== undefined
    ) {
      updateData.resultTime =
        req.body.resultTime;
    }

    // --------------------------------------------------
    // MIN BID
    // --------------------------------------------------

    if (
      req.body.minBid !== undefined &&
      req.body.minBid !== ""
    ) {
      const value = Number(
        req.body.minBid
      );

      if (Number.isNaN(value)) {
        return res.status(400).json({
          success: false,
          message:
            "minBid must be a valid number",
        });
      }

      updateData.minBid = value;
    }

    // --------------------------------------------------
    // MAX BID
    // --------------------------------------------------

    if (
      req.body.maxBid !== undefined &&
      req.body.maxBid !== ""
    ) {
      const value = Number(
        req.body.maxBid
      );

      if (Number.isNaN(value)) {
        return res.status(400).json({
          success: false,
          message:
            "maxBid must be a valid number",
        });
      }

      updateData.maxBid = value;
    }

    // --------------------------------------------------
    // WINNING MULTIPLIER
    // --------------------------------------------------

    if (
      req.body.winningMultiplier !==
        undefined &&
      req.body.winningMultiplier !== ""
    ) {
      const value = Number(
        req.body.winningMultiplier
      );

      if (Number.isNaN(value)) {
        return res.status(400).json({
          success: false,
          message:
            "winningMultiplier must be a valid number",
        });
      }

      updateData.winningMultiplier =
        value;
    }

    // --------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------

    if (
      req.body.description !== undefined
    ) {
      updateData.description =
        req.body.description
          ? String(
              req.body.description
            ).trim()
          : null;
    }

    // --------------------------------------------------
    // ACTIVE STATUS
    // --------------------------------------------------

    if (
      req.body.isActive !== undefined
    ) {
      updateData.isActive =
        req.body.isActive === true ||
        req.body.isActive === "true";
    }

    // --------------------------------------------------
    // RESULT DECLARED
    // --------------------------------------------------

    if (
      req.body.isResultDeclared !==
      undefined
    ) {
      updateData.isResultDeclared =
        req.body.isResultDeclared ===
          true ||
        req.body.isResultDeclared ===
          "true";
    }

    // --------------------------------------------------
    // IMAGE UPLOAD
    // --------------------------------------------------

    if (req.file) {
      console.log(
        "Uploading new market image..."
      );

      const imageUrl =
        await uploadToImgBB(
          req.file
        );

      console.log(
        "New Market Image URL:",
        imageUrl
      );

      updateData.image =
        imageUrl;
    }

    // --------------------------------------------------
    // UPDATE MARKET
    // --------------------------------------------------

    const updatedMarket =
      await Market.findByIdAndUpdate(
        marketId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "createdBy",
        "name email"
      );

    return res.status(200).json({
      success: true,
      message:
        "Market updated successfully",
      data: updatedMarket,
    });
  } catch (error) {
    console.error(
      "Update Market Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Market name or Market ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ALL MARKETS
// ======================================================

exports.getAllMarkets = async (
  req,
  res
) => {
  try {
    const {
      isActive,
      gameType,
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage =
      Math.max(
        parseInt(page) || 1,
        1
      );

    const currentLimit =
      Math.max(
        parseInt(limit) || 20,
        1
      );

    const filter = {};

    // Active filter
    if (
      isActive !== undefined
    ) {
      filter.isActive =
        isActive === "true";
    }

    // Game type filter
    if (gameType) {
      if (
        !ALLOWED_GAME_TYPES.includes(
          gameType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid game type: ${gameType}`,
        });
      }

      filter.gameTypes = {
        $in: [gameType],
      };
    }

    // --------------------------------------------------
    // FETCH
    // --------------------------------------------------

    const markets =
      await Market.find(filter)
        .populate(
          "createdBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (currentPage - 1) *
            currentLimit
        )
        .limit(currentLimit);

    const total =
      await Market.countDocuments(
        filter
      );

    return res.status(200).json({
      success: true,
      data: markets,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        pages: Math.ceil(
          total / currentLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get All Markets Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET MARKET BY ID
// ======================================================

exports.getMarketById = async (
  req,
  res
) => {
  try {
    const { marketId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        marketId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid market ID",
      });
    }

    const market =
      await Market.findById(
        marketId
      ).populate(
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
    console.error(
      "Get Market By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// TOGGLE MARKET STATUS
// ======================================================

exports.toggleMarketStatus =
  async (req, res) => {
    try {
      const { marketId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          marketId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid market ID",
        });
      }

      const { isActive } =
        req.body;

      if (
        isActive === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive is required",
        });
      }

      const activeStatus =
        isActive === true ||
        isActive === "true";

      const market =
        await Market.findByIdAndUpdate(
          marketId,
          {
            isActive:
              activeStatus,
          },
          {
            new: true,
          }
        );

      if (!market) {
        return res.status(404).json({
          success: false,
          message:
            "Market not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Market ${
          activeStatus
            ? "activated"
            : "deactivated"
        } successfully`,
        data: market,
      });
    } catch (error) {
      console.error(
        "Toggle Market Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// ======================================================
// GET ACTIVE MARKETS
// ======================================================

exports.getActiveMarkets =
  async (req, res) => {
    try {
      const markets =
        await Market.find({
          isActive: true,
          isResultDeclared: false,
        })
          .select(
            "name marketId gameTypes image openTime closeTime resultTime minBid maxBid winningMultiplier description"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        data: markets,
      });
    } catch (error) {
      console.error(
        "Get Active Markets Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

// ======================================================
// DELETE MARKET
// ======================================================

exports.deleteMarket =
  async (req, res) => {
    try {
      const { marketId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          marketId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid market ID",
        });
      }

      const market =
        await Market.findByIdAndDelete(
          marketId
        );

      if (!market) {
        return res.status(404).json({
          success: false,
          message:
            "Market not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Market deleted successfully",
        data: market,
      });
    } catch (error) {
      console.error(
        "Delete Market Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };