const PowerballResult = require("../../../models/india/IndiaPowerballResult");
const GamePool = require("../../../models/india/IndiaGamePool");
const User = require("../../../models/authmodel");
const mongoose = require('mongoose');

// Prize Divisions
const divisions = [
  { division: 1, main: 7, powerball: true, prize: 40000000 },
  { division: 2, main: 7, powerball: false, prize: 32769.7 },
  { division: 3, main: 6, powerball: true, prize: 10874.15 },
  { division: 4, main: 6, powerball: false, prize: 538.3 },
  { division: 5, main: 5, powerball: true, prize: 206.7 },
  { division: 6, main: 5, powerball: false, prize: 87.5 },
  { division: 7, main: 4, powerball: true, prize: 49.5 },
  { division: 8, main: 3, powerball: true, prize: 23.6 },
  { division: 9, main: 2, powerball: true, prize: 14.4 },
];

// ===============================
// Create Powerball Result
// ===============================
exports.createPowerballResult = async (req, res) => {
  try {
    const { gamePoolId, numbers, powerball } = req.body;

    if (!gamePoolId) {
      return res.status(400).json({
        success: false,
        message: "Game Pool ID is required.",
      });
    }

    if (!numbers || !Array.isArray(numbers) || numbers.length !== 7) {
      return res.status(400).json({
        success: false,
        message: "Exactly 7 winning numbers are required.",
      });
    }

    if (!powerball) {
      return res.status(400).json({
        success: false,
        message: "Powerball is required.",
      });
    }

    // Validate game pool exists and is open
    const gamePool = await GamePool.findById(gamePoolId);
    
    if (!gamePool) {
      return res.status(404).json({
        success: false,
        message: "Game pool not found.",
      });
    }

    if (gamePool.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "Game pool is already processed or closed.",
      });
    }

    // Check if result already exists for this pool
    const exists = await PowerballResult.findOne({ gamePoolId });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Result already declared for this game pool.",
      });
    }

    // Create result with gamePoolId
    const result = await PowerballResult.create({
      gamePoolId,
      drawNo: gamePool.drawNo,
      numbers,
      powerball,
      createdBy: req.user.id,
    });

    // Update game pool with winning numbers
    let poolWinners = 0;
    let totalPrizeAmount = 0;
    const userUpdates = [];

    for (const player of gamePool.players) {
      if (player.status !== "Pending") continue;

      let bestDivision = null;
      let bestGameNo = null;

      for (const game of player.games) {
        const matchedMain = game.numbers.filter((num) =>
          numbers.includes(num)
        ).length;

        const matchedPowerball = game.powerball === powerball;

        const division = divisions.find(
          (d) =>
            d.main === matchedMain &&
            d.powerball === matchedPowerball
        );

        if (
          division &&
          (!bestDivision ||
            division.division < bestDivision.division)
        ) {
          bestDivision = {
            division: division.division,
            prize: division.prize,
            matchedMain,
            matchedPowerball,
            gameNo: game.gameNo,
          };
          bestGameNo = game.gameNo;
        }
      }

      if (bestDivision) {
        player.status = "Won";
        player.result = {
          division: bestDivision.division,
          prize: bestDivision.prize,
          gameNo: bestGameNo,
        };
        poolWinners++;
        totalPrizeAmount += bestDivision.prize;

        if (player.user) {
          userUpdates.push({
            userId: player.user,
            amount: bestDivision.prize,
            playerId: player._id,
            division: bestDivision.division,
            gameNo: bestGameNo
          });
        }
      } else {
        player.status = "Lost";
        player.result = {
          division: null,
          prize: 0,
        };
      }
    }

    // Update pool status
    gamePool.status = "Completed";
    gamePool.resultDeclared = true;
    gamePool.winningNumbers = {
      numbers: numbers,
      powerball: powerball
    };

    await gamePool.save();

    // Update user balances
    const updatedUsers = [];
    for (const update of userUpdates) {
      try {
        const user = await User.findById(update.userId);
        if (user) {
          const oldBalance = user.balance || 0;
          user.balance = oldBalance + update.amount;
          await user.save();
          
          updatedUsers.push({
            userId: user._id,
            userName: user.name,
            email: user.email,
            oldBalance: oldBalance,
            newBalance: user.balance,
            amountAdded: update.amount,
            division: update.division,
            gameNo: update.gameNo
          });
        }
      } catch (error) {
        console.error(`Error updating user ${update.userId}:`, error);
      }
    }

    res.status(201).json({
      success: true,
      message: "Powerball result declared successfully. Winners have been credited.",
      result,
      poolProcessed: {
        id: gamePool._id,
        drawNo: gamePool.drawNo,
        totalPlayers: gamePool.totalPlayers,
        totalWinners: poolWinners,
        totalPrizeAmount: totalPrizeAmount,
      },
      winnersUpdated: updatedUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get All Results
// ===============================
exports.getAllPowerballResults = async (req, res) => {
  try {
    const results = await PowerballResult.find()
      .populate("createdBy", "name email")
      .populate("gamePoolId", "ticketType gameType gameCount totalPlayers")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: results.length,
      results: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Result By ID
// ===============================
exports.getPowerballResultById = async (req, res) => {
  try {
    const result = await PowerballResult.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("gamePoolId", "ticketType gameType gameCount totalPlayers players");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found.",
      });
    }

    const gamePool = await GamePool.findById(result.gamePoolId)
      .populate("players.user", "name email balance username");

    const winnerDetails = gamePool?.players
      .filter(p => p.status === "Won")
      .map(p => ({
        userId: p.user?._id,
        userName: p.user?.name,
        email: p.user?.email,
        username: p.user?.username,
        balance: p.user?.balance,
        prize: p.result?.prize,
        division: p.result?.division,
        gameNo: p.result?.gameNo
      })) || [];

    const totalWinners = winnerDetails.length;
    const totalPrize = winnerDetails.reduce((sum, w) => sum + (w.prize || 0), 0);

    res.json({
      success: true,
      result,
      winnerDetails,
      totalWinners,
      totalPrize
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Delete Result
// ===============================
exports.deletePowerballResult = async (req, res) => {
  try {
    const result = await PowerballResult.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found.",
      });
    }

    const gamePool = await GamePool.findById(result.gamePoolId);

    if (gamePool) {
      // Get winning players
      const winningPlayers = gamePool.players.filter(
        player => player.status === "Won" && player.result && player.result.prize > 0
      );

      // Reverse balances
      const reversedUsers = [];
      for (const player of winningPlayers) {
        try {
          if (player.user) {
            const user = await User.findById(player.user);
            if (user) {
              const oldBalance = user.balance || 0;
              user.balance = Math.max(0, oldBalance - player.result.prize);
              await user.save();
              
              reversedUsers.push({
                userId: user._id,
                userName: user.name,
                email: user.email,
                oldBalance: oldBalance,
                newBalance: user.balance,
                amountDeducted: player.result.prize,
                division: player.result.division
              });
            }
          }
        } catch (error) {
          console.error(`Error reversing balance for user ${player.user}:`, error);
        }
      }

      // Reset game pool
      gamePool.status = "Open";
      gamePool.resultDeclared = false;
      gamePool.winningNumbers = null;
      
      for (const player of gamePool.players) {
        player.status = "Pending";
        player.result = {
          division: null,
          prize: 0
        };
      }
      
      await gamePool.save();

      await result.deleteOne();

      res.json({
        success: true,
        message: `Result deleted successfully. Game pool has been reset and balances reversed.`,
        reversedUsers: reversedUsers,
        totalReversed: reversedUsers.length
      });
    } else {
      await result.deleteOne();
      res.json({
        success: true,
        message: `Result deleted successfully.`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Results by Game Pool
// ===============================
exports.getResultsByGamePool = async (req, res) => {
  try {
    const { gamePoolId } = req.params;

    const result = await PowerballResult.findOne({ gamePoolId })
      .populate("createdBy", "name email")
      .populate("gamePoolId", "ticketType gameType gameCount totalPlayers");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No result found for this game pool.",
      });
    }

    const gamePool = await GamePool.findById(gamePoolId)
      .populate("ticketType", "name price")
      .populate("gameCount", "name count")
      .populate("players.user", "name email username balance");

    // Get winners with their prizes
    const winners = gamePool?.players
      .filter(p => p.status === "Won")
      .map(p => ({
        userId: p.user?._id,
        userName: p.user?.name,
        email: p.user?.email,
        balance: p.user?.balance,
        prize: p.result?.prize,
        division: p.result?.division
      })) || [];

    res.json({
      success: true,
      result,
      poolDetails: gamePool,
      winners: winners,
      totalWinners: winners.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Pending Game by Player ID
// ===============================
exports.getPendingGameByPlayerId = async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: "Player ID is required.",
      });
    }

    const gamePool = await GamePool.findOne({
      "players._id": playerId,
      status: "Open"
    })
    .populate("ticketType", "name price description")
    .populate("gameCount", "name count")
    .populate("players.user", "name email username")
    .lean();

    if (!gamePool) {
      return res.status(404).json({
        success: false,
        message: "Pending game not found or already processed.",
      });
    }

    const player = gamePool.players.find(
      (p) => p._id.toString() === playerId.toString()
    );

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found in this game pool.",
      });
    }

    const pendingGame = {
      poolId: gamePool._id,
      playerId: player._id,
      userId: player.user,
      games: player.games.map(game => ({
        gameNo: game.gameNo,
        numbers: game.numbers,
        powerball: game.powerball,
      })),
      bidAmount: player.bidAmount,
      currencyDetails: player.currencyDetails,
      drawNo: gamePool.drawNo,
      ticketType: gamePool.ticketType,
      gameCount: gamePool.gameCount,
      playerStatus: player.status,
      poolStatus: gamePool.status,
      poolTotalPlayers: gamePool.totalPlayers,
      poolTotalAmount: gamePool.totalAmount,
      createdAt: gamePool.createdAt,
    };

    res.json({
      success: true,
      game: pendingGame,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get All Pending Games
// ===============================
exports.getAllPendingGames = async (req, res) => {
  try {
    const gamePools = await GamePool.find({
      status: "Open",
    })
      .populate("ticketType", "name price description")
      .populate("gameCount", "name totalGames price")
      .populate("players.user", "name email username");

    const pendingGames = [];

    gamePools.forEach((pool) => {
      pool.players.forEach((player) => {
        if (player.status === "Pending") {
          pendingGames.push({
            poolId: pool._id,
            drawNo: pool.drawNo,
            playerId: player._id,
            userId: player.user?._id,
            userName: player.user?.name,
            userEmail: player.user?.email,
            userUsername: player.user?.username,
            bidAmount: player.bidAmount,
            currencyDetails: player.currencyDetails,
            games: player.games,
            playerStatus: player.status,
            poolStatus: pool.status,
            createdAt: pool.createdAt,
          });
        }
      });
    });

    res.json({
      success: true,
      total: pendingGames.length,
      games: pendingGames,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Game Pool Details
// ===============================
exports.getGamePoolDetails = async (req, res) => {
  try {
    const { poolId } = req.params;

    const gamePool = await GamePool.findById(poolId)
      .populate("ticketType", "name price description")
      .populate("gameCount", "name totalGames price")
      .populate("players.user", "name email username balance");

    if (!gamePool) {
      return res.status(404).json({
        success: false,
        message: "Game pool not found.",
      });
    }

    // Calculate statistics
    const totalPlayers = gamePool.players.length;
    const pendingPlayers = gamePool.players.filter(p => p.status === "Pending").length;
    const wonPlayers = gamePool.players.filter(p => p.status === "Won").length;
    const lostPlayers = gamePool.players.filter(p => p.status === "Lost").length;
    
    const totalPrize = gamePool.players
      .filter(p => p.status === "Won")
      .reduce((sum, p) => sum + (p.result?.prize || 0), 0);

    res.json({
      success: true,
      pool: gamePool,
      statistics: {
        totalPlayers,
        pendingPlayers,
        wonPlayers,
        lostPlayers,
        totalPrize
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get User's Winning History
// ===============================
exports.getUserWinningHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const gamePools = await GamePool.find({
      "players.user": userId,
      "players.status": "Won",
      resultDeclared: true
    })
    .populate("ticketType", "name price")
    .populate("gameCount", "name totalGames")
    .sort({ createdAt: -1 });

    const winningHistory = [];
    let totalEarnings = 0;

    gamePools.forEach(pool => {
      const player = pool.players.find(
        p => p.user.toString() === userId.toString() && p.status === "Won"
      );
      
      if (player && player.result) {
        totalEarnings += player.result.prize || 0;
        winningHistory.push({
          drawNo: pool.drawNo,
          gamePoolId: pool._id,
          ticketType: pool.ticketType,
          gameCount: pool.gameCount,
          division: player.result.division,
          prize: player.result.prize,
          gameNo: player.result.gameNo,
          winningNumbers: pool.winningNumbers,
          declaredAt: pool.updatedAt || pool.createdAt,
          status: pool.status
        });
      }
    });

    res.json({
      success: true,
      total: winningHistory.length,
      totalEarnings: totalEarnings,
      history: winningHistory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get User's Balance
// ===============================
exports.getUserBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("balance name email username");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        balance: user.balance || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};