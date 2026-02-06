const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { getFeedback, likeVideo, dislikeVideo } = require("../services/feedback.service");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const fb = getFeedback(req.user.userId);
  res.json({ feedback: fb });
});

router.post("/like", (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  const fb = likeVideo(req.user.userId, videoId);
  res.json({ feedback: fb });
});

router.post("/dislike", (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  const fb = dislikeVideo(req.user.userId, videoId);
  res.json({ feedback: fb });
});

module.exports = router;
