const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/authmodel");
const crypto = require("crypto");

const {
    sendResetPasswordOTP,
} = require("../utils/mailer.js");


const generateToken = (id, name, email) => {
    return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

const generateReferralCode = (name) => {
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return name.replace(/\s+/g, "").substring(0, 4).toUpperCase() + random;
};



const register = async (req, res) => {
    try {
        let { name, email, mobile, password, country, referralCode } = req.body;

        // ================= VALIDATION =================
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        name = name.trim().toLowerCase();
        email = email.trim().toLowerCase();
        mobile = mobile.trim();

        if (/\s/.test(name)) {
            return res.status(400).json({
                success: false,
                message: "Space is not allowed in name",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const userExist = await User.findOne({
            $or: [
                { name },
                { email },
                { mobile },
            ],
        });

        if (userExist) {
            let message = "User already exists";

            if (userExist.name === name) {
                message = "Username already taken";
            } else if (userExist.email === email) {
                message = "Email already registered";
            } else if (userExist.mobile === mobile) {
                message = "Mobile number already registered";
            }

            return res.status(400).json({
                success: false,
                message,
            });
        }

        // ================= VALIDATE REFERRAL CODE =================
        let referrerUser = null;
        if (referralCode) {
            referralCode = referralCode.trim().toUpperCase();
            referrerUser = await User.findOne({ referralCode });

            if (!referrerUser) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid referral code",
                });
            }

            // Check if referrer is blocked
            if (referrerUser.status === "blocked") {
                return res.status(403).json({
                    success: false,
                    message: "Referrer account is blocked",
                });
            }
        }

        // ================= HASH PASSWORD =================
        const hashedPassword = await bcrypt.hash(password, 10);

        // ================= GENERATE REFERRAL CODE =================
        const newReferralCode = generateReferralCode(name);

        // ================= CREATE USER =================
        const user = await User.create({
            name: name,
            email: email,
            mobile: mobile,
            password: hashedPassword,
            plainPassword: password,
            role: "user",
            country: country,
            referralCode: newReferralCode,
            referredBy: referralCode || null,
            referredByUser: referrerUser ? referrerUser._id : null,
        });

        // ================= UPDATE REFERRER STATS =================
        if (referrerUser) {
            await User.findByIdAndUpdate(referrerUser._id, {
                $inc: {
                    totalReferrals: 1,
                    referralEarning: 50,
                }
            });
        }

        // ================= GENERATE TOKEN =================
        const token = generateToken(user._id, user.name, user.email);

        // ================= SET COOKIE =================
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // ================= REMOVE PASSWORD =================
        const userObj = user.toObject();
        delete userObj.password;

        // ================= RESPONSE =================
        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: userObj,
        });

    } catch (error) {
        // Duplicate Key Error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            let message = "Duplicate field";

            if (field === "name") {
                message = "Username already taken";
            } else if (field === "email") {
                message = "Email already registered";
            } else if (field === "mobile") {
                message = "Mobile already registered";
            } else if (field === "referralCode") {
                message = "Referral code already exists";
            }

            return res.status(400).json({
                success: false,
                message,
            });
        }

        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// ======================================================
// LOGIN
// ======================================================

const login = async (req, res) => {
    try {
        let { mobile, password } = req.body;

        console.log(req.body)

        // ================= VALIDATION =================
        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Mobile and password are required",
            });
        }

        // ================= NORMALIZE =================
        mobile = mobile.trim();

        // ================= FIND USER =================
        const user = await User.findOne({ mobile }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // ================= BLOCK CHECK =================
        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked",
            });
        }

        // ================= PASSWORD CHECK =================
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobile or password",
            });
        }

        // ================= GENERATE TOKEN =================
        const token = generateToken(
            user._id,
            user.name,
            user.mobile,
            user.role
        );

        // Cookie Name
        const cookieName =
            user.role === "admin" ? "adminToken" : "token";

        // ================= SET COOKIE =================
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // ================= REMOVE PASSWORD =================
        const userObj = user.toObject();
        delete userObj.password;

        // ================= RESPONSE =================
        return res.status(200).json({
            success: true,
            message: `${user.role} login successful`,
            token,
            role: user.role,
            user: userObj,
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// ======================================================
// GET PROFILE
// ======================================================

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // ==========================
        // Currency Conversion using CurrencyRate Model
        // ==========================
        const CurrencyRate = require('../models/CurrencyRate');

        let balanceInLocalCurrency = user.balance; // Default in INR
        let conversionRate = 1;
        let currencyCode = 'INR';
        let countryCode = user.country || 'IN';

        // Fetch currency rate from database
        if (countryCode) {
            const currencyRate = await CurrencyRate.findOne({
                countryCode: countryCode,
                status: true
            }).lean();

            if (currencyRate) {
                conversionRate = Number(currencyRate.rate);
                currencyCode = currencyRate.currencyCode;
                // Convert INR balance to local currency
                balanceInLocalCurrency = user.balance / conversionRate;
            }
        }

        // Prepare response with converted balance
        const userResponse = {
            ...user,
            balance: {
                inr: user.balance,
                local: parseFloat(balanceInLocalCurrency.toFixed(2)),
                currencyCode: currencyCode,
                conversionRate: conversionRate,
                countryCode: countryCode
            }
        };

        return res.status(200).json({
            success: true,
            user: userResponse,
        });

    } catch (error) {
        console.error("GET PROFILE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// ======================================================
// UPDATE PROFILE
// ======================================================

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            fullName,
            username,
            email,
            mobile,
            city,
        } = req.body;

        const updateData = {};

        // ================= FULL NAME =================
        if (fullName !== undefined) {
            updateData.name = fullName.trim();
        }

        // ================= USERNAME =================
        if (username !== undefined) {
            const normalizedUsername = username.trim().toLowerCase();

            if (normalizedUsername.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Username must be at least 3 characters",
                });
            }

            const existingUsername = await User.findOne({
                username: normalizedUsername,
                _id: { $ne: userId },
            });

            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Username already taken",
                });
            }

            updateData.username = normalizedUsername;
        }

        // ================= EMAIL =================
        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid email address",
                });
            }

            const existingEmail = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: userId },
            });

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email already registered",
                });
            }

            updateData.email = normalizedEmail;
        }

        // ================= MOBILE =================
        if (mobile !== undefined) {
            const normalizedMobile = mobile.replace(/\D/g, "");

            if (!/^[0-9]{10}$/.test(normalizedMobile)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid 10-digit mobile number",
                });
            }

            const existingMobile = await User.findOne({
                mobile: normalizedMobile,
                _id: { $ne: userId },
            });

            if (existingMobile) {
                return res.status(400).json({
                    success: false,
                    message: "Mobile number already registered",
                });
            }

            updateData.mobile = normalizedMobile;
        }

        // ================= CITY =================
        if (city !== undefined) {
            updateData.city = city.trim();
        }

        // ================= NOTHING TO UPDATE =================
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided to update",
            });
        }

        updateData.updatedAt = new Date();

        // ================= UPDATE =================
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });

    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];

            let message = "Duplicate field";

            if (field === "username") {
                message = "Username already taken";
            } else if (field === "email") {
                message = "Email already registered";
            } else if (field === "mobile") {
                message = "Mobile number already registered";
            }

            return res.status(400).json({
                success: false,
                message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};
// ======================================================
// LOGOUT
// ======================================================

const logout = async (req, res) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(0),
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });

    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// ======================================================
// FORGOT PASSWORD (WITH OTP)
// ======================================================

const forgotPassword = async (req, res) => {
    try {
        let { email } = req.body;

        // ================= VALIDATION =================
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // ================= NORMALIZE =================
        email = email.trim().toLowerCase();

        // ================= FIND USER =================
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // ================= CHECK BLOCKED =================
        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked",
            });
        }

        // ================= GENERATE OTP =================
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // ================= SAVE OTP =================
        user.reset_otp = otp;
        user.reset_otp_expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await user.save();

        // ================= SEND EMAIL =================
        const isSent = await sendResetPasswordOTP(user.email, otp);

        if (!isSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP",
            });
        }

        // ================= RESPONSE =================
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully to your email",
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// ======================================================
// VERIFY OTP & RESET PASSWORD
// ======================================================

const verifyOTPAndReset = async (req, res) => {
    try {
        let { email, otp, newPassword } = req.body;

        // ================= VALIDATION =================
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and new password are required",
            });
        }

        // ================= NORMALIZE =================
        email = email.trim().toLowerCase();

        // ================= PASSWORD LENGTH =================
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        // ================= FIND USER =================
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // ================= ACCOUNT STATUS =================
        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked",
            });
        }

        // ================= OTP CHECK =================
        if (!user.reset_otp || user.reset_otp !== otp.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // ================= OTP EXPIRY =================
        if (!user.reset_otp_expiry || new Date() > new Date(user.reset_otp_expiry)) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // ================= HASH PASSWORD =================
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // ================= UPDATE PASSWORD =================
        user.password = hashedPassword;
        user.plainPassword = newPassword;

        // ================= CLEAR OTP =================
        user.reset_otp = null;
        user.reset_otp_expiry = null;

        await user.save();

        // ================= RESPONSE =================
        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// ======================================================
// CHANGE PASSWORD
// ======================================================

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: "Both passwords required",
            });
        }

        const user = await User.findById(req.user.id).select("+password");
        if (!user)
            return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Old password incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};


const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select("-password -plainPassword")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Get All Users Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users.",
            error: error.message,
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!["active", "blocked"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active or blocked",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.status = status;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${status} successfully`,
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,  // <-- Added updateProfile
    logout,
    forgotPassword,
    verifyOTPAndReset,
    changePassword,
    getAllUsers,
    updateUserStatus
};