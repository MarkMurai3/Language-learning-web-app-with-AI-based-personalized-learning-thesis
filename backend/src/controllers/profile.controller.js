const { getUserById, updateUserById } = require("../services/auth.service");

async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to load profile" });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { targetLanguage } = req.body;

    const patch = {
      ...(targetLanguage !== undefined ? { targetLanguage } : {}),
    };

    const updated = await updateUserById(userId, patch);
    if (!updated) return res.status(404).json({ error: "User not found" });

    return res.json({ user: updated });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to update profile" });
  }
}

module.exports = { getProfile, updateProfile };