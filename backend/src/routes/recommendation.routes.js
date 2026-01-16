const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { getRecommendations } = require("../controllers/recommendation.controller");

const router = express.Router();

// Protected route
router.get("/", requireAuth, getRecommendations);

module.exports = router;
