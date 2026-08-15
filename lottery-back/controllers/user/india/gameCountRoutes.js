const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/india/IndiaGameCountController");

router.get("/", getGameCounts);

module.exports = router;
