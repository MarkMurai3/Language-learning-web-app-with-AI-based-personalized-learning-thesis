const { getUserById, updateUserById } = require("../services/auth.service");

function getProfile(req, res) {
  const userId = req.user.userId;
  const user = getUserById(userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ user });
}

// function updateProfile(req, res) {
//   const userId = req.user.userId;

// const { targetLanguage } = req.body;

//   // Only allow updating these fields
//   const patch = {
//     // ...(username !== undefined ? { username } : {}),
//     // ...(nativeLanguage !== undefined ? { nativeLanguage } : {}),
//     ...(targetLanguage !== undefined ? { targetLanguage } : {}),
//     // ...(targetLevel !== undefined ? { targetLevel } : {}),
//   };

//   const updated = updateUserById(userId, patch);
//   if (!updated) return res.status(404).json({ error: "User not found" });
//   if (targetLanguage !== undefined && String(targetLanguage).trim() === "") {
//   return res.status(400).json({ error: "targetLanguage cannot be empty" });
// }


//   return res.json({ user: updated });
// }

function updateProfile(req, res) {
  const userId = req.user.userId;
  const { targetLanguage } = req.body;

  const patch = {
    ...(targetLanguage !== undefined ? { targetLanguage } : {}),
  };

  const updated = updateUserById(userId, patch);
  if (!updated) return res.status(404).json({ error: "User not found" });

  return res.json({ user: updated });
}



module.exports = {
  getProfile,
  updateProfile,
};
