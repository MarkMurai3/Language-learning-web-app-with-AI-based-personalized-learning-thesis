const {
  listAvailableInterests,
  getInterestsForUser,
  setInterestsForUser,
} = require("../services/interests.service");

function getAvailableInterests(req, res) {
  res.json({ interests: listAvailableInterests() });
}

function getMyInterests(req, res) {
  const userId = req.user.userId;
  res.json({ interests: getInterestsForUser(userId) });
}

function setMyInterests(req, res) {
  const userId = req.user.userId;
  const { interests } = req.body; // expects array of strings
  const saved = setInterestsForUser(userId, interests);
  res.json({ interests: saved });
}

module.exports = {
  getAvailableInterests,
  getMyInterests,
  setMyInterests,
};
