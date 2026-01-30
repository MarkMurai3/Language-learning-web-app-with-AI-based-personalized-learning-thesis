// const { getInterestsForUser } = require("./interests.service");
// const { getUserById } = require("./auth.service");

// function buildRecommendations(jwtUser) {
//   const interests = getInterestsForUser(jwtUser.userId);
//   const profile = getUserById(jwtUser.userId);

//   const targetLanguage = profile?.targetLanguage || "Unknown";

//   if (!interests.length) return [];

//   // Mock: create recommendations that explicitly match targetLanguage
//   return interests.slice(0, 5).map((interest, idx) => ({
//     id: `rec_${jwtUser.userId}_${interest}_${idx}`,
//     title: `${interest} video in ${targetLanguage}`,
//     channel: "LinguaAI Mock",
//     url: "https://www.youtube.com",
//     language: targetLanguage,
//     reason: `Based on your interest: ${interest} + target language: ${targetLanguage}`,
//   }));
// }

// module.exports = { buildRecommendations };

const { getInterestsForUser } = require("./interests.service");
const { getUserById } = require("./auth.service");
const { ytSearch } = require("./youtube.service");
const { toLangCode } = require("./languageMap");

function looksLikeLanguage(text, targetLanguageName) {
  // MVP heuristic: we’ll improve later
  // For now, just accept and rely on relevanceLanguage.
  // Later you can add a lightweight language detector or LLM check.
  return true;
}

async function buildRecommendations(jwtUser) {
  const interests = getInterestsForUser(jwtUser.userId);
  const profile = getUserById(jwtUser.userId);

  const targetLanguage = profile?.targetLanguage || "English";
  const langCode = toLangCode(targetLanguage);

  if (!interests.length) return [];

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

  // Create queries from interests
  const queries = interests.slice(0, 3).map((i) => `${i}`);

  // Pull results
  const results = [];
  for (const q of queries) {
    const items = await ytSearch({
      apiKey,
      q,
      relevanceLanguage: langCode, // biases results toward language :contentReference[oaicite:4]{index=4}
      maxResults: 8,
    });

    for (const it of items) {
      if (it.id?.kind !== "youtube#video") continue;
      const videoId = it.id.videoId;

      const title = it.snippet?.title || "";
      const description = it.snippet?.description || "";

      if (!looksLikeLanguage(`${title}\n${description}`, targetLanguage)) continue;

      results.push({
        id: videoId,
        title,
        channel: it.snippet?.channelTitle || "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: it.snippet?.thumbnails?.medium?.url || "",
        language: targetLanguage,
        reason: `Interest: ${q} • Target language bias: ${targetLanguage}`,
      });
    }
  }

  // Remove duplicates by videoId
  const uniq = new Map();
  for (const r of results) uniq.set(r.id, r);
  return [...uniq.values()].slice(0, 20);
}

module.exports = { buildRecommendations };
