// const { buildRecommendations } = require("../services/recommendation.service");

// function getRecommendations(req, res) {
//   // req.user comes from JWT middleware
//   const items = buildRecommendations(req.user);
//   res.json({ items });
// }

// module.exports = { getRecommendations };


const { buildRecommendations } = require("../services/recommendation.service");

async function getRecommendations(req, res) {
  try {
    const items = await buildRecommendations(req.user);
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to build recommendations" });
  }
}

module.exports = { getRecommendations };
