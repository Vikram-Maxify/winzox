const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/user/india/IndiaGameCountController");

router.get("/", getGameCounts);

module.exports = router;
