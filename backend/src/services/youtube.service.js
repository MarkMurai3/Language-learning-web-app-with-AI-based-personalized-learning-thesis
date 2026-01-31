const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YT_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";


async function ytSearch({ apiKey, q, relevanceLanguage, maxResults = 10 }) {
  const url = new URL(YT_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("q", q);
  if (relevanceLanguage) url.searchParams.set("relevanceLanguage", relevanceLanguage);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) throw new Error(data?.error?.message || "YouTube search failed");
  return data.items || [];
}

async function ytVideosDetails({ apiKey, ids }) {
  if (!ids.length) return [];

  const url = new URL(YT_VIDEOS_URL);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "YouTube videos.list failed");
  return data.items || [];
}

module.exports = { ytSearch, ytVideosDetails };
