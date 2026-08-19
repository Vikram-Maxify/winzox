const express = require("express");

const router = express.Router();

const {
    getReferralLevels,
    updateReferralLevel,
    updateAllReferralLevels,
    resetReferralLevels,
} = require("../controllers/referralLevelController");

const {
    protect,
    adminProtect,
} = require("../middleware/authMiddleware.js");


// ======================================================
// GET ALL LEVELS
// ======================================================

router.get(
    "/",
    protect,
    adminProtect,
    getReferralLevels
);


// ======================================================
// UPDATE SINGLE LEVEL
// ======================================================

router.put(
    "/:level",
    protect,
    adminProtect,
    updateReferralLevel
);


// ======================================================
// UPDATE ALL 8 LEVELS
// ======================================================

router.put(
    "/",
    protect,
    adminProtect,
    updateAllReferralLevels
);


// ======================================================
// RESET DEFAULT LEVELS
// ======================================================

router.post(
    "/reset",
    protect,
    adminProtect,
    resetReferralLevels
);


module.exports = router;