const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const FILE_PATH = path.join(DATA_DIR, "feedback.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify({ users: {} }, null, 2));
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  return JSON.parse(raw || '{"users":{}}');
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2));
}

function ensureUser(store, userId) {
  const uid = String(userId);
  if (!store.users[uid]) {
    store.users[uid] = { liked: [], disliked: [] };
  }
  return store.users[uid];
}

function getFeedback(userId) {
  const store = readStore();
  return ensureUser(store, userId);
}

function likeVideo(userId, videoId) {
  const store = readStore();
  const u = ensureUser(store, userId);

  const id = String(videoId);
  u.disliked = u.disliked.filter((x) => x !== id);
  if (!u.liked.includes(id)) u.liked.push(id);

  writeStore(store);
  return u;
}

function dislikeVideo(userId, videoId) {
  const store = readStore();
  const u = ensureUser(store, userId);

  const id = String(videoId);
  u.liked = u.liked.filter((x) => x !== id);
  if (!u.disliked.includes(id)) u.disliked.push(id);

  writeStore(store);
  return u;
}

module.exports = { getFeedback, likeVideo, dislikeVideo };
