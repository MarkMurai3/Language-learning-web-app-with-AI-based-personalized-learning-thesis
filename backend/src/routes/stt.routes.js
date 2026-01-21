const express = require("express");
const multer = require("multer");
const requireAuth = require("../middleware/requireAuth");
const { stt } = require("../controllers/stt.controller");

const router = express.Router();

// Store uploaded file in memory (Buffer)
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", requireAuth, upload.single("audio"), stt);

module.exports = router;
