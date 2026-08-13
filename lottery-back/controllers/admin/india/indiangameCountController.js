const GameCount = require("../../../models/IndiaGameCount");

// Create
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

    // Validate required fields
    if (!ticketType || !totalGames || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "ticketType, totalGames, and price are required fields",
      });
    }

    // Check for existing game count
    const exists = await GameCount.findOne({
      ticketType,
      gameType: gameType || null,
      totalGames,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Game Count already exists for this ticket type, game type, and total games",
      });
    }

    const data = await GameCount.create({
      ticketType,
      gameType: gameType || null,
      totalGames,
      price,
      label,
      isActive: isActive !== undefined ? isActive : true,
    });

    const result = await GameCount.findById(data._id)
      .populate("ticketType");

    res.status(201).json({
      success: true,
      message: "Game Count created successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All
const getGameCounts = async (req, res) => {
  try {
    const { ticketType, gameType, isActive } = req.query;
    
    // Build filter object
    const filter = {};
    if (ticketType) filter.ticketType = ticketType;
    if (gameType) filter.gameType = gameType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const data = await GameCount.find(filter)
      .populate("ticketType")
      .sort({ ticketType: 1, totalGames: 1 });

    // Transform data to include gameType details
    const transformedData = data.map(item => {
      const itemObj = item.toObject();
      const ticketTypeData = itemObj.ticketType;
      
      // Find the specific gameType details
      if (ticketTypeData && ticketTypeData.gameTypes && itemObj.gameType) {
        const specificGameType = ticketTypeData.gameTypes.find(
          gt => gt._id.toString() === itemObj.gameType.toString()
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

// Get Single
const getGameCount = async (req, res) => {
  try {
    const data = await GameCount.findById(req.params.id)
      .populate("ticketType");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Game Count not found",
      });
    }

    // Transform data to include gameType details
    const dataObj = data.toObject();
    const ticketTypeData = dataObj.ticketType;
    
    if (ticketTypeData && ticketTypeData.gameTypes && dataObj.gameType) {
      const specificGameType = ticketTypeData.gameTypes.find(
        gt => gt._id.toString() === dataObj.gameType.toString()
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

// Update
const updateGameCount = async (req, res) => {
  try {
    const { ticketType, gameType, totalGames } = req.body;
    
    // Check if updating unique combination
    if (ticketType || gameType || totalGames) {
      const existing = await GameCount.findOne({
        ticketType: ticketType || undefined,
        gameType: gameType || null,
        totalGames: totalGames || undefined,
        _id: { $ne: req.params.id } // Exclude current document
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Another game count already exists with these values",
        });
      }
    }

    const data = await GameCount.findByIdAndUpdate(
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
        message: "Game Count not found",
      });
    }

    // Transform data to include gameType details
    const dataObj = data.toObject();
    const ticketTypeData = dataObj.ticketType;
    
    if (ticketTypeData && ticketTypeData.gameTypes && dataObj.gameType) {
      const specificGameType = ticketTypeData.gameTypes.find(
        gt => gt._id.toString() === dataObj.gameType.toString()
      );
      dataObj.gameTypeDetails = specificGameType || null;
    } else {
      dataObj.gameTypeDetails = null;
    }

    res.json({
      success: true,
      message: "Game Count updated successfully",
      data: dataObj,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete
const deleteGameCount = async (req, res) => {
  try {
    const data = await GameCount.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Game Count not found",
      });
    }

    res.json({
      success: true,
      message: "Game Count deleted successfully",
      data: {
        id: req.params.id,
        deletedItem: {
          ticketType: data.ticketType,
          gameType: data.gameType,
          totalGames: data.totalGames,
        }
      }
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