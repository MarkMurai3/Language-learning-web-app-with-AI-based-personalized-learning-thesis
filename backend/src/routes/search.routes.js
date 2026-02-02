const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { searchVideos } = require("../controllers/search.controller");

const router = express.Router();

router.get("/", requireAuth, searchVideos);

module.exports = router;
