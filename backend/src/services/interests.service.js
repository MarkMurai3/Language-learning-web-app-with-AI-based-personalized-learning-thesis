// A fixed catalog of interests (you can expand later)
const AVAILABLE_INTERESTS = [
  "Music",
  "Gaming",
  "Travel",
  "Fitness",
  "Cooking",
  "Technology",
  "Movies",
  "Science",
  "Business",
  "Art",
];

// In-memory store: userId -> array of interests
const userInterests = new Map();

function listAvailableInterests() {
  return AVAILABLE_INTERESTS;
}

function getInterestsForUser(userId) {
  return userInterests.get(userId) || [];
}

function setInterestsForUser(userId, interests) {
  // sanitize
  const normalized = Array.isArray(interests)
    ? interests
        .map((x) => String(x).trim())
        .filter(Boolean)
        .filter((x) => AVAILABLE_INTERESTS.includes(x))
    : [];

  userInterests.set(userId, normalized);
  return normalized;
}

module.exports = {
  listAvailableInterests,
  getInterestsForUser,
  setInterestsForUser,
};
