const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { tts } = require("../controllers/tts.controller");

const router = express.Router();
router.post("/", requireAuth, tts);

module.exports = router;
