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

    gameTypes: {
      type: [String],
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

    // Market Image
    image: {
      type: String,
      default: null,
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
      default: 10,
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

module.exports =
  mongoose.models.markets ||
  mongoose.model("markets", marketSchema);