const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/user/uae/UaeGameCountController");

router.get("/", getGameCounts);

module.exports = router;
