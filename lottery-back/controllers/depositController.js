const Deposit = require("../models/Deposit");
const DepositSettings = require("../models/DepositSettings");
const User = require("../models/authmodel");
const mongoose = require("mongoose");
const ReferralCommission = require("../models/ReferralCommission");
const uploadToImgBB = require("../utils/uploadToImgBB");
const CurrencyRate = require("../models/CurrencyRate");



// ==========================================
// Create Deposit Request
// ==========================================
exports.createDeposit = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            amount,
            transactionId,
            methodType,
            methodTitle,
        } = req.body;

        // -------------------------
        // Validation
        // -------------------------

        if (
            !amount ||
            !transactionId ||
            !methodType ||
            !methodTitle
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount",
            });
        }

        // -------------------------
        // User
        // -------------------------

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.country) {
            return res.status(400).json({
                success: false,
                message: "Country not found",
            });
        }

        // -------------------------
        // Country Deposit Settings
        // -------------------------

        const settings = await DepositSettings.findOne({
            country: user.country.toUpperCase(),
        });

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "Deposit settings not found",
            });
        }

        // -------------------------
        // Find Selected Method
        // -------------------------

        const method = settings.methods.find(
            (m) =>
                m.type === methodType &&
                m.title === methodTitle &&
                m.status === true
        );

        if (!method) {
            return res.status(404).json({
                success: false,
                message: "Payment method not found",
            });
        }

        // -------------------------
        // Min Max Validation
        // -------------------------

        if (amount < method.minimumDeposit) {
            return res.status(400).json({
                success: false,
                message: `Minimum deposit is ${method.minimumDeposit}`,
            });
        }

        if (amount > method.maximumDeposit) {
            return res.status(400).json({
                success: false,
                message: `Maximum deposit is ${method.maximumDeposit}`,
            });
        }

        // -------------------------
        // Duplicate Transaction
        // -------------------------

        const already = await Deposit.findOne({
            transactionId: transactionId.trim(),
        });

        if (already) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID already used",
            });
        }

        // -------------------------
        // Screenshot
        // -------------------------

        let screenshot = "";

        if (req.file) {

            screenshot = await uploadToImgBB(req.file);

        }
        // -------------------------
        // Create Deposit
        // -------------------------

        const deposit = await Deposit.create({
            user: user._id,

            country: settings.country,

            currency: settings.currency,

            methodType,

            methodTitle,

            amount,

            transactionId: transactionId.trim(),

            screenshot,

            status: "pending",
        });

        return res.status(201).json({
            success: true,
            message: "Deposit request submitted successfully",
            deposit,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ==========================================
// Get Logged In User Deposit History
// ==========================================
exports.getUserDeposits = async (req, res) => {
    try {
        const userId = req.user.id;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const filter = {
            user: userId,
        };

        // Status Filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const total = await Deposit.countDocuments(filter);

        const deposits = await Deposit.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            deposits,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==========================================
// Get Single Deposit
// ==========================================
exports.getDepositDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const deposit = await Deposit.findOne({
            _id: id,
            user: req.user.id,
        });

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: "Deposit not found",
            });
        }

        return res.status(200).json({
            success: true,
            deposit,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ==========================================
// Admin - Get All Deposits
// ==========================================
exports.getAllDeposits = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};

        // Status Filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Country Filter
        if (req.query.country) {
            filter.country = req.query.country.toUpperCase();
        }

        // Method Filter
        if (req.query.methodType) {
            filter.methodType = req.query.methodType;
        }

        // User Search
        if (req.query.search) {

            const users = await User.find({
                $or: [
                    {
                        name: {
                            $regex: req.query.search,
                            $options: "i",
                        },
                    },
                    {
                        email: {
                            $regex: req.query.search,
                            $options: "i",
                        },
                    },
                    {
                        mobile: {
                            $regex: req.query.search,
                            $options: "i",
                        },
                    },
                ],
            }).select("_id");

            filter.user = {
                $in: users.map((u) => u._id),
            };
        }

        const total = await Deposit.countDocuments(filter);

        const deposits = await Deposit.find(filter)
            .populate(
                "user",
                "name email mobile country balance"
            )
            .sort({
                createdAt: -1,
            })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            deposits,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


// ==========================================
// Admin Pending Deposits
// ==========================================
exports.getPendingDeposits = async (req, res) => {

    try {

        const deposits = await Deposit.find({
            status: "pending",
        })
            .populate(
                "user",
                "name email mobile country"
            )
            .sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            total: deposits.length,
            deposits,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};


// ==========================================
// Admin - Approve Deposit
// ==========================================
// Currency conversion rates (you should fetch these from a live API)


exports.approveDeposit = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const { remark } = req.body;

    const deposit = await Deposit.findById(id).session(session);

    if (!deposit) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    // Prevent double approval
    if (deposit.status !== "pending") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: `Deposit already ${deposit.status}`,
      });
    }

    const user = await User.findById(deposit.user).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================
    // Currency Conversion - Get rate from database
    // ==========================
    let amountInINR = Number(deposit.amount);
    let conversionRate = 1;
    let currencyCode = 'INR';
    
    const countryCode = deposit.country || 'IN';
    
    console.log('Country Code:', countryCode);

    // Fetch currency rate from database
    if (countryCode) {
      const currencyRate = await CurrencyRate.findOne({ 
        countryCode: countryCode,
        status: true // Only fetch active rates
      }).session(session);

      if (currencyRate) {
        conversionRate = Number(currencyRate.rate);
        currencyCode = currencyRate.currencyCode;
        amountInINR = Number(deposit.amount) * conversionRate;
        
        console.log(`Rate found: ${conversionRate} for ${countryCode}`);
      } else {
        console.log(`No active rate found for ${countryCode}, using default (1:1)`);
      }
    }

    // Count previous approved deposits
    const approvedRechargeCount = await Deposit.countDocuments({
      user: user._id,
      status: "approved",
    }).session(session);

    let commissionPercent = 0;

    if (approvedRechargeCount === 0) {
      commissionPercent = 20; // 1st Recharge
    } else if (approvedRechargeCount === 1) {
      commissionPercent = 3; // 2nd Recharge
    } else if (approvedRechargeCount === 2) {
      commissionPercent = 2; // 3rd Recharge
    }

    // Credit deposit amount to user (in INR)
    user.balance += amountInINR;
    await user.save({ session });

    let referralCommission = null;

    // ==========================
    // Referral Commission (based on INR amount)
    // ==========================
    if (commissionPercent > 0 && user.referredByUser) {
      const referrer = await User.findById(user.referredByUser).session(
        session
      );

      if (referrer) {
        const commission = (amountInINR * commissionPercent) / 100;

        // Credit referrer balance
        referrer.balance += commission;

        // Total referral earning
        referrer.referralEarning += commission;

        await referrer.save({ session });

        // Save referral commission history
        referralCommission = await ReferralCommission.create(
          [
            {
              referrer: referrer._id,
              referredUser: user._id,
              deposit: deposit._id,
              depositAmount: deposit.amount,
              depositAmountINR: amountInINR,
              currencyCode: currencyCode,
              percentage: commissionPercent,
              commission,
              rechargeNumber: approvedRechargeCount + 1,
              status: "credited",
            },
          ],
          { session }
        );
      }
    }

    // Update Deposit
    deposit.status = "approved";
    deposit.approvedBy = req.user.id;
    deposit.approvedAt = new Date();
    deposit.amountInINR = amountInINR; // Store the converted amount
    deposit.conversionRate = conversionRate;
    deposit.currencyCode = currencyCode;

    if (remark) {
      deposit.remark = remark;
    }

    await deposit.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Deposit approved successfully",
      deposit,
      userBalance: user.balance,
      amountInINR,
      conversionRate: conversionRate,
      currencyCode: currencyCode,
      referralCommission:
        referralCommission && referralCommission.length
          ? referralCommission[0]
          : null,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Admin Reject Deposit
// ==========================================
exports.rejectDeposit = async (req, res) => {
    try {

        const { id } = req.params;
        const { remark } = req.body;

        const deposit = await Deposit.findById(id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: "Deposit not found",
            });
        }

        // Already Processed
        if (deposit.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Deposit already ${deposit.status}`,
            });
        }

        deposit.status = "rejected";

        deposit.rejectedAt = new Date();

        if (remark) {
            deposit.remark = remark;
        }

        await deposit.save();

        return res.status(200).json({
            success: true,
            message: "Deposit rejected successfully",
            deposit,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ==========================================
// Admin Deposit Statistics
// ==========================================
exports.getDepositStats = async (req, res) => {
    try {

        const [
            totalDeposits,
            pendingDeposits,
            approvedDeposits,
            rejectedDeposits,
            approvedAmount,
            pendingAmount,
        ] = await Promise.all([

            Deposit.countDocuments(),

            Deposit.countDocuments({
                status: "pending",
            }),

            Deposit.countDocuments({
                status: "approved",
            }),

            Deposit.countDocuments({
                status: "rejected",
            }),

            Deposit.aggregate([
                {
                    $match: {
                        status: "approved",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount",
                        },
                    },
                },
            ]),

            Deposit.aggregate([
                {
                    $match: {
                        status: "pending",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$amount",
                        },
                    },
                },
            ]),

        ]);

        return res.status(200).json({

            success: true,

            stats: {

                totalDeposits,

                pendingDeposits,

                approvedDeposits,

                rejectedDeposits,

                approvedAmount:
                    approvedAmount.length > 0
                        ? approvedAmount[0].total
                        : 0,

                pendingAmount:
                    pendingAmount.length > 0
                        ? pendingAmount[0].total
                        : 0,

            },

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

