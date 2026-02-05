const {
  listBlockedVideos,
  addBlockedVideo,
  removeBlockedVideo,
  listSeedChannels,
  addSeedChannel,
  removeSeedChannel,
} = require("../services/admin.service");

const { listUsers, setUserDisabled } = require("../services/usersAdmin.service");

async function getUsers(req, res) {
  return res.json({ users: listUsers() });
}

async function patchUser(req, res) {
  const id = Number(req.params.id);
  const { disabled } = req.body;

  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad user id" });
  if (typeof disabled !== "boolean") return res.status(400).json({ error: "disabled must be boolean" });

  const updated = setUserDisabled(id, disabled);
  if (!updated) return res.status(404).json({ error: "User not found" });

  return res.json({ ok: true, user: updated });
}

async function getBlocked(req, res) {
  return res.json({ items: listBlockedVideos() });
}

async function addBlocked(req, res) {
  try {
    const { videoId, reason } = req.body;
    addBlockedVideo({ videoId, reason });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message || "Bad request" });
  }
}

async function deleteBlocked(req, res) {
  removeBlockedVideo(req.params.videoId);
  return res.json({ ok: true });
}

async function getSeeds(req, res) {
  return res.json({ items: listSeedChannels() });
}

async function addSeed(req, res) {
  try {
    const { language, channelId, label } = req.body;
    addSeedChannel({ language, channelId, label });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message || "Bad request" });
  }
}

async function deleteSeed(req, res) {
  removeSeedChannel({ language: req.params.language, channelId: req.params.channelId });
  return res.json({ ok: true });
}

module.exports = {
  getUsers,
  patchUser,
  getBlocked,
  addBlocked,
  deleteBlocked,
  getSeeds,
  addSeed,
  deleteSeed,
};
