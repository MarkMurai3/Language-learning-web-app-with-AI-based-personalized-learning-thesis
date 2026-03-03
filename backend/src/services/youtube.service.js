// backend/src/services/youtube.service.js
const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YT_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

// search cache
const cache = new Map();
// cache key: JSON string, value: { expiresAt, items }
const DEFAULT_TTL_MS = 1000 * 60 * 30; // 30 minutes
let lastSearchAt = 0;
const MIN_SEARCH_INTERVAL_MS = 1500; // 1.5 seconds

// ✅ details cache (videos.list is expensive)
const detailsCache = new Map();
// key: sorted ids joined by comma
// value: { expiresAt, items }
const DETAILS_TTL_MS = 1000 * 60 * 60; // 1 hour

async function ytSearch({
  apiKey,
  q,
  relevanceLanguage,
  hl,
  maxResults = 10,
  ttlMs = DEFAULT_TTL_MS,
}) {
  const key = JSON.stringify({ q, relevanceLanguage, maxResults });

  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.items;
  }

  const url = new URL(YT_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("q", q);
  if (relevanceLanguage) url.searchParams.set("relevanceLanguage", relevanceLanguage);
  if (hl) url.searchParams.set("hl", hl);
  url.searchParams.set("key", apiKey);

  const now2 = Date.now();
  const wait = MIN_SEARCH_INTERVAL_MS - (now2 - lastSearchAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastSearchAt = Date.now();

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) throw new Error(data?.error?.message || "YouTube search failed");

  const items = data.items || [];
  cache.set(key, { expiresAt: now + ttlMs, items });

  return items;
}

async function ytVideosDetails({ apiKey, ids }) {
  if (!ids.length) return [];

  // ✅ cache key must be stable regardless of order
  const key = ids.slice().map(String).sort().join(",");
  const now = Date.now();
  const hit = detailsCache.get(key);
  if (hit && hit.expiresAt > now) return hit.items;

  const url = new URL(YT_VIDEOS_URL);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "YouTube videos.list failed");

  const items = data.items || [];
  detailsCache.set(key, { expiresAt: now + DETAILS_TTL_MS, items });
  return items;
}

module.exports = { ytSearch, ytVideosDetails };