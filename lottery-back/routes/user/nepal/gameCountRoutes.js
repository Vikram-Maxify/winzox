const express = require("express");
const router = express.Router();

const { getGameCounts } = require("../../../controllers/user/nepal/NepalGameCountController");

router.get("/", getGameCounts);

module.exports = router;
