// In-memory: userId -> { liked: Set(videoId), disliked: Set(videoId) }
const feedbackByUser = new Map();

function getOrCreate(userId) {
  if (!feedbackByUser.has(userId)) {
    feedbackByUser.set(userId, { liked: new Set(), disliked: new Set() });
  }
  return feedbackByUser.get(userId);
}

function like(userId, videoId) {
  const f = getOrCreate(userId);
  f.disliked.delete(videoId);
  f.liked.add(videoId);
  return { liked: [...f.liked], disliked: [...f.disliked] };
}

function dislike(userId, videoId) {
  const f = getOrCreate(userId);
  f.liked.delete(videoId);
  f.disliked.add(videoId);
  return { liked: [...f.liked], disliked: [...f.disliked] };
}

function getFeedback(userId) {
  const f = getOrCreate(userId);
  return { liked: [...f.liked], disliked: [...f.disliked] };
}

module.exports = { like, dislike, getFeedback };
