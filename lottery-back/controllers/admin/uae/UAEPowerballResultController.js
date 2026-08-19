const PowerballResult = require("../../../models/uae/UAEPowerballResult");
const GamePool = require("../../../models/uae/UAEGamePool");
const User = require("../../../models/authmodel");
const BettingBonus = require("../../../models/BettingBonus");
const mongoose = require("mongoose");

// ==========================================================
// PRIZE DIVISIONS
// ==========================================================

const divisions = [
  {
    division: 1,
    main: 7,
    powerball: true,
    prize: 40000000,
  },
  {
    division: 2,
    main: 7,
    powerball: false,
    prize: 32769.7,
  },
  {
    division: 3,
    main: 6,
    powerball: true,
    prize: 10874.15,
  },
  {
    division: 4,
    main: 6,
    powerball: false,
    prize: 538.3,
  },
  {
    division: 5,
    main: 5,
    powerball: true,
    prize: 206.7,
  },
  {
    division: 6,
    main: 5,
    powerball: false,
    prize: 87.5,
  },
  {
    division: 7,
    main: 4,
    powerball: true,
    prize: 49.5,
  },
  {
    division: 8,
    main: 3,
    powerball: true,
    prize: 23.6,
  },
  {
    division: 9,
    main: 2,
    powerball: true,
    prize: 14.4,
  },
];

// ==========================================================
// ADD REFERRAL BETTING BONUS
// ==========================================================

const addReferralBettingBonus = async (
  winner,
  winAmount
) => {
  try {
    if (
      !winner ||
      Number(winAmount) <= 0
    ) {
      return {
        success: false,
        bonus: 0,
        percentage: 0,
        referrerId: null,
        referrerName: null,
        message:
          "Invalid winner or winning amount",
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
        percentage: 0,
        referrerId: null,
        referrerName: null,
        message:
          "Betting bonus is inactive",
      };
    }

    const percentage =
      Number(
        bettingBonus.percentage
      ) || 0;

    if (
      percentage <= 0 ||
      percentage > 100
    ) {
      return {
        success: false,
        bonus: 0,
        percentage,
        referrerId: null,
        referrerName: null,
        message:
          "Invalid betting bonus percentage",
      };
    }

    // ======================================================
    // FIND REFERRER
    // ======================================================

    let referrer = null;

    // ------------------------------------------------------
    // 1. referredByUser
    // ------------------------------------------------------

    if (
      winner.referredByUser
    ) {
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
    // 2. referredBy AS OBJECT ID
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
    // 3. referredBy AS REFERRAL CODE
    // ------------------------------------------------------

    if (
      !referrer &&
      winner.referredBy
    ) {
      referrer =
        await User.findOne({
          referralCode:
            String(
              winner.referredBy
            ).trim(),
        });
    }

    // ======================================================
    // NO REFERRER
    // ======================================================

    if (!referrer) {
      return {
        success: false,
        bonus: 0,
        percentage,
        referrerId: null,
        referrerName: null,
        message:
          "No referrer found",
      };
    }

    // ======================================================
    // SELF REFERRAL PROTECTION
    // ======================================================

    if (
      String(referrer._id) ===
      String(winner._id)
    ) {
      return {
        success: false,
        bonus: 0,
        percentage,
        referrerId: null,
        referrerName: null,
        message:
          "Self referral is not allowed",
      };
    }

    // ======================================================
    // CALCULATE REFERRAL BONUS
    // ======================================================

    const referralBonus =
      Number(
        (
          (
            Number(winAmount) *
            percentage
          ) / 100
        ).toFixed(2)
      );

    if (
      referralBonus <= 0
    ) {
      return {
        success: false,
        bonus: 0,
        percentage,
        referrerId:
          referrer._id,
        referrerName:
          referrer.name,
        message:
          "Referral bonus is zero",
      };
    }

    // ======================================================
    // ADD BONUS TO REFERRER
    // ======================================================

    const updatedReferrer =
      await User.findByIdAndUpdate(
        referrer._id,
        {
          $inc: {
            balance:
              referralBonus,

            referralEarning:
              referralBonus,
          },
        },
        {
          new: true,
        }
      );

    if (!updatedReferrer) {
      return {
        success: false,
        bonus: 0,
        percentage,
        referrerId:
          referrer._id,
        referrerName:
          referrer.name,
        message:
          "Failed to update referrer account",
      };
    }

    // ======================================================
    // LOG
    // ======================================================

    console.log(
      "=========================================="
    );

    console.log(
      "UAE POWERBALL REFERRAL BONUS"
    );

    console.log(
      "Winner:",
      winner.name
    );

    console.log(
      "Winner ID:",
      winner._id
    );

    console.log(
      "Winning Amount:",
      winAmount
    );

    console.log(
      "Bonus Percentage:",
      percentage + "%"
    );

    console.log(
      "Referrer:",
      updatedReferrer.name
    );

    console.log(
      "Referrer ID:",
      updatedReferrer._id
    );

    console.log(
      "Referral Bonus:",
      referralBonus
    );

    console.log(
      "New Referrer Balance:",
      updatedReferrer.balance
    );

    console.log(
      "=========================================="
    );

    return {
      success: true,

      bonus:
        referralBonus,

      percentage,

      referrerId:
        updatedReferrer._id,

      referrerName:
        updatedReferrer.name,

      referrerBalance:
        updatedReferrer.balance,
    };
  } catch (error) {
    console.error(
      "UAE Referral Betting Bonus Error:",
      error
    );

    return {
      success: false,
      bonus: 0,
      percentage: 0,
      referrerId: null,
      referrerName: null,
      message:
        error.message,
    };
  }
};

// ==========================================================
// CREATE POWERBALL RESULT
// ==========================================================

exports.createPowerballResult =
  async (req, res) => {
    try {
      const {
        gamePoolId,
        numbers,
        powerball,
      } = req.body;

      // ====================================================
      // VALIDATION
      // ====================================================

      if (!gamePoolId) {
        return res.status(400).json({
          success: false,
          message:
            "Game Pool ID is required.",
        });
      }

      if (
        !numbers ||
        !Array.isArray(numbers) ||
        numbers.length !== 7
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Exactly 7 winning numbers are required.",
        });
      }

      if (
        powerball ===
          undefined ||
        powerball ===
          null ||
        powerball ===
          ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Powerball is required.",
        });
      }

      // ====================================================
      // FIND GAME POOL
      // ====================================================

      const gamePool =
        await GamePool.findById(
          gamePoolId
        );

      if (!gamePool) {
        return res.status(404).json({
          success: false,
          message:
            "Game pool not found.",
        });
      }

      if (
        gamePool.status !==
        "Open"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Game pool is already processed or closed.",
        });
      }

      // ====================================================
      // CHECK EXISTING RESULT
      // ====================================================

      const exists =
        await PowerballResult.findOne({
          gamePoolId,
        });

      if (exists) {
        return res.status(400).json({
          success: false,
          message:
            "Result already declared for this game pool.",
        });
      }

      // ====================================================
      // CREATE RESULT
      // ====================================================

      const result =
        await PowerballResult.create({
          gamePoolId,

          drawNo:
            gamePool.drawNo,

          numbers,

          powerball,

          createdBy:
            req.user.id,
        });

      // ====================================================
      // PROCESS PLAYERS
      // ====================================================

      let poolWinners = 0;

      let totalPrizeAmount = 0;

      const userUpdates = [];

      // Referral statistics
      let totalReferralBonus = 0;

      let totalReferralBonusCount =
        0;

      const referralBonusUpdates =
        [];

      // ====================================================
      // PROCESS EVERY PLAYER
      // ====================================================

      for (
        const player of
          gamePool.players
      ) {
        if (
          player.status !==
          "Pending"
        ) {
          continue;
        }

        let bestDivision =
          null;

        let bestGameNo =
          null;

        // ==================================================
        // CHECK EVERY GAME
        // ==================================================

        for (
          const game of
            player.games
        ) {
          const matchedMain =
            game.numbers.filter(
              (num) =>
                numbers.includes(
                  num
                )
            ).length;

          const matchedPowerball =
            String(
              game.powerball
            ) ===
            String(
              powerball
            );

          const division =
            divisions.find(
              (d) =>
                d.main ===
                  matchedMain &&
                d.powerball ===
                  matchedPowerball
            );

          if (
            division &&
            (
              !bestDivision ||
              division.division <
                bestDivision.division
            )
          ) {
            bestDivision = {
              division:
                division.division,

              prize:
                division.prize,

              matchedMain,

              matchedPowerball,

              gameNo:
                game.gameNo,
            };

            bestGameNo =
              game.gameNo;
          }
        }

        // ==================================================
        // WINNER
        // ==================================================

        if (bestDivision) {
          player.status =
            "Won";

          player.result = {
            division:
              bestDivision.division,

            prize:
              bestDivision.prize,

            gameNo:
              bestGameNo,

            referralBonus:
              0,

            referralPercentage:
              0,

            referrerId:
              null,
          };

          poolWinners++;

          totalPrizeAmount +=
            bestDivision.prize;

          if (
            player.user
          ) {
            userUpdates.push({
              userId:
                player.user,

              amount:
                bestDivision.prize,

              playerId:
                player._id,

              division:
                bestDivision.division,

              gameNo:
                bestGameNo,
            });
          }
        }

        // ==================================================
        // LOSER
        // ==================================================

        else {
          player.status =
            "Lost";

          player.result = {
            division:
              null,

            prize:
              0,

            gameNo:
              null,

            referralBonus:
              0,

            referralPercentage:
              0,

            referrerId:
              null,
          };
        }
      }

      // ====================================================
      // UPDATE POOL STATUS
      // ====================================================

      gamePool.status =
        "Completed";

      gamePool.resultDeclared =
        true;

      gamePool.winningNumbers = {
        numbers:
          numbers,

        powerball:
          powerball,
      };

      await gamePool.save();

      // ====================================================
      // UPDATE USER BALANCES + REFERRAL BONUS
      // ====================================================

      const updatedUsers = [];

      for (
        const update of
          userUpdates
      ) {
        try {
          const user =
            await User.findById(
              update.userId
            );

          if (!user) {
            console.error(
              "Winner user not found:",
              update.userId
            );

            continue;
          }

          // ==================================================
          // WINNER PRIZE
          // ==================================================

          const oldBalance =
            Number(
              user.balance
            ) || 0;

          const prizeAmount =
            Number(
              update.amount
            ) || 0;

          user.balance =
            oldBalance +
            prizeAmount;

          await user.save();

          // ==================================================
          // REFERRAL BONUS
          // ==================================================

          const referralResult =
            await addReferralBettingBonus(
              user,
              prizeAmount
            );

          // ==================================================
          // FIND PLAYER
          // ==================================================

          const player =
            gamePool.players.id(
              update.playerId
            );

          // ==================================================
          // SAVE REFERRAL DATA
          // ==================================================

          if (
            player
          ) {
            player.result =
              player.result ||
              {};

            player.result.referralBonus =
              referralResult.success
                ? referralResult.bonus
                : 0;

            player.result.referralPercentage =
              referralResult.success
                ? referralResult.percentage
                : 0;

            player.result.referrerId =
              referralResult.success
                ? referralResult.referrerId
                : null;
          }

          // ==================================================
          // RESPONSE DATA
          // ==================================================

          let referralBonus =
            0;

          let referralPercentage =
            0;

          let referrerId =
            null;

          let referrerName =
            null;

          if (
            referralResult.success
          ) {
            referralBonus =
              referralResult.bonus;

            referralPercentage =
              referralResult.percentage;

            referrerId =
              referralResult.referrerId;

            referrerName =
              referralResult.referrerName;

            totalReferralBonus +=
              referralBonus;

            totalReferralBonusCount++;

            referralBonusUpdates.push({
              winnerId:
                user._id,

              winnerName:
                user.name,

              prizeAmount:

                prizeAmount,

              percentage:
                referralPercentage,

              referrerId:
                referrerId,

              referrerName:
                referrerName,

              bonus:
                referralBonus,
            });
          }

          // ==================================================
          // WINNER RESPONSE
          // ==================================================

          updatedUsers.push({
            userId:
              user._id,

            userName:
              user.name,

            email:
              user.email,

            oldBalance:
              oldBalance,

            newBalance:
              user.balance,

            amountAdded:
              prizeAmount,

            division:
              update.division,

            gameNo:
              update.gameNo,

            referralBonus:
              referralBonus,

            referralPercentage:
              referralPercentage,

            referrerId:
              referrerId,

            referrerName:
              referrerName,
          });
        } catch (error) {
          console.error(
            `Error updating user ${update.userId}:`,
            error
          );
        }
      }

      // ====================================================
      // SAVE REFERRAL DATA
      // ====================================================

      await gamePool.save();

      // ====================================================
      // RESPONSE
      // ====================================================

      return res.status(201).json({
        success:
          true,

        message:
          "UAE Powerball result declared successfully. Winners and referral bonuses have been credited.",

        result,

        poolProcessed: {
          id:
            gamePool._id,

          drawNo:
            gamePool.drawNo,

          totalPlayers:
            gamePool.totalPlayers,

          totalWinners:
            poolWinners,

          totalPrizeAmount:
            Number(
              totalPrizeAmount.toFixed(
                2
              )
            ),

          totalReferralBonus:
            Number(
              totalReferralBonus.toFixed(
                2
              )
            ),

          totalReferralBonusCount:
            totalReferralBonusCount,
        },

        winnersUpdated:
          updatedUsers,

        referralBonuses:
          referralBonusUpdates,
      });
    } catch (error) {
      console.error(
        "Create UAE Powerball Result Error:",
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
// GET ALL RESULTS
// ==========================================================

exports.getAllPowerballResults =
  async (req, res) => {
    try {
      const results =
        await PowerballResult.find()
          .populate(
            "createdBy",
            "name email"
          )
          .populate(
            "gamePoolId",
            "ticketType gameType gameCount totalPlayers"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success:
          true,

        total:
          results.length,

        results:
          results,
      });
    } catch (error) {
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

exports.getPowerballResultById =
  async (req, res) => {
    try {
      const result =
        await PowerballResult.findById(
          req.params.id
        )
          .populate(
            "createdBy",
            "name email"
          )
          .populate(
            "gamePoolId",
            "ticketType gameType gameCount totalPlayers players"
          );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Result not found.",
        });
      }

      const gamePool =
        await GamePool.findById(
          result.gamePoolId
        )
          .populate(
            "players.user",
            "name email balance username referralCode referredBy referredByUser"
          );

      const winnerDetails =
        gamePool?.players
          .filter(
            (p) =>
              p.status ===
              "Won"
          )
          .map(
            (p) => ({
              userId:
                p.user?._id,

              userName:
                p.user?.name,

              email:
                p.user?.email,

              username:
                p.user?.username,

              balance:
                p.user?.balance,

              prize:
                p.result?.prize ||
                0,

              division:
                p.result?.division,

              gameNo:
                p.result?.gameNo,

              referralBonus:
                p.result
                  ?.referralBonus ||
                0,

              referralPercentage:
                p.result
                  ?.referralPercentage ||
                0,

              referrerId:
                p.result
                  ?.referrerId ||
                null,
            })
          ) || [];

      const totalWinners =
        winnerDetails.length;

      const totalPrize =
        winnerDetails.reduce(
          (
            sum,
            winner
          ) =>
            sum +
            (
              Number(
                winner.prize
              ) || 0
            ),
          0
        );

      const totalReferralBonus =
        winnerDetails.reduce(
          (
            sum,
            winner
          ) =>
            sum +
            (
              Number(
                winner.referralBonus
              ) || 0
            ),
          0
        );

      return res.json({
        success:
          true,

        result,

        winnerDetails,

        totalWinners,

        totalPrize,

        totalReferralBonus,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================================
// DELETE RESULT
// ==========================================================

exports.deletePowerballResult =
  async (req, res) => {
    try {
      const result =
        await PowerballResult.findById(
          req.params.id
        );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Result not found.",
        });
      }

      const gamePool =
        await GamePool.findById(
          result.gamePoolId
        );

      if (gamePool) {
        // ==================================================
        // GET WINNING PLAYERS
        // ==================================================

        const winningPlayers =
          gamePool.players.filter(
            (player) =>
              player.status ===
                "Won" &&
              player.result &&
              Number(
                player.result.prize
              ) > 0
          );

        // ==================================================
        // REVERSE BALANCES
        // ==================================================

        const reversedUsers =
          [];

        for (
          const player of
            winningPlayers
        ) {
          try {
            if (
              !player.user
            ) {
              continue;
            }

            const user =
              await User.findById(
                player.user
              );

            if (!user) {
              continue;
            }

            // ==============================================
            // REVERSE WINNER PRIZE
            // ==============================================

            const oldBalance =
              Number(
                user.balance
              ) || 0;

            const prizeAmount =
              Number(
                player.result.prize
              ) || 0;

            user.balance =
              Math.max(
                0,
                oldBalance -
                  prizeAmount
              );

            // ==============================================
            // REVERSE REFERRAL BONUS
            // ==============================================

            const referralBonus =
              Number(
                player.result
                  ?.referralBonus
              ) || 0;

            let referrer =
              null;

            if (
              referralBonus >
              0
            ) {
              // --------------------------------------------
              // 1. STORED REFERRER ID
              // --------------------------------------------

              if (
                player.result
                  ?.referrerId &&
                mongoose.Types.ObjectId.isValid(
                  player.result
                    .referrerId
                )
              ) {
                referrer =
                  await User.findById(
                    player.result
                      .referrerId
                  );
              }

              // --------------------------------------------
              // 2. referredByUser
              // --------------------------------------------

              if (
                !referrer &&
                user.referredByUser
              ) {
                if (
                  mongoose.Types.ObjectId.isValid(
                    user.referredByUser
                  )
                ) {
                  referrer =
                    await User.findById(
                      user.referredByUser
                    );
                }
              }

              // --------------------------------------------
              // 3. referredBy OBJECT ID
              // --------------------------------------------

              if (
                !referrer &&
                user.referredBy
              ) {
                if (
                  mongoose.Types.ObjectId.isValid(
                    user.referredBy
                  )
                ) {
                  referrer =
                    await User.findById(
                      user.referredBy
                    );
                }
              }

              // --------------------------------------------
              // 4. referredBy REFERRAL CODE
              // --------------------------------------------

              if (
                !referrer &&
                user.referredBy
              ) {
                referrer =
                  await User.findOne({
                    referralCode:
                      String(
                        user.referredBy
                      ).trim(),
                  });
              }

              // --------------------------------------------
              // DEDUCT REFERRAL BONUS
              // --------------------------------------------

              if (
                referrer
              ) {
                await User.updateOne(
                  {
                    _id:
                      referrer._id,
                  },
                  {
                    $inc: {
                      balance:
                        -referralBonus,

                      referralEarning:
                        -referralBonus,
                    },
                  }
                );

                console.log(
                  "UAE Referral Bonus Reversed:",
                  referralBonus,
                  "Referrer:",
                  referrer.name
                );
              }
            }

            await user.save();

            reversedUsers.push({
              userId:
                user._id,

              userName:
                user.name,

              email:
                user.email,

              oldBalance:
                oldBalance,

              newBalance:
                user.balance,

              amountDeducted:
                prizeAmount,

              division:
                player.result
                  .division,

              referralBonusReversed:
                referralBonus,

              referrerId:
                referrer
                  ? referrer._id
                  : null,

              referrerName:
                referrer
                  ? referrer.name
                  : null,
            });
          } catch (error) {
            console.error(
              `Error reversing balance for user ${player.user}:`,
              error
            );
          }
        }

        // ==================================================
        // RESET GAME POOL
        // ==================================================

        gamePool.status =
          "Open";

        gamePool.resultDeclared =
          false;

        gamePool.winningNumbers =
          null;

        for (
          const player of
            gamePool.players
        ) {
          player.status =
            "Pending";

          player.result = {
            division:
              null,

            prize:
              0,

            gameNo:
              null,

            referralBonus:
              0,

            referralPercentage:
              0,

            referrerId:
              null,
          };
        }

        await gamePool.save();

        // ==================================================
        // DELETE RESULT
        // ==================================================

        await result.deleteOne();

        return res.json({
          success:
            true,

          message:
            "Result deleted successfully. Game pool has been reset and winner/referral balances reversed.",

          reversedUsers:
            reversedUsers,

          totalReversed:
            reversedUsers.length,
        });
      }

      // ====================================================
      // NO GAME POOL
      // ====================================================

      await result.deleteOne();

      return res.json({
        success:
          true,

        message:
          "Result deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete UAE Powerball Result Error:",
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
// GET RESULTS BY GAME POOL
// ==========================================================

exports.getResultsByGamePool =
  async (req, res) => {
    try {
      const {
        gamePoolId,
      } = req.params;

      const result =
        await PowerballResult.findOne({
          gamePoolId,
        })
          .populate(
            "createdBy",
            "name email"
          )
          .populate(
            "gamePoolId",
            "ticketType gameType gameCount totalPlayers"
          );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "No result found for this game pool.",
        });
      }

      const gamePool =
        await GamePool.findById(
          gamePoolId
        )
          .populate(
            "ticketType",
            "name price"
          )
          .populate(
            "gameCount",
            "name count"
          )
          .populate(
            "players.user",
            "name email username balance referralCode referredBy referredByUser"
          );

      // ====================================================
      // GET WINNERS
      // ====================================================

      const winners =
        gamePool?.players
          .filter(
            (p) =>
              p.status ===
              "Won"
          )
          .map(
            (p) => ({
              userId:
                p.user?._id,

              userName:
                p.user?.name,

              email:
                p.user?.email,

              balance:
                p.user?.balance,

              prize:
                p.result?.prize ||
                0,

              division:
                p.result?.division,

              gameNo:
                p.result?.gameNo,

              referralBonus:
                p.result
                  ?.referralBonus ||
                0,

              referralPercentage:
                p.result
                  ?.referralPercentage ||
                0,

              referrerId:
                p.result
                  ?.referrerId ||
                null,
            })
          ) || [];

      const totalReferralBonus =
        winners.reduce(
          (
            sum,
            winner
          ) =>
            sum +
            (
              Number(
                winner.referralBonus
              ) || 0
            ),
          0
        );

      return res.json({
        success:
          true,

        result,

        poolDetails:
          gamePool,

        winners,

        totalWinners:
          winners.length,

        totalReferralBonus:
          totalReferralBonus,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================================
// GET PENDING GAME BY PLAYER ID
// ==========================================================

exports.getPendingGameByPlayerId =
  async (req, res) => {
    try {
      const {
        playerId,
      } = req.params;

      if (!playerId) {
        return res.status(400).json({
          success: false,
          message:
            "Player ID is required.",
        });
      }

      const gamePool =
        await GamePool.findOne({
          "players._id":
            playerId,

          status:
            "Open",
        })
          .populate(
            "ticketType",
            "name price description"
          )
          .populate(
            "gameCount",
            "name count"
          )
          .populate(
            "players.user",
            "name email username"
          )
          .lean();

      if (!gamePool) {
        return res.status(404).json({
          success: false,
          message:
            "Pending game not found or already processed.",
        });
      }

      const player =
        gamePool.players.find(
          (p) =>
            p._id.toString() ===
            playerId.toString()
        );

      if (!player) {
        return res.status(404).json({
          success: false,
          message:
            "Player not found in this game pool.",
        });
      }

      const pendingGame = {
        poolId:
          gamePool._id,

        playerId:
          player._id,

        userId:
          player.user,

        games:
          player.games.map(
            (game) => ({
              gameNo:
                game.gameNo,

              numbers:
                game.numbers,

              powerball:
                game.powerball,
            })
          ),

        bidAmount:
          player.bidAmount,

        currencyDetails:
          player.currencyDetails,

        drawNo:
          gamePool.drawNo,

        ticketType:
          gamePool.ticketType,

        gameCount:
          gamePool.gameCount,

        playerStatus:
          player.status,

        poolStatus:
          gamePool.status,

        poolTotalPlayers:
          gamePool.totalPlayers,

        poolTotalAmount:
          gamePool.totalAmount,

        createdAt:
          gamePool.createdAt,
      };

      return res.json({
        success:
          true,

        game:
          pendingGame,
      });
    } catch (error) {
      console.error(
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
// GET ALL PENDING GAMES
// ==========================================================

exports.getAllPendingGames =
  async (req, res) => {
    try {
      const gamePools =
        await GamePool.find({
          status:
            "Open",
        })
          .populate(
            "ticketType",
            "name price description"
          )
          .populate(
            "gameCount",
            "name totalGames price"
          )
          .populate(
            "players.user",
            "name email username"
          );

      const pendingGames =
        [];

      gamePools.forEach(
        (pool) => {
          pool.players.forEach(
            (player) => {
              if (
                player.status ===
                "Pending"
              ) {
                pendingGames.push({
                  poolId:
                    pool._id,

                  drawNo:
                    pool.drawNo,

                  playerId:
                    player._id,

                  userId:
                    player.user?._id,

                  userName:
                    player.user?.name,

                  userEmail:
                    player.user?.email,

                  userUsername:
                    player.user?.username,

                  bidAmount:
                    player.bidAmount,

                  currencyDetails:
                    player.currencyDetails,

                  games:
                    player.games,

                  playerStatus:
                    player.status,

                  poolStatus:
                    pool.status,

                  createdAt:
                    pool.createdAt,
                });
              }
            }
          );
        }
      );

      return res.json({
        success:
          true,

        total:
          pendingGames.length,

        games:
          pendingGames,
      });
    } catch (error) {
      console.error(
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
// GET GAME POOL DETAILS
// ==========================================================

exports.getGamePoolDetails =
  async (req, res) => {
    try {
      const {
        poolId,
      } = req.params;

      const gamePool =
        await GamePool.findById(
          poolId
        )
          .populate(
            "ticketType",
            "name price description"
          )
          .populate(
            "gameCount",
            "name totalGames price"
          )
          .populate(
            "players.user",
            "name email username balance"
          );

      if (!gamePool) {
        return res.status(404).json({
          success: false,
          message:
            "Game pool not found.",
        });
      }

      // ====================================================
      // STATISTICS
      // ====================================================

      const totalPlayers =
        gamePool.players.length;

      const pendingPlayers =
        gamePool.players.filter(
          (p) =>
            p.status ===
            "Pending"
        ).length;

      const wonPlayers =
        gamePool.players.filter(
          (p) =>
            p.status ===
            "Won"
        ).length;

      const lostPlayers =
        gamePool.players.filter(
          (p) =>
            p.status ===
            "Lost"
        ).length;

      const totalPrize =
        gamePool.players
          .filter(
            (p) =>
              p.status ===
              "Won"
          )
          .reduce(
            (
              sum,
              p
            ) =>
              sum +
              (
                Number(
                  p.result
                    ?.prize
                ) || 0
              ),
            0
          );

      const totalReferralBonus =
        gamePool.players
          .filter(
            (p) =>
              p.status ===
              "Won"
          )
          .reduce(
            (
              sum,
              p
            ) =>
              sum +
              (
                Number(
                  p.result
                    ?.referralBonus
                ) || 0
              ),
            0
          );

      return res.json({
        success:
          true,

        pool:
          gamePool,

        statistics: {
          totalPlayers,

          pendingPlayers,

          wonPlayers,

          lostPlayers,

          totalPrize,

          totalReferralBonus,
        },
      });
    } catch (error) {
      console.error(
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
// GET USER WINNING HISTORY
// ==========================================================

exports.getUserWinningHistory =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const gamePools =
        await GamePool.find({
          "players.user":
            userId,

          "players.status":
            "Won",

          resultDeclared:
            true,
        })
          .populate(
            "ticketType",
            "name price"
          )
          .populate(
            "gameCount",
            "name totalGames"
          )
          .sort({
            createdAt:
              -1,
          });

      const winningHistory =
        [];

      let totalEarnings =
        0;

      let totalReferralBonus =
        0;

      gamePools.forEach(
        (pool) => {
          const player =
            pool.players.find(
              (p) =>
                p.user.toString() ===
                  userId.toString() &&
                p.status ===
                  "Won"
            );

          if (
            player &&
            player.result
          ) {
            const prize =
              Number(
                player.result
                  .prize
              ) || 0;

            const referralBonus =
              Number(
                player.result
                  .referralBonus
              ) || 0;

            totalEarnings +=
              prize;

            totalReferralBonus +=
              referralBonus;

            winningHistory.push({
              drawNo:
                pool.drawNo,

              gamePoolId:
                pool._id,

              ticketType:
                pool.ticketType,

              gameCount:
                pool.gameCount,

              division:
                player.result
                  .division,

              prize:
                prize,

              gameNo:
                player.result
                  .gameNo,

              referralBonus:
                referralBonus,

              referralPercentage:
                player.result
                  .referralPercentage ||
                0,

              referrerId:
                player.result
                  .referrerId ||
                null,

              winningNumbers:
                pool.winningNumbers,

              declaredAt:
                pool.updatedAt ||
                pool.createdAt,

              status:
                pool.status,
            });
          }
        }
      );

      return res.json({
        success:
          true,

        total:
          winningHistory.length,

        totalEarnings:
          totalEarnings,

        totalReferralBonus:
          totalReferralBonus,

        history:
          winningHistory,
      });
    } catch (error) {
      console.error(
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
// GET USER BALANCE
// ==========================================================

exports.getUserBalance =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const user =
        await User.findById(
          userId
        ).select(
          "balance name email username"
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      return res.json({
        success:
          true,

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          username:
            user.username,

          balance:
            user.balance ||
            0,
        },
      });
    } catch (error) {
      console.error(
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };