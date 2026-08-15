const GameCount = require("../../models/GameCount");

// Get Active Game Counts
const getGameCounts = async (req, res) => {
  try {
    const gameCounts = await GameCount.find({
      isActive: true,
    })
      .populate("ticketType", "title subTitle")
      .populate("ticketType", "title")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: gameCounts.length,
      data: gameCounts,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch game counts",
      error: error.message,
    });
  }
};

module.exports = {
  getGameCounts,
};