const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { chat } = require("../controllers/chat.controller");

const router = express.Router();
router.post("/", requireAuth, chat);

module.exports = router;
