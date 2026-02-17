// const {
//   listAvailableInterests,
//   getInterestsForUser,
//   setInterestsForUser,
// } = require("../services/interests.service");

// function getAvailableInterests(req, res) {
//   return res.json({ catalog: listAvailableInterests() });
// }

// function getMyInterests(req, res) {
//   const userId = req.user.userId;
//   return res.json(getInterestsForUser(userId)); // { interests: [{id, weight}], prefs: {...} }
// }

// function setMyInterests(req, res) {
//   const userId = req.user.userId;
//   const saved = setInterestsForUser(userId, req.body); // expects { interests, prefs }
//   return res.json(saved);
// }

// module.exports = {
//   getAvailableInterests,
//   getMyInterests,
//   setMyInterests,
// };


const {
  listAvailableInterests,
  getInterestsForUser,
  setInterestsForUser,
} = require("../services/interests.service");

async function getAvailableInterests(req, res) {
  try {
    const catalog = await listAvailableInterests();
    return res.json({ catalog });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to load interest catalog" });
  }
}

async function getMyInterests(req, res) {
  try {
    const userId = req.user.userId;
    const data = await getInterestsForUser(userId);
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to load user interests" });
  }
}

async function setMyInterests(req, res) {
  try {
    const userId = req.user.userId;
    const saved = await setInterestsForUser(userId, req.body);
    return res.json(saved);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to save user interests" });
  }
}

module.exports = {
  getAvailableInterests,
  getMyInterests,
  setMyInterests,
};
