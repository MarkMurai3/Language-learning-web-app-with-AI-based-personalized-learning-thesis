// userId -> array of history items (newest first)
const historyByUser = new Map();

function addHistoryItem(userId, item) {
  const arr = historyByUser.get(userId) || [];
  const newItem = {
    id: item.id,           // recommendation id or video id
    title: item.title,
    url: item.url,
    channel: item.channel || "",
    language: item.language || "",
    watchedAt: new Date().toISOString(),
  };

  // Put newest first
  arr.unshift(newItem);

  // Keep only last 50 items
  const trimmed = arr.slice(0, 50);
  historyByUser.set(userId, trimmed);

  return newItem;
}

function getHistory(userId, limit = 20) {
  const arr = historyByUser.get(userId) || [];
  return arr.slice(0, limit);
}

function clearHistory(userId) {
  historyByUser.set(userId, []);
}

module.exports = { addHistoryItem, getHistory, clearHistory };
