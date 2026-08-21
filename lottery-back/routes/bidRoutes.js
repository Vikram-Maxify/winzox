const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bidController");
const { protect, adminProtect } = require("../middleware/authMiddleware.js");

// ==================== User Routes ====================
router.post("/place", protect, bidController.placeBid);
router.get("/history", protect, bidController.getBiddingHistory);
router.get("/today-summary", protect, bidController.getTodayBidsSummary);
router.get("/:bidId", protect, bidController.getBidById);
router.delete("/:bidId/cancel", protect, bidController.cancelBid);

// ==================== Admin Routes ====================
// Get all bids with filters
router.get("/admin/all", protect,  bidController.adminGetAllBids);

// Get bid stats
router.get("/admin/stats", protect,  bidController.adminGetBidStats);

// Get today's bids
router.get("/admin/today", protect,  bidController.adminGetTodayBids);

// Get bid by ID (Admin)
router.get("/admin/:bidId", protect,  bidController.adminGetBidById);

router.get("/admin/lowest/:marketId", bidController.getLowestBidNumber);


// Update bid status
router.put("/admin/:bidId/status", protect,  bidController.adminUpdateBidStatus);

// Delete bid
router.delete("/admin/:bidId", protect,  bidController.adminDeleteBid);

module.exports = router;