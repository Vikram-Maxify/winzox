const Result = require("../models/Result");
const Bid = require("../models/Bid");
const Market = require("../models/Market");
const User = require("../models/authmodel");
const BettingBonus = require("../models/BettingBonus");
const mongoose = require("mongoose");

// ==========================================================
// GAME TYPES
// ==========================================================

const GAME_TYPES = [
  "single",
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
];

// ==========================================================
// FORMAT NUMBER
// ==========================================================

const formatWinningNumber = (value, gameType) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  let number = String(value).trim();

  switch (gameType) {
    case "single":
      if (!/^[0-9]$/.test(number)) {
        throw new Error(
          "Single winning number must be 0-9"
        );
      }

      return number;

    case "jodi":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "Jodi winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    case "panna":
      if (!/^[0-9]{1,3}$/.test(number)) {
        throw new Error(
          "Panna winning number must be 000-999"
        );
      }

      return number.padStart(3, "0");

    case "half-sangam":
      if (!/^[0-9]{1,3}$/.test(number)) {
        throw new Error(
          "Half Sangam winning number must be 1-3 digits"
        );
      }

      return number;

    case "full-sangam":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "Full Sangam winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    case "last-digit":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "Last digit winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    case "first-digit":
      if (!/^[0-9]{1,2}$/.test(number)) {
        throw new Error(
          "First digit winning number must be 00-99"
        );
      }

      return number.padStart(2, "0");

    default:
      throw new Error(
        `Invalid game type: ${gameType}`
      );
  }
};

// ==========================================================
// CHECK BID WIN
// ==========================================================

const checkBidWin = (
  bidNumber,
  gameType,
  winningNumber
) => {
  if (
    winningNumber === undefined ||
    winningNumber === null
  ) {
    return false;
  }

  const winningNumStr =
    String(winningNumber).trim();

  const bidNumStr =
    String(bidNumber).trim();

  switch (gameType) {
    case "single":
      return winningNumStr === bidNumStr;

    case "jodi":
      return (
        winningNumStr ===
        bidNumStr.padStart(2, "0")
      );

    case "panna":
      return (
        winningNumStr ===
        bidNumStr.padStart(3, "0")
      );

    case "half-sangam":
      return (
        winningNumStr === bidNumStr ||
        winningNumStr.slice(-1) ===
          bidNumStr.slice(-1)
      );

    case "full-sangam":
      return (
        winningNumStr.slice(-2) ===
        bidNumStr.padStart(2, "0")
      );

    case "last-digit":
      return (
        winningNumStr.slice(-1) ===
        bidNumStr.slice(-1)
      );

    case "first-digit":
      return (
        winningNumStr.charAt(0) ===
        bidNumStr.charAt(0)
      );

    default:
      return false;
  }
};

// ==========================================================
// ADD REFERRAL BETTING BONUS
// ==========================================================

const addReferralBettingBonus = async (
  winner,
  winAmount
) => {
  try {
    if (!winner || !winAmount || winAmount <= 0) {
      return {
        success: false,
        bonus: 0,
        message: "Invalid winner or win amount",
      };
    }

    // ======================================================
    // GET ACTIVE BETTING BONUS
    // ======================================================

    const bettingBonus =
      await BettingBonus.findOne({
        isActive: true,
      });

    if (!bettingBonus) {
      return {
        success: false,
        bonus: 0,
        message: "Betting bonus is inactive",
      };
    }

    const percentage =
      Number(bettingBonus.percentage) || 0;

    if (
      percentage <= 0 ||
      percentage > 100
    ) {
      return {
        success: false,
        bonus: 0,
        message: "Invalid betting bonus percentage",
      };
    }

    // ======================================================
    // FIND REFERRER
    // ======================================================

    let referrer = null;

    // ------------------------------------------------------
    // 1. referredByUser
    // ------------------------------------------------------

    if (winner.referredByUser) {
      if (
        mongoose.Types.ObjectId.isValid(
          winner.referredByUser
        )
      ) {
        referrer =
          await User.findById(
            winner.referredByUser
          );
      }
    }

    // ------------------------------------------------------
    // 2. referredBy as ObjectId
    // ------------------------------------------------------

    if (
      !referrer &&
      winner.referredBy
    ) {
      if (
        mongoose.Types.ObjectId.isValid(
          winner.referredBy
        )
      ) {
        referrer =
          await User.findById(
            winner.referredBy
          );
      }
    }

    // ------------------------------------------------------
    // 3. referredBy as referral code
    // ------------------------------------------------------

    if (
      !referrer &&
      winner.referredBy
    ) {
      referrer =
        await User.findOne({
          referralCode:
            String(winner.referredBy).trim(),
        });
    }

    // ======================================================
    // NO REFERRER
    // ======================================================

    if (!referrer) {
      return {
        success: false,
        bonus: 0,
        message: "No referrer found",
      };
    }

    // ======================================================
    // PREVENT SELF REFERRAL
    // ======================================================

    if (
      String(referrer._id) ===
      String(winner._id)
    ) {
      return {
        success: false,
        bonus: 0,
        message: "Self referral is not allowed",
      };
    }

    // ======================================================
    // CALCULATE BONUS
    // ======================================================

    const referralBonus =
      Number(
        (
          (Number(winAmount) * percentage) /
          100
        ).toFixed(2)
      );

    if (referralBonus <= 0) {
      return {
        success: false,
        bonus: 0,
        message: "Referral bonus is zero",
      };
    }

    // ======================================================
    // ADD TO REFERRER BALANCE + EARNING
    // ======================================================

    await User.updateOne(
      {
        _id: referrer._id,
      },
      {
        $inc: {
          balance: referralBonus,
          referralEarning: referralBonus,
        },
      }
    );

    console.log(
      "=================================================="
    );

    console.log(
      "REFERRAL BETTING BONUS ADDED"
    );

    console.log(
      "Winner:",
      winner._id
    );

    console.log(
      "Winner Name:",
      winner.name
    );

    console.log(
      "Winner Amount:",
      winAmount
    );

    console.log(
      "Bonus Percentage:",
      percentage
    );

    console.log(
      "Referrer:",
      referrer._id
    );

    console.log(
      "Referrer Name:",
      referrer.name
    );

    console.log(
      "Referral Bonus:",
      referralBonus
    );

    console.log(
      "=================================================="
    );

    return {
      success: true,
      bonus: referralBonus,
      percentage,
      referrerId: referrer._id,
      referrerName: referrer.name,
    };
  } catch (error) {
    console.error(
      "Add Referral Betting Bonus Error:",
      error
    );

    return {
      success: false,
      bonus: 0,
      message: error.message,
    };
  }
};

// ==========================================================
// DECLARE RESULT
// ==========================================================

exports.declareResult = async (
  req,
  res
) => {
  try {
    const {
      marketId,
      winningNumber,
      resultDate,
      remarks,
    } = req.body;

    const adminId =
      req.user?.id;

    // ======================================================
    // VALIDATION
    // ======================================================

    if (!marketId) {
      return res.status(400).json({
        success: false,
        message:
          "Market ID is required",
      });
    }

    if (
      !winningNumber ||
      typeof winningNumber !== "object" ||
      Array.isArray(winningNumber)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Winning numbers are required as an object",
      });
    }

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

    // ======================================================
    // FIND MARKET
    // ======================================================

    const market =
      await Market.findById(
        marketId
      );

    if (!market) {
      return res.status(404).json({
        success: false,
        message:
          "Market not found",
      });
    }

    // ======================================================
    // MARKET GAME TYPES
    // ======================================================

    const marketGameTypes =
      Array.isArray(
        market.gameTypes
      )
        ? market.gameTypes
        : [];

    if (
      marketGameTypes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No game types configured for this market",
      });
    }

    // ======================================================
    // RESULT DATE
    // ======================================================

    const resultDateObj =
      new Date(
        resultDate || new Date()
      );

    if (
      isNaN(
        resultDateObj.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid result date",
      });
    }

    // ======================================================
    // CHECK EXISTING RESULT
    // ======================================================

    const existingResult =
      await Result.findOne({
        marketId,
        resultDate:
          resultDateObj,
      });

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message:
          "Result already declared for this market on this date",
        data: {
          resultId:
            existingResult._id,
          winningNumber:
            existingResult.winningNumber,
        },
      });
    }

    // ======================================================
    // FORMAT ALL NUMBERS
    // ======================================================

    const formattedWinningNumbers =
      {};

    for (
      const gameType of marketGameTypes
    ) {
      const value =
        winningNumber[
          gameType
        ];

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Winning number is required for ${gameType}`,
          gameType,
          marketGameTypes,
        });
      }

      try {
        formattedWinningNumbers[
          gameType
        ] =
          formatWinningNumber(
            value,
            gameType
          );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            error.message,
          gameType,
          value,
        });
      }
    }

    // ======================================================
    // GET ALL PENDING BIDS
    // ======================================================

    const pendingBids =
      await Bid.find({
        marketId,
        status: "pending",
      });

    if (
      pendingBids.length === 0
    ) {
      const totalBids =
        await Bid.countDocuments({
          marketId,
        });

      if (totalBids === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No bids found for this market. Please create bids first.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "No pending bids found. All bids are already processed.",
        totalBids,
      });
    }

    // ======================================================
    // PROCESS BIDS
    // ======================================================

    let totalPayout = 0;
    let totalWinningBids = 0;

    let totalReferralBonus = 0;
    let totalReferralBonusCount = 0;

    const winningBidsList = [];
    const losingBidsList = [];
    const referralBonusList = [];

    // ======================================================
    // PROCESS EACH BID
    // ======================================================

    for (
      const bid of pendingBids
    ) {
      const bidGameType =
        String(
          bid.gameType || ""
        ).trim();

      const winningNum =
        formattedWinningNumbers[
          bidGameType
        ];

      // ====================================================
      // GAME TYPE NOT CONFIGURED
      // ====================================================

      if (
        winningNum === undefined
      ) {
        bid.status = "lost";
        bid.resultNumber = null;

        await bid.save();

        losingBidsList.push(
          bid
        );

        continue;
      }

      // ====================================================
      // CHECK WIN
      // ====================================================

      const isWin =
        checkBidWin(
          bid.number,
          bidGameType,
          winningNum
        );

      // ====================================================
      // WIN
      // ====================================================

      if (isWin) {
        const winAmount =
          Number(
            bid.possibleWinAmount
          ) || 0;

        totalPayout +=
          winAmount;

        totalWinningBids++;

        // ==================================================
        // FIND WINNER
        // ==================================================

        const user =
          await User.findById(
            bid.userId
          );

        if (user) {
          // ================================================
          // ADD WINNING AMOUNT TO WINNER
          // ================================================

          user.balance =
            (Number(
              user.balance
            ) || 0) +
            winAmount;

          await user.save();

          // ================================================
          // REFERRAL BETTING BONUS
          // ================================================

          const referralResult =
            await addReferralBettingBonus(
              user,
              winAmount
            );

          if (
            referralResult.success
          ) {
            totalReferralBonus +=
              referralResult.bonus;

            totalReferralBonusCount++;

            referralBonusList.push({
              winnerId:
                user._id,

              winnerName:
                user.name,

              winAmount,

              percentage:
                referralResult.percentage,

              referrerId:
                referralResult.referrerId,

              referrerName:
                referralResult.referrerName,

              bonus:
                referralResult.bonus,
            });
          }
        }

        // ==================================================
        // UPDATE BID
        // ==================================================

        bid.status = "won";

        bid.winAmount =
          winAmount;

        bid.resultNumber =
          winningNum;

        await bid.save();

        winningBidsList.push(
          bid
        );
      }

      // ====================================================
      // LOSS
      // ====================================================

      else {
        bid.status = "lost";

        bid.resultNumber =
          winningNum;

        await bid.save();

        losingBidsList.push(
          bid
        );
      }
    }

    // ======================================================
    // CREATE ONE RESULT
    // ======================================================

    const result =
      new Result({
        marketId,

        marketName:
          market.name,

        winningNumber:
          formattedWinningNumbers,

        resultDate:
          resultDateObj,

        declaredBy:
          adminId,

        totalBids:
          pendingBids.length,

        totalWinningBids,

        totalPayout,

        status:
          "declared",

        remarks:
          remarks || null,
      });

    await result.save();

    // ======================================================
    // UPDATE MARKET
    // ======================================================

    market.isResultDeclared =
      true;

    await market.save();

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,

      message:
        "All results declared successfully",

      data: {
        result,

        summary: {
          totalBids:
            pendingBids.length,

          totalWinningBids,

          totalLosingBids:
            losingBidsList.length,

          totalPayout,

          totalReferralBonus:
            Number(
              totalReferralBonus.toFixed(2)
            ),

          totalReferralBonusCount,

          gameTypes:
            Object.keys(
              formattedWinningNumbers
            ),
        },

        winningBids:
          winningBidsList.map(
            (bid) => ({
              id: bid._id,

              userId:
                bid.userId,

              gameType:
                bid.gameType,

              number:
                bid.number,

              bidAmount:
                bid.bidAmount,

              winAmount:
                bid.winAmount,

              resultNumber:
                bid.resultNumber,
            })
          ),

        losingBids:
          losingBidsList.map(
            (bid) => ({
              id: bid._id,

              userId:
                bid.userId,

              gameType:
                bid.gameType,

              number:
                bid.number,

              bidAmount:
                bid.bidAmount,

              resultNumber:
                bid.resultNumber,
            })
          ),

        referralBonuses:
          referralBonusList,
      },
    });
  } catch (error) {
    console.error(
      "Declare Result Error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Result already exists for this market and date.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to declare result",
    });
  }
};

// ==========================================================
// GET ALL RESULTS
// ==========================================================

exports.getResults = async (
  req,
  res
) => {
  try {
    const {
      marketId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (marketId) {
      filter.marketId =
        marketId;
    }

    if (
      startDate ||
      endDate
    ) {
      filter.resultDate = {};

      if (startDate) {
        filter.resultDate.$gte =
          new Date(
            startDate
          );
      }

      if (endDate) {
        filter.resultDate.$lte =
          new Date(
            endDate
          );
      }
    }

    const pageNumber =
      Math.max(
        1,
        parseInt(page) || 1
      );

    const limitNumber =
      Math.max(
        1,
        parseInt(limit) || 20
      );

    const results =
      await Result.find(
        filter
      )
        .populate(
          "marketId",
          "name marketId gameTypes"
        )
        .populate(
          "declaredBy",
          "name email"
        )
        .sort({
          resultDate: -1,
          createdAt: -1,
        })
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(
          limitNumber
        );

    const total =
      await Result.countDocuments(
        filter
      );

    return res.json({
      success: true,

      data: results,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(
          total /
            limitNumber
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get Results Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================================
// GET RESULT BY ID
// ==========================================================

exports.getResultById =
  async (
    req,
    res
  ) => {
    try {
      const {
        resultId,
      } = req.params;

      const result =
        await Result.findById(
          resultId
        )
          .populate(
            "marketId",
            "name marketId gameTypes"
          )
          .populate(
            "declaredBy",
            "name email"
          );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Result not found",
        });
      }

      const marketObjectId =
        result.marketId?._id ||
        result.marketId;

      const winningBids =
        await Bid.find({
          marketId:
            marketObjectId,

          status: "won",

          resultNumber: {
            $ne: null,
          },
        })
          .populate(
            "userId",
            "name email mobile"
          )
          .select(
            "userId gameType bidAmount winAmount number resultNumber"
          );

      return res.json({
        success: true,

        data: {
          result,

          winningBids,

          totalWinners:
            winningBids.length,
        },
      });
    } catch (error) {
      console.error(
        "Get Result By ID Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================================
// GET TODAY RESULTS
// ==========================================================

exports.getTodayResults =
  async (
    req,
    res
  ) => {
    try {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() +
          1
      );

      const results =
        await Result.find({
          resultDate: {
            $gte: today,
            $lt: tomorrow,
          },

          status:
            "declared",
        })
          .populate(
            "marketId",
            "name marketId gameTypes"
          )
          .sort({
            resultDate: -1,
            createdAt: -1,
          });

      return res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error(
        "Get Today Results Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================================
// GET RESULT STATS
// ==========================================================

exports.getResultStats =
  async (
    req,
    res
  ) => {
    try {
      const stats =
        await Result.aggregate([
          {
            $group: {
              _id: "$marketId",

              totalResults: {
                $sum: 1,
              },

              totalPayout: {
                $sum:
                  "$totalPayout",
              },

              totalWinningBids: {
                $sum:
                  "$totalWinningBids",
              },

              totalBids: {
                $sum:
                  "$totalBids",
              },

              avgPayout: {
                $avg:
                  "$totalPayout",
              },
            },
          },

          {
            $lookup: {
              from: "markets",

              localField:
                "_id",

              foreignField:
                "_id",

              as: "market",
            },
          },

          {
            $unwind:
              "$market",
          },

          {
            $project: {
              _id: 0,

              marketId:
                "$_id",

              marketName:
                "$market.name",

              totalResults: 1,

              totalPayout: 1,

              totalWinningBids: 1,

              totalBids: 1,

              avgPayout: {
                $round: [
                  "$avgPayout",
                  2,
                ],
              },
            },
          },

          {
            $sort: {
              totalResults: -1,
            },
          },
        ]);

      const overallStats =
        await Result.aggregate([
          {
            $group: {
              _id: null,

              totalResults: {
                $sum: 1,
              },

              totalPayout: {
                $sum:
                  "$totalPayout",
              },

              totalWinningBids: {
                $sum:
                  "$totalWinningBids",
              },

              totalBids: {
                $sum:
                  "$totalBids",
              },

              avgPayout: {
                $avg:
                  "$totalPayout",
              },
            },
          },
        ]);

      return res.json({
        success: true,

        data: {
          byMarket: stats,

          overall:
            overallStats[0] || {
              totalResults: 0,
              totalPayout: 0,
              totalWinningBids: 0,
              totalBids: 0,
              avgPayout: 0,
            },
        },
      });
    } catch (error) {
      console.error(
        "Get Result Stats Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================================
// GET RESULTS BY GAME TYPE
// ==========================================================

exports.getResultsByGameType =
  async (
    req,
    res
  ) => {
    try {
      const {
        gameType,
      } = req.params;

      const {
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      if (
        !GAME_TYPES.includes(
          gameType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid game type",
        });
      }

      const filter = {
        [`winningNumber.${gameType}`]:
          {
            $ne: null,
          },

        status:
          "declared",
      };

      if (
        startDate ||
        endDate
      ) {
        filter.resultDate = {};

        if (startDate) {
          filter.resultDate.$gte =
            new Date(
              startDate
            );
        }

        if (endDate) {
          filter.resultDate.$lte =
            new Date(
              endDate
            );
        }
      }

      const pageNumber =
        Math.max(
          1,
          parseInt(page) || 1
        );

      const limitNumber =
        Math.max(
          1,
          parseInt(limit) || 20
        );

      const results =
        await Result.find(
          filter
        )
          .populate(
            "marketId",
            "name marketId gameTypes"
          )
          .populate(
            "declaredBy",
            "name email"
          )
          .sort({
            resultDate: -1,
            createdAt: -1,
          })
          .skip(
            (pageNumber - 1) *
              limitNumber
          )
          .limit(
            limitNumber
          );

      const total =
        await Result.countDocuments(
          filter
        );

      return res.json({
        success: true,

        data: results,

        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(
            total /
              limitNumber
          ),
        },
      });
    } catch (error) {
      console.error(
        "Get Results By Game Type Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================================
// EXPORT
// ==========================================================

module.exports = {
  declareResult:
    exports.declareResult,

  getResults:
    exports.getResults,

  getResultById:
    exports.getResultById,

  getTodayResults:
    exports.getTodayResults,

  getResultStats:
    exports.getResultStats,

  getResultsByGameType:
    exports.getResultsByGameType,
};