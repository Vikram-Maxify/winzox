const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/australia/AustraliaGameCountController");

router.get("/", getGameCounts);

module.exports = router;
