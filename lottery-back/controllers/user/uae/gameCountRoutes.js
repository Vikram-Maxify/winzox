const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/uae/UaeGameCountController");

router.get("/", getGameCounts);

module.exports = router;
