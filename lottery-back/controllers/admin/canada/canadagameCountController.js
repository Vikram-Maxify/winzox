const CanadaGameCount = require("../../../models/CanadaGameCount");

// ================================
// CREATE
// ================================
const createGameCount = async (req, res) => {
  try {
    const {
      ticketType,
      gameType,
      totalGames,
      price,
      label,
      isActive,
    } = req.body;

    if (!ticketType || !totalGames || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "ticketType, totalGames, and price are required fields",
      });
    }

    const exists = await CanadaGameCount.findOne({
      ticketType,
      gameType: gameType || null,
      totalGames,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message:
          "Canada Game Count already exists for this ticket type, game type, and total games",
      });
    }

    const data = await CanadaGameCount.create({
      ticketType,
      gameType: gameType || null,
      totalGames,
      price,
      label: label || "",
      isActive: isActive !== undefined ? isActive : true,
    });

    const result = await CanadaGameCount.findById(data._id).populate(
      "ticketType"
    );

    res.status(201).json({
      success: true,
      message: "Canada Game Count created successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================================
// GET ALL
// ================================
const getGameCounts = async (req, res) => {
  try {
    const { ticketType, gameType, isActive } = req.query;

    const filter = {};

    if (ticketType) filter.ticketType = ticketType;
    if (gameType) filter.gameType = gameType;
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const data = await CanadaGameCount.find(filter)
      .populate("ticketType")
      .sort({ ticketType: 1, totalGames: 1 });

    const transformedData = data.map((item) => {
      const itemObj = item.toObject();
      const ticketTypeData = itemObj.ticketType;

      if (ticketTypeData && ticketTypeData.gameTypes && itemObj.gameType) {
        const specificGameType = ticketTypeData.gameTypes.find(
          (gt) => gt._id.toString() === itemObj.gameType.toString()
        );

        itemObj.gameTypeDetails = specificGameType || null;
      } else {
        itemObj.gameTypeDetails = null;
      }

      return itemObj;
    });

    res.json({
      success: true,
      count: transformedData.length,
      data: transformedData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================================
// GET SINGLE
// ================================
const getGameCount = async (req, res) => {
  try {
    const data = await CanadaGameCount.findById(req.params.id).populate(
      "ticketType"
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Canada Game Count not found",
      });
    }

    const dataObj = data.toObject();
    const ticketTypeData = dataObj.ticketType;

    if (ticketTypeData && ticketTypeData.gameTypes && dataObj.gameType) {
      const specificGameType = ticketTypeData.gameTypes.find(
        (gt) => gt._id.toString() === dataObj.gameType.toString()
      );

      dataObj.gameTypeDetails = specificGameType || null;
    } else {
      dataObj.gameTypeDetails = null;
    }

    res.json({
      success: true,
      data: dataObj,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================================
// UPDATE
// ================================
const updateGameCount = async (req, res) => {
  try {
    const { ticketType, gameType, totalGames } = req.body;

    if (
      ticketType !== undefined ||
      gameType !== undefined ||
      totalGames !== undefined
    ) {
      const current = await CanadaGameCount.findById(req.params.id);

      if (!current) {
        return res.status(404).json({
          success: false,
          message: "Canada Game Count not found",
        });
      }

      const exists = await CanadaGameCount.findOne({
        ticketType:
          ticketType !== undefined ? ticketType : current.ticketType,

        gameType:
          gameType !== undefined
            ? gameType || null
            : current.gameType || null,

        totalGames:
          totalGames !== undefined ? totalGames : current.totalGames,

        _id: { $ne: req.params.id },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message:
            "Another Canada Game Count already exists with these values",
        });
      }
    }

    const data = await CanadaGameCount.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("ticketType");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Canada Game Count not found",
      });
    }

    const dataObj = data.toObject();
    const ticketTypeData = dataObj.ticketType;

    if (ticketTypeData && ticketTypeData.gameTypes && dataObj.gameType) {
      const specificGameType = ticketTypeData.gameTypes.find(
        (gt) => gt._id.toString() === dataObj.gameType.toString()
      );

      dataObj.gameTypeDetails = specificGameType || null;
    } else {
      dataObj.gameTypeDetails = null;
    }

    res.json({
      success: true,
      message: "Canada Game Count updated successfully",
      data: dataObj,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ================================
// DELETE
// ================================
const deleteGameCount = async (req, res) => {
  try {
    const data = await CanadaGameCount.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Canada Game Count not found",
      });
    }

    res.json({
      success: true,
      message: "Canada Game Count deleted successfully",
      data: {
        id: req.params.id,
        deletedItem: {
          ticketType: data.ticketType,
          gameType: data.gameType,
          totalGames: data.totalGames,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createGameCount,
  getGameCounts,
  getGameCount,
  updateGameCount,
  deleteGameCount,
};