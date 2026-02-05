// In-memory store for admin-managed data

const blockedVideos = []; 
// { videoId, reason, createdAt }

const seedChannels = []; 
// { language, channelId, label, createdAt }

function listBlockedVideos() {
  return blockedVideos;
}

function addBlockedVideo({ videoId, reason }) {
  const id = String(videoId || "").trim();
  if (!id) throw new Error("Missing videoId");

  // prevent duplicates
  if (blockedVideos.some((x) => x.videoId === id)) return;

  blockedVideos.push({
    videoId: id,
    reason: String(reason || ""),
    createdAt: new Date().toISOString(),
  });
}

function removeBlockedVideo(videoId) {
  const id = String(videoId || "").trim();
  const idx = blockedVideos.findIndex((x) => x.videoId === id);
  if (idx >= 0) blockedVideos.splice(idx, 1);
}

function isBlocked(videoId) {
  const id = String(videoId || "").trim();
  return blockedVideos.some((x) => x.videoId === id);
}

function listSeedChannels() {
  return seedChannels;
}

function addSeedChannel({ language, channelId, label }) {
  const lang = String(language || "").trim();
  const ch = String(channelId || "").trim();
  if (!lang) throw new Error("Missing language");
  if (!ch) throw new Error("Missing channelId");

  if (seedChannels.some((x) => x.language === lang && x.channelId === ch)) return;

  seedChannels.push({
    language: lang,
    channelId: ch,
    label: String(label || ""),
    createdAt: new Date().toISOString(),
  });
}

function removeSeedChannel({ language, channelId }) {
  const lang = String(language || "").trim();
  const ch = String(channelId || "").trim();
  const idx = seedChannels.findIndex((x) => x.language === lang && x.channelId === ch);
  if (idx >= 0) seedChannels.splice(idx, 1);
}

function getSeedChannelsForLanguage(language) {
  const lang = String(language || "").trim();
  return seedChannels.filter((x) => x.language === lang);
}

module.exports = {
  listBlockedVideos,
  addBlockedVideo,
  removeBlockedVideo,
  isBlocked,
  listSeedChannels,
  addSeedChannel,
  removeSeedChannel,
  getSeedChannelsForLanguage,
};
