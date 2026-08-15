const mongoose = require("mongoose");

const userschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    country:{
      type: String,
      default: null,
    },

    city: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    password: {
      type: String,
      required: true,
    },

    plainPassword: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    isDemo: {
      type: Boolean,
      default: false,
    },

    lastWithdrawalDate: {
      type: String,
      default: null,
    },

    reset_otp: {
      type: String,
      default: null,
    },

    reset_otp_expiry: {
      type: Date,
      default: null,
    },

    // =========================
    // Referral System
    // =========================

    // User ka apna referral code
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    // Registration ke time kis referral code se join kiya
    referredBy: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },

    // Referrer User ID
    referredByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },

    // Total referrals
    totalReferrals: {
      type: Number,
      default: 0,
    },

    // Referral earnings
    referralEarning: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("users", userschema);

module.exports = User;