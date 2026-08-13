const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/user/pakistan/PakistanGameCountController");

router.get("/", getGameCounts);

module.exports = router;
