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
// RESULT SCHEMA
// ==========================================================

const resultSchema = new mongoose.Schema(
  {
    // ======================================================
    // MARKET
    // ======================================================

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

    // ======================================================
    // GAME TYPE
    // IMPORTANT:
    // Market has gameTypes[]
    // Result has ONE gameType
    // ======================================================

    gameType: {
      type: String,
      enum: GAME_TYPES,
      required: true,
      trim: true,
      index: true,
    },

    // ======================================================
    // WINNING NUMBER
    // ======================================================

    winningNumber: {
      type: String,
      required: true,
      trim: true,

      validate: {
        validator: function (value) {
          const str = String(value).trim();

          switch (this.gameType) {
            // ----------------------------------------------
            // SINGLE
            // 0 - 9
            // ----------------------------------------------

            case "single":
              return /^[0-9]$/.test(str);

            // ----------------------------------------------
            // JODI
            // 00 - 99
            // ----------------------------------------------

            case "jodi":
              return /^[0-9]{2}$/.test(str);

            // ----------------------------------------------
            // PANNA
            // 000 - 999
            // ----------------------------------------------

            case "panna":
              return /^[0-9]{3}$/.test(str);

            // ----------------------------------------------
            // HALF SANGAM
            // 1 digit OR 3 digit
            // ----------------------------------------------

            case "half-sangam":
              return (
                /^[0-9]$/.test(str) ||
                /^[0-9]{3}$/.test(str)
              );

            // ----------------------------------------------
            // FULL SANGAM
            // 2 digit
            // ----------------------------------------------

            case "full-sangam":
              return /^[0-9]{2}$/.test(str);

            // ----------------------------------------------
            // LAST DIGIT
            // 2 digit
            // ----------------------------------------------

            case "last-digit":
              return /^[0-9]{2}$/.test(str);

            // ----------------------------------------------
            // FIRST DIGIT
            // 2 digit
            // ----------------------------------------------

            case "first-digit":
              return /^[0-9]{2}$/.test(str);

            default:
              return false;
          }
        },

        message: function () {
          const gameTypeMap = {
            single: "single digit (0-9)",
            jodi: "2-digit number (00-99)",
            panna: "3-digit number (000-999)",
            "half-sangam":
              "1-digit or 3-digit number",
            "full-sangam":
              "2-digit number (00-99)",
            "last-digit":
              "2-digit number (00-99)",
            "first-digit":
              "2-digit number (00-99)",
          };

          return `Invalid winning number for ${
            this.gameType || "selected game"
          }. Expected format: ${
            gameTypeMap[this.gameType] ||
            "valid number"
          }`;
        },
      },
    },

    // ======================================================
    // EXTRACTED DIGITS
    // ======================================================

    winningLastDigit: {
      type: String,
      default: null,
    },

    winningFirstDigit: {
      type: String,
      default: null,
    },

    // ======================================================
    // RESULT DATE
    // ======================================================

    resultDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ======================================================
    // DECLARED BY
    // ======================================================

    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // ======================================================
    // BID STATISTICS
    // ======================================================

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

    // ======================================================
    // STATUS
    // ======================================================

    status: {
      type: String,
      enum: [
        "pending",
        "declared",
        "cancelled",
      ],
      default: "declared",
      index: true,
    },

    // ======================================================
    // REMARKS
    // ======================================================

    remarks: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================================
// PRE-SAVE MIDDLEWARE
// ==========================================================

resultSchema.pre("save", function (next) {
  try {
    if (
      this.winningNumber === undefined ||
      this.winningNumber === null
    ) {
      return next();
    }

    let str = String(this.winningNumber).trim();

    // ======================================================
    // FORMAT NUMBER
    // ======================================================

    if (
      [
        "jodi",
        "full-sangam",
        "last-digit",
        "first-digit",
      ].includes(this.gameType)
    ) {
      str = str.padStart(2, "0");
    }

    if (this.gameType === "panna") {
      str = str.padStart(3, "0");
    }

    this.winningNumber = str;

    // ======================================================
    // LAST DIGIT
    // ======================================================

    if (this.gameType === "last-digit") {
      this.winningLastDigit = str.slice(-1);
      this.winningFirstDigit = null;
    }

    // ======================================================
    // FIRST DIGIT
    // ======================================================

    else if (this.gameType === "first-digit") {
      this.winningFirstDigit = str.charAt(0);
      this.winningLastDigit = null;
    }

    // ======================================================
    // OTHER GAME TYPES
    // ======================================================

    else {
      this.winningFirstDigit = null;
      this.winningLastDigit = null;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ==========================================================
// INDEXES
// ==========================================================

// One result per market + date + game type

resultSchema.index(
  {
    marketId: 1,
    resultDate: 1,
    gameType: 1,
  },
  {
    unique: true,
  }
);

resultSchema.index({
  resultDate: -1,
});

resultSchema.index({
  marketId: 1,
  status: 1,
});

resultSchema.index({
  gameType: 1,
  resultDate: -1,
});

// ==========================================================
// STATIC: GET LATEST RESULT
// ==========================================================

resultSchema.statics.getLatestResult = async function (
  marketId,
  gameType = null
) {
  const query = {
    marketId,
    status: "declared",
  };

  if (gameType) {
    query.gameType = gameType;
  }

  return this.findOne(query)
    .sort({
      resultDate: -1,
      createdAt: -1,
    })
    .exec();
};

// ==========================================================
// STATIC: GET RESULTS BY DATE RANGE
// ==========================================================

resultSchema.statics.getResultsByDateRange =
  async function (
    startDate,
    endDate,
    marketId = null,
    gameType = null
  ) {
    const query = {
      resultDate: {
        $gte: startDate,
        $lte: endDate,
      },
      status: "declared",
    };

    if (marketId) {
      query.marketId = marketId;
    }

    if (gameType) {
      query.gameType = gameType;
    }

    return this.find(query)
      .sort({
        resultDate: -1,
      })
      .exec();
  };

// ==========================================================
// STATIC: GET STATS
// ==========================================================

resultSchema.statics.getStats = async function (
  marketId,
  gameType = null
) {
  const match = {
    marketId: new mongoose.Types.ObjectId(
      marketId
    ),
    status: "declared",
  };

  if (gameType) {
    match.gameType = gameType;
  }

  const stats = await this.aggregate([
    {
      $match: match,
    },

    {
      $group: {
        _id: null,

        totalResults: {
          $sum: 1,
        },

        totalPayout: {
          $sum: "$totalPayout",
        },

        totalWinners: {
          $sum: "$totalWinningBids",
        },

        totalBids: {
          $sum: "$totalBids",
        },

        avgPayout: {
          $avg: "$totalPayout",
        },
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

// ==========================================================
// VIRTUAL: SUMMARY
// ==========================================================

resultSchema.virtual("summary").get(function () {
  return {
    marketId: this.marketId,
    marketName: this.marketName,
    gameType: this.gameType,
    winningNumber: this.winningNumber,
    resultDate: this.resultDate,
    totalBids: this.totalBids,
    totalWinningBids:
      this.totalWinningBids,
    totalPayout: this.totalPayout,
    status: this.status,
  };
});

// ==========================================================
// METHOD: CHECK BID WIN
// ==========================================================

resultSchema.methods.checkBidWin = function (
  bidNumber,
  bidGameType
) {
  const winningNumStr = String(
    this.winningNumber
  ).trim();

  const bidNumStr = String(
    bidNumber
  ).trim();

  // ======================================================
  // GAME TYPE MUST MATCH
  // ======================================================

  if (bidGameType !== this.gameType) {
    return false;
  }

  // ======================================================
  // SINGLE
  // ======================================================

  switch (this.gameType) {
    case "single":
      return winningNumStr === bidNumStr;

    // ====================================================
    // JODI
    // ====================================================

    case "jodi":
      return winningNumStr === bidNumStr;

    // ====================================================
    // PANNA
    // ====================================================

    case "panna":
      return winningNumStr === bidNumStr;

    // ====================================================
    // HALF SANGAM
    // ====================================================

    case "half-sangam":
      return (
        winningNumStr === bidNumStr ||
        winningNumStr.slice(-1) ===
          bidNumStr.slice(-1)
      );

    // ====================================================
    // FULL SANGAM
    // ====================================================

    case "full-sangam":
      return (
        winningNumStr.slice(-2) ===
        bidNumStr.slice(-2)
      );

    // ====================================================
    // LAST DIGIT
    // ====================================================

    case "last-digit":
      return (
        winningNumStr.slice(-1) ===
        bidNumStr.slice(-1)
      );

    // ====================================================
    // FIRST DIGIT
    // ====================================================

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
// JSON / OBJECT VIRTUALS
// ==========================================================

resultSchema.set("toJSON", {
  virtuals: true,
});

resultSchema.set("toObject", {
  virtuals: true,
});

// ==========================================================
// MODEL
// IMPORTANT:
// Prevent OverwriteModelError during nodemon/reloads
// ==========================================================

module.exports =
  mongoose.models.results ||
  mongoose.model(
    "results",
    resultSchema
  );