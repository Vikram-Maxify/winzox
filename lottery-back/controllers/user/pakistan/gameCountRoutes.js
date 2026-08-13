const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/pakistan/PakistanGameCountController");

router.get("/", getGameCounts);

module.exports = router;
