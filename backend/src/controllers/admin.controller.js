// backend/src/controllers/admin.controller.js
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
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to load users" });
  }
}

async function patchUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { disabled } = req.body;

    if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad user id" });
    if (typeof disabled !== "boolean") return res.status(400).json({ error: "disabled must be boolean" });

    const updated = await setUserDisabled(id, disabled);
    if (!updated) return res.status(404).json({ error: "User not found" });

    return res.json({ ok: true, user: updated });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to update user" });
  }
}

function parseUserId(req) {
  const q = req.query.userId ?? req.body?.userId;
  if (q === undefined || q === null || q === "") return null;
  const n = Number(q);
  return Number.isFinite(n) ? n : null;
}



async function getBlocked(req, res) {
  try {
    const userId = parseUserId(req);
    const items = await listBlockedVideos({ userId });
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to load blocked videos" });
  }
}

async function addBlocked(req, res) {
  try {
    const userId = parseUserId(req);
    const { videoId, reason } = req.body;
    await addBlockedVideo({ videoId, reason, userId });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message || "Bad request" });
  }
}

async function deleteBlocked(req, res) {
  try {
    const userId = parseUserId(req);
    await removeBlockedVideo({ videoId: req.params.videoId, userId });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Delete failed" });
  }
}

async function getSeeds(req, res) {
  try {
    const userId = parseUserId(req);
    const items = await listSeedChannels({ userId });
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to load seed channels" });
  }
}


async function addSeed(req, res) {
  try {
    const userId = parseUserId(req);
    const { language, channelId, label } = req.body;
    await addSeedChannel({ language, channelId, label, userId });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message || "Bad request" });
  }
}


async function deleteSeed(req, res) {
  try {
    const userId = parseUserId(req);
    await removeSeedChannel({
      language: req.params.language,
      channelId: req.params.channelId,
      userId,
    });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Delete failed" });
  }
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





