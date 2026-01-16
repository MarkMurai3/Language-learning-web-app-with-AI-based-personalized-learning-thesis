const { getInterestsForUser } = require("./interests.service");
const { getUserById } = require("./auth.service");

function buildRecommendations(jwtUser) {
  const interests = getInterestsForUser(jwtUser.userId);
  const profile = getUserById(jwtUser.userId);

  const targetLanguage = profile?.targetLanguage || "Unknown";

  if (!interests.length) return [];

  // Mock: create recommendations that explicitly match targetLanguage
  return interests.slice(0, 5).map((interest, idx) => ({
    id: `rec_${jwtUser.userId}_${interest}_${idx}`,
    title: `${interest} video in ${targetLanguage}`,
    channel: "LinguaAI Mock",
    url: "https://www.youtube.com",
    language: targetLanguage,
    reason: `Based on your interest: ${interest} + target language: ${targetLanguage}`,
  }));
}

module.exports = { buildRecommendations };
