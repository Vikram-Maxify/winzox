const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/user/canada/CanadaGameCountController");

router.get("/", getGameCounts);

module.exports = router;
