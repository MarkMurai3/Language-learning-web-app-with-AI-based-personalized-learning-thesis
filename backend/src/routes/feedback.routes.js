const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { like, dislike, getFeedback } = require("../services/feedback.service");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  res.json(getFeedback(req.user.userId));
});

router.post("/like", requireAuth, (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "Missing videoId" });

  res.json(like(req.user.userId, String(videoId)));
});

router.post("/dislike", requireAuth, (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "Missing videoId" });

  res.json(dislike(req.user.userId, String(videoId)));
});

module.exports = router;
