const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/canada/CanadaGameCountController");

router.get("/", getGameCounts);

module.exports = router;
