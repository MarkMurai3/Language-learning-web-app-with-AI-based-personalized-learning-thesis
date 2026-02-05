const express = require("express");
const router = express.Router();

const { getFeedback, likeVideo, dislikeVideo } = require("../services/feedback.service");
const requireAuth = require("../middleware/requireAuth");
router.use(requireAuth);


// assumes you already have JWT middleware that sets req.user
// example: const { requireAuth } = require("../middleware/auth");
// router.use(requireAuth);

router.get("/", (req, res) => {
  const fb = getFeedback(req.user.userId);
  res.json({ feedback: fb });
});

router.post("/like", (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ message: "videoId is required" });

  const fb = likeVideo(req.user.userId, videoId);
  res.json({ feedback: fb });
});

router.post("/dislike", (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ message: "videoId is required" });

  const fb = dislikeVideo(req.user.userId, videoId);
  res.json({ feedback: fb });
});

module.exports = router;
