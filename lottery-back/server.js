require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dns = require("dns");
const path = require("path");

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = require("./config/connectdb");

// ============================================
// USER ROUTES IMPORTS
// ============================================
const authRoutes = require("./routes/authRoutes");
const dailyClaimRoutes = require("./routes/dailyClaimRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const depositRoutes = require("./routes/depositRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const publicBidRoutes = require('./routes/publicBidRoutes');
const marketRoutes = require("./routes/marketRoutes");
const bidRoutes = require("./routes/bidRoutes");
const resultRoutes = require("./routes/resultRoutes");
const currencyRateRoutes = require("./routes/currencyRateRoutes");
const userTicketTypeRoutes = require("./routes/user/ticketTypeRoutes");

// ============================================
// ADMIN ROUTES IMPORTS
// ============================================
const adminWithdrawalRoutes = require("./routes/admin/withdrawalRoutes");
const depositSettingsRoutes = require("./routes/depositSettingsRoutes");
const withdrawalSettingsRoutes = require("./routes/withdrawalSettingsRoutes");
const adminTicketTypeRoutes = require("./routes/admin/ticketTypeRoutes");

// ============================================
// COUNTRY-SPECIFIC ADMIN ROUTES
// ============================================
// AUSTRALIA
const australiaGameCountRoutes = require("./routes/admin/australia/gameCountRoutes");
const australiaGameEntryRoutes = require("./routes/admin/australia/gameEntryRoutes");
const australiaPowerballResultRoutes = require("./routes/admin/australia/powerballResultRoutes");

// PAKISTAN
const pakistanGameCountRoutes = require("./routes/admin/pakistan/gameCountRoutes");
const pakistanGameEntryRoutes = require("./routes/admin/pakistan/gameEntryRoutes");
const pakistanPowerballResultRoutes = require("./routes/admin/pakistan/powerballResultRoutes");

// CANADA
const canadaGameCountRoutes = require("./routes/admin/canada/gameCountRoutes");
const canadaGameEntryRoutes = require("./routes/admin/canada/gameEntryRoutes");
const canadaPowerballResultRoutes = require("./routes/admin/canada/powerballResultRoutes");

// INDIA
const indiaGameCountRoutes = require("./routes/admin/india/gameCountRoutes");
const indiaGameEntryRoutes = require("./routes/admin/india/gameEntryRoutes");
const indiaPowerballResultRoutes = require("./routes/admin/india/powerballResultRoutes");

// NEPAL
const nepalGameCountRoutes = require("./routes/admin/nepal/gameCountRoutes");
const nepalGameEntryRoutes = require("./routes/admin/nepal/gameEntryRoutes");
const nepalPowerballResultRoutes = require("./routes/admin/nepal/powerballResultRoutes");

// UAE
const uaeGameCountRoutes = require("./routes/admin/uae/gameCountRoutes");
const uaeGameEntryRoutes = require("./routes/admin/uae/gameEntryRoutes");
const uaePowerballResultRoutes = require("./routes/admin/uae/powerballResultRoutes");

// ============================================
// COUNTRY-SPECIFIC USER ROUTES
// ============================================
// AUSTRALIA
// ========================================
// AUSTRALIA
// ========================================
const userAustraliaGameEntryRoute = require(
  "./routes/user/australia/gameEntryRoutes"
);

const userAustraliaGameCountRoute = require(
  "./routes/user/australia/gameCountRoutes"
);


// ========================================
// PAKISTAN
// ========================================
const userPakistanGameEntryRoute = require(
  "./routes/user/pakistan/gameEntryRoutes"
);

const userPakistanGameCountRoute = require(
  "./routes/user/pakistan/gameCountRoutes"
);


// ========================================
// CANADA
// ========================================
const userCanadaGameEntryRoute = require(
  "./routes/user/canada/gameEntryRoutes"
);

const userCanadaGameCountRoute = require(
  "./routes/user/canada/gameCountRoutes"
);


// ========================================
// INDIA
// ========================================
const userIndiaGameEntryRoute = require(
  "./routes/user/india/gameEntryRoutes"
);

const userIndiaGameCountRoute = require(
  "./routes/user/india/gameCountRoutes"
);


// ========================================
// NEPAL
// ========================================
const userNepalGameEntryRoute = require(
  "./routes/user/nepal/gameEntryRoutes"
);

const userNepalGameCountRoute = require(
  "./routes/user/nepal/gameCountRoutes"
);


// ========================================
// UAE
// ========================================
const userUaeGameEntryRoute = require(
  "./routes/user/uae/gameEntryRoutes"
);

const userUaeGameCountRoute = require(
  "./routes/user/uae/gameCountRoutes"
);

const bettingBonusRoutes = require('./routes/bettingBonusRoutes');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================
// USER ROUTES
// ============================================
// Authentication & Core
app.use("/api/auth", authRoutes);
app.use("/api/daily-claim", dailyClaimRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/banner", bannerRoutes);
app.use('/api/public-bids', publicBidRoutes);

// Markets, Bids, Results
app.use("/api/markets", marketRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/currency", currencyRateRoutes);

// User Ticket Types
app.use("/api/user/ticket-types", userTicketTypeRoutes);

// ============================================
// COUNTRY-SPECIFIC USER ROUTES
// ============================================
// AUSTRALIA - User Routes
app.use("/api/australia/game-entry", userAustraliaGameEntryRoute);
app.use("/api/australia/game-counts", userAustraliaGameCountRoute);

// PAKISTAN - User Routes
app.use("/api/pakistan/game-entry", userPakistanGameEntryRoute);
app.use("/api/pakistan/game-counts", userPakistanGameCountRoute);

// CANADA - User Routes
app.use("/api/canada/game-entry", userCanadaGameEntryRoute);
app.use("/api/canada/game-counts", userCanadaGameCountRoute);

// INDIA - User Routes
app.use("/api/india/game-entry", userIndiaGameEntryRoute);
app.use("/api/india/game-counts", userIndiaGameCountRoute);

// NEPAL - User Routes
app.use("/api/nepal/game-entry", userNepalGameEntryRoute);
app.use("/api/nepal/game-counts", userNepalGameCountRoute);

// UAE - User Routes
app.use("/api/uae/game-entry", userUaeGameEntryRoute);
app.use("/api/uae/game-counts", userUaeGameCountRoute);

// ============================================
// ADMIN ROUTES
// ============================================
// Core Admin
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api", depositSettingsRoutes);
app.use("/api/withdrawal-settings", withdrawalSettingsRoutes);
app.use("/api/admin/ticket-types", adminTicketTypeRoutes);

// Country-specific Admin Routes
// AUSTRALIA
app.use("/api/admin/australia/game-count", australiaGameCountRoutes);
app.use("/api/admin/australia/game-entries", australiaGameEntryRoutes);
app.use("/api/admin/australia/powerball-results", australiaPowerballResultRoutes);

// PAKISTAN
app.use("/api/admin/pakistan/game-count", pakistanGameCountRoutes);
app.use("/api/admin/pakistan/game-entries", pakistanGameEntryRoutes);
app.use("/api/admin/pakistan/powerball-results", pakistanPowerballResultRoutes);

// CANADA
app.use("/api/admin/canada/game-count", canadaGameCountRoutes);
app.use("/api/admin/canada/game-entries", canadaGameEntryRoutes);
app.use("/api/admin/canada/powerball-results", canadaPowerballResultRoutes);

// INDIA
app.use("/api/admin/india/game-count", indiaGameCountRoutes);
app.use("/api/admin/india/game-entries", indiaGameEntryRoutes);
app.use("/api/admin/india/powerball-results", indiaPowerballResultRoutes);

// NEPAL
app.use("/api/admin/nepal/game-count", nepalGameCountRoutes);
app.use("/api/admin/nepal/game-entries", nepalGameEntryRoutes);
app.use("/api/admin/nepal/powerball-results", nepalPowerballResultRoutes);

// UAE
app.use("/api/admin/uae/game-count", uaeGameCountRoutes);
app.use("/api/admin/uae/game-entries", uaeGameEntryRoutes);
app.use("/api/admin/uae/powerball-results", uaePowerballResultRoutes);
app.use('/api/admin/referral-levels', require('./routes/referralLevelRoutes'))
app.use("/api/betting-bonus", bettingBonusRoutes);

// ============================================
// STATIC FILES & FRONTEND ROUTES
// ============================================
// User Frontend
app.use(express.static(path.join(__dirname, "../client/dist")));

// Admin Frontend
app.use("/admin", express.static(path.join(__dirname, "../admin/dist")));

// ============================================
// SPA FALLBACK ROUTES
// ============================================
// Admin React Routes
app.get("/admin/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin/dist/index.html"));
});

// User React Routes
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});