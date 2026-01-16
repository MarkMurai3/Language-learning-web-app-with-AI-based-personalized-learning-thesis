const { buildRecommendations } = require("../services/recommendation.service");

function getRecommendations(req, res) {
  // req.user comes from JWT middleware
  const items = buildRecommendations(req.user);
  res.json({ items });
}

module.exports = { getRecommendations };
