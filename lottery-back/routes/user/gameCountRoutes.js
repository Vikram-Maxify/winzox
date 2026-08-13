const express = require("express");
const router = express.Router();

const {
  getGameCounts,
} = require("../../controllers/user/gameCountController");

router.get("/", getGameCounts);

module.exports = router;