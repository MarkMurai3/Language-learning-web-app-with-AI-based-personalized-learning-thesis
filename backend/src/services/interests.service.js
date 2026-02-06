const INTEREST_CATALOG = {
  Movies: ["Comedy", "Drama", "Action", "Horror", "Sci-Fi", "Anime", "Documentary"],
  Music: ["Pop", "Rock", "Hip-hop", "Electronic", "Jazz", "Classical"],
  Gaming: ["FPS", "RPG", "Strategy", "Minecraft", "Esports", "Indie"],
  Travel: ["City trips", "Nature", "Food travel", "Budget travel"],
  Fitness: ["Gym", "Running", "Calisthenics", "Yoga", "Nutrition"],
  Cooking: ["Easy recipes", "Baking", "Healthy", "Street food"],
  Technology: ["Programming", "AI", "Gadgets", "Cybersecurity", "Web dev"],
};

const userData = new Map(); // userId -> { interests: [{id, weight}], prefs: {...} }

function listAvailableInterests() {
  return INTEREST_CATALOG;
}

function getInterestsForUser(userId) {
  return userData.get(userId) || { interests: [], prefs: { avoidLearningContent: true } };
}

function normalizeId(id) {
  return String(id || "").trim();
}

function setInterestsForUser(userId, payload) {
  const interests = Array.isArray(payload?.interests) ? payload.interests : [];
  const prefs = payload?.prefs || {};

  const cleaned = interests
    .map((x) => ({
      id: normalizeId(x?.id),
      weight: x?.weight === 2 ? 2 : 1, // only 1 or 2 for now
    }))
    .filter((x) => x.id);

  const saved = {
    interests: cleaned,
    prefs: {
      avoidLearningContent: !!prefs.avoidLearningContent,
    },
  };

  userData.set(userId, saved);
  return saved;
}

module.exports = {
  listAvailableInterests,
  getInterestsForUser,
  setInterestsForUser,
};
