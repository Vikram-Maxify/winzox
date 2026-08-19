const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "markets",
      required: true,
      index: true,
    },

    marketName: {
      type: String,
      required: true,
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

    winningNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          const str = String(value).trim();

          switch (this.gameType) {
            case "single":
              // Single: 0-9
              return /^[0-9]$/.test(str);

            case "jodi":
              // Jodi: 00-99
              return /^[0-9]{2}$/.test(str);

            case "panna":
              // Panna: 000-999
              return /^[0-9]{3}$/.test(str);

            case "half-sangam":
              // Half-Sangam: 1-digit or 3-digit
              // Example: 5 or 123
              return /^[0-9]{1}$/.test(str) || /^[0-9]{3}$/.test(str);

            case "full-sangam":
              // Full-Sangam: 2-digit number
              // Example: 45
              return /^[0-9]{2}$/.test(str);

            case "last-digit":
              // Last Digit: 2-digit number
              // Example: 25 (last digit 5 will be used for matching)
              return /^[0-9]{2}$/.test(str);

            case "first-digit":
              // First Digit: 2-digit number
              // Example: 25 (first digit 2 will be used for matching)
              return /^[0-9]{2}$/.test(str);

            default:
              return false;
          }
        },
        message: function (props) {
          const gameTypeMap = {
            single: "single digit (0-9)",
            jodi: "2-digit number (00-99)",
            panna: "3-digit number (000-999)",
            "half-sangam": "1-digit or 3-digit number",
            "full-sangam": "2-digit number (00-99)",
            "last-digit": "2-digit number (00-99)",
            "first-digit": "2-digit number (00-99)",
          };
          return `Invalid winning number for ${this.gameType}. Expected format: ${gameTypeMap[this.gameType] || "valid number"}`;
        },
      },
    },

    // Store extracted digits for easier querying
    winningLastDigit: {
      type: String,
      default: null,
    },

    winningFirstDigit: {
      type: String,
      default: null,
    },

    resultDate: {
      type: Date,
      required: true,
      index: true,
    },

    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    totalBids: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWinningBids: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPayout: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "declared", "cancelled"],
      default: "declared",
    },

    remarks: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to extract digits and format numbers
resultSchema.pre("save", function (next) {
  const str = String(this.winningNumber).trim();

  // Extract last digit for last-digit games
  if (this.gameType === "last-digit") {
    this.winningLastDigit = str.slice(-1);
    this.winningFirstDigit = null;
  }
  // Extract first digit for first-digit games
  else if (this.gameType === "first-digit") {
    this.winningFirstDigit = str.charAt(0);
    this.winningLastDigit = null;
  }
  // For other games, store both as null
  else {
    this.winningLastDigit = null;
    this.winningFirstDigit = null;
  }

  // Format numbers with leading zeros
  if (
    ["jodi", "full-sangam", "last-digit", "first-digit"].includes(this.gameType)
  ) {
    this.winningNumber = str.padStart(2, "0");
  } else if (this.gameType === "panna") {
    this.winningNumber = str.padStart(3, "0");
  }
});

// Indexes for better query performance
resultSchema.index(
  { marketId: 1, resultDate: 1, gameType: 1 },
  { unique: true },
);
resultSchema.index({ resultDate: -1 });
resultSchema.index({ marketId: 1, status: 1 });
resultSchema.index({ gameType: 1, resultDate: -1 });

// Static method to get latest result for a market
resultSchema.statics.getLatestResult = async function (marketId) {
  return this.findOne({ marketId, status: "declared" })
    .sort({ resultDate: -1 })
    .exec();
};

// Static method to get results for a date range
resultSchema.statics.getResultsByDateRange = async function (
  startDate,
  endDate,
  marketId = null,
) {
  const query = {
    resultDate: { $gte: startDate, $lte: endDate },
    status: "declared",
  };

  if (marketId) {
    query.marketId = marketId;
  }

  return this.find(query).sort({ resultDate: -1 }).exec();
};

// Static method to get result statistics
resultSchema.statics.getStats = async function (marketId) {
  const stats = await this.aggregate([
    {
      $match: {
        marketId: mongoose.Types.ObjectId(marketId),
        status: "declared",
      },
    },
    {
      $group: {
        _id: null,
        totalResults: { $sum: 1 },
        totalPayout: { $sum: "$totalPayout" },
        totalWinners: { $sum: "$totalWinningBids" },
        totalBids: { $sum: "$totalBids" },
        avgPayout: { $avg: "$totalPayout" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalResults: 0,
      totalPayout: 0,
      totalWinners: 0,
      totalBids: 0,
      avgPayout: 0,
    }
  );
};

// Virtual field to get result summary
resultSchema.virtual("summary").get(function () {
  return {
    marketName: this.marketName,
    gameType: this.gameType,
    winningNumber: this.winningNumber,
    resultDate: this.resultDate,
    totalBids: this.totalBids,
    totalWinningBids: this.totalWinningBids,
    totalPayout: this.totalPayout,
  };
});

// Method to check if a bid won against this result
resultSchema.methods.checkBidWin = function (bidNumber, bidGameType) {
  const winningNumStr = String(this.winningNumber).trim();
  const bidNumStr = String(bidNumber).trim();

  // If game types don't match, return false
  if (bidGameType !== this.gameType) {
    return false;
  }

  switch (this.gameType) {
    case "single":
      return winningNumStr === bidNumStr;

    case "jodi":
      return winningNumStr === bidNumStr;

    case "panna":
      return winningNumStr === bidNumStr;

    case "half-sangam":
      // Check if either 1-digit or 3-digit matches
      return (
        winningNumStr === bidNumStr ||
        winningNumStr.slice(-1) === bidNumStr.slice(-1)
      );

    case "full-sangam":
      // Check last 2 digits
      return winningNumStr.slice(-2) === bidNumStr;

    case "last-digit":
      // Check if last digit matches
      const bidLastDigit = bidNumStr.slice(-1);
      const winningLastDigit = winningNumStr.slice(-1);
      return bidLastDigit === winningLastDigit;

    case "first-digit":
      // Check if first digit matches
      const bidFirstDigit = bidNumStr.charAt(0);
      const winningFirstDigit = winningNumStr.charAt(0);
      return bidFirstDigit === winningFirstDigit;

    default:
      return false;
  }
};

// Ensure virtuals are included in JSON output
resultSchema.set("toJSON", { virtuals: true });
resultSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("results", resultSchema);
