const {
  listAvailableInterests,
  getInterestsForUser,
  setInterestsForUser,
} = require("../services/interests.service");

function getAvailableInterests(req, res) {
  return res.json({ catalog: listAvailableInterests() });
}

function getMyInterests(req, res) {
  const userId = req.user.userId;
  return res.json(getInterestsForUser(userId)); // { interests: [{id, weight}], prefs: {...} }
}

function setMyInterests(req, res) {
  const userId = req.user.userId;
  const saved = setInterestsForUser(userId, req.body); // expects { interests, prefs }
  return res.json(saved);
}

module.exports = {
  getAvailableInterests,
  getMyInterests,
  setMyInterests,
};
