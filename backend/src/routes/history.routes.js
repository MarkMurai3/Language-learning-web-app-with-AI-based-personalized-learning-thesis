const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { addHistoryItem, getHistory, clearHistory } = require("../services/history.service");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const limit = Number(req.query.limit || 20);
  res.json({ items: getHistory(req.user.userId, limit) });
});

router.post("/", requireAuth, (req, res) => {
  const { id, title, url, channel, language } = req.body;
  if (!id || !title || !url) {
    return res.status(400).json({ error: "Missing id, title, or url" });
  }

  const saved = addHistoryItem(req.user.userId, { id, title, url, channel, language });
  res.status(201).json({ item: saved });
});

router.delete("/", requireAuth, (req, res) => {
  clearHistory(req.user.userId);
  res.json({ ok: true });
});

module.exports = router;
