const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/user/australia/AustraliaGameCountController");

router.get("/", getGameCounts);

module.exports = router;
