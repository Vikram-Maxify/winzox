const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/user/uae/UAEGameCountController");

router.get("/", getGameCounts);

module.exports = router;
