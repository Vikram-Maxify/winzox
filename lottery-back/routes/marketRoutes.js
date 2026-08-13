const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const { protect, adminProtect } = require("../middleware/authMiddleware.js");

// ==================== User Routes ====================
router.get("/active", protect, marketController.getActiveMarkets);
router.get("/", protect, marketController.getAllMarkets);
router.get("/:marketId", protect, marketController.getMarketById);

// ==================== Admin Routes ====================
router.post("/create", protect, adminProtect, marketController.createMarket);
router.put("/:marketId", protect, adminProtect, marketController.updateMarket);
router.patch("/:marketId/toggle", protect, adminProtect, marketController.toggleMarketStatus);
router.delete("/:marketId", protect, adminProtect, marketController.deleteMarket);

module.exports = router;