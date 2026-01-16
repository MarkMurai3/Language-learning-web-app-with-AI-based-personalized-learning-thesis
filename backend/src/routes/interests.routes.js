const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const {
  getAvailableInterests,
  getMyInterests,
  setMyInterests,
} = require("../controllers/interests.controller");

const router = express.Router();

// Catalog of interests (can be public; leaving it public is fine)
router.get("/", getAvailableInterests);

// User-specific interests (protected)
router.get("/me", requireAuth, getMyInterests);
router.post("/me", requireAuth, setMyInterests);

module.exports = router;
