const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { getProfile, updateProfile } = require("../controllers/profile.controller");

const router = express.Router();

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, updateProfile);

module.exports = router;
