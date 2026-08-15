const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    marketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gameType: {
      type: String,
      enum: [
        "single",
        "jodi",
        "panna",
        "half-sangam",
        "full-sangam",
        "last-digit",
        "first-digit",
      ],
      required: true,
    },
    openTime: {
      type: String,
      required: true,
    },
    closeTime: {
      type: String,
      required: true,
    },
    resultTime: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isResultDeclared: {
      type: Boolean,
      default: false,
    },
    minBid: {
      type: Number,
      default: 10,
    },
    maxBid: {
      type: Number,
      default: 10000,
    },
    winningMultiplier: {
      type: Number,
      default: 10, // X0-X9 and 1X-9X payout
    },
    description: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("markets", marketSchema);