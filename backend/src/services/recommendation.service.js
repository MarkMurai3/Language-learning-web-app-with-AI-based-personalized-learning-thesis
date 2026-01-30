// const { getInterestsForUser } = require("./interests.service");
// const { getUserById } = require("./auth.service");
// const { ytSearch } = require("./youtube.service");
// const { toLangCode } = require("./languageMap");

// function looksLikeLanguage(text, targetLanguageName) {
//   // MVP heuristic: we’ll improve later
//   // For now, just accept and rely on relevanceLanguage.
//   // Later you can add a lightweight language detector or LLM check.
//   return true;
// }

// async function buildRecommendations(jwtUser) {
//   const interests = getInterestsForUser(jwtUser.userId);
//   const profile = getUserById(jwtUser.userId);

//   const targetLanguage = profile?.targetLanguage || "English";
//   const langCode = toLangCode(targetLanguage);

//   if (!interests.length) return [];

//   const apiKey = process.env.YOUTUBE_API_KEY;
//   if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

//   // Create queries from interests
//   const queries = interests.slice(0, 3).map((i) => `${i}`);

//   // Pull results
//   const results = [];
//   for (const q of queries) {
//     const items = await ytSearch({
//       apiKey,
//       q,
//       relevanceLanguage: langCode, // biases results toward language :contentReference[oaicite:4]{index=4}
//       maxResults: 8,
//     });

//     for (const it of items) {
//       if (it.id?.kind !== "youtube#video") continue;
//       const videoId = it.id.videoId;

//       const title = it.snippet?.title || "";
//       const description = it.snippet?.description || "";

//       if (!looksLikeLanguage(`${title}\n${description}`, targetLanguage)) continue;

//       results.push({
//         id: videoId,
//         title,
//         channel: it.snippet?.channelTitle || "",
//         url: `https://www.youtube.com/watch?v=${videoId}`,
//         thumbnail: it.snippet?.thumbnails?.medium?.url || "",
//         language: targetLanguage,
//         reason: `Interest: ${q} • Target language bias: ${targetLanguage}`,
//       });
//     }
//   }

//   // Remove duplicates by videoId
//   const uniq = new Map();
//   for (const r of results) uniq.set(r.id, r);
//   return [...uniq.values()].slice(0, 20);
// }

// module.exports = { buildRecommendations };



const franc = require("franc");

const { getInterestsForUser } = require("./interests.service");
const { getUserById } = require("./auth.service");
const { ytSearch, ytVideosDetails } = require("./youtube.service");
const { getLangCodes } = require("./languageMap");
const { getFeedback } = require("./feedback.service"); // if you have it; if not, remove these lines

function normalizeLangPrefix(s) {
  return (s || "").toLowerCase().split("-")[0]; // "es-419" -> "es"
}

function detectTextLanguageISO3(text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length < 20) return "und";
  return franc(t, { minLength: 20 }); // iso-639-3 or "und"
}

function passesLanguageFilter({ targetYt, targetFranc, videoSnippet }) {
  const title = videoSnippet?.title || "";
  const description = videoSnippet?.description || "";

  // Best: YouTube metadata on the video
  const audioLang = normalizeLangPrefix(videoSnippet?.defaultAudioLanguage);
  const textLang = normalizeLangPrefix(videoSnippet?.defaultLanguage);

  if (audioLang) return audioLang === targetYt;
  if (textLang) return textLang === targetYt;

  // Fallback: detect on title+description (works for many languages)
  const detected = detectTextLanguageISO3(`${title}\n${description}`);
  if (detected === "und") return true; // unknown → allow in non-strict mode
  return detected === targetFranc;
}

function makeQueries(interests, targetLanguageName) {
  // These templates help reduce English leakage before filtering.
  // Works across languages because we use the language name in the query.
  return interests.slice(0, 4).flatMap((interest) => [
    `${interest} ${targetLanguageName}`,
    `${interest} in ${targetLanguageName}`, // helps for English language names too
  ]);
}

async function buildRecommendations(jwtUser) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

  const interests = getInterestsForUser(jwtUser.userId);
  const profile = getUserById(jwtUser.userId);

  const targetLanguage = profile?.targetLanguage || "English";
  const { yt: targetYt, franc: targetFranc } = getLangCodes(targetLanguage);

  if (!interests.length) return [];

  // Optional feedback filtering (if you already have feedback.service.js)
  let dislikedSet = new Set();
  try {
    const fb = getFeedback(jwtUser.userId);
    dislikedSet = new Set((fb?.disliked || []).map(String));
  } catch {
    // ignore if feedback service not present
  }

  // 1) Search
  const queries = makeQueries(interests, targetLanguage);

  const videoIds = [];
  for (const q of queries) {
    const items = await ytSearch({
      apiKey,
      q,
      relevanceLanguage: targetYt,
      maxResults: 10,
    });

    for (const it of items) {
      const id = it?.id?.videoId;
      if (!id) continue;
      if (dislikedSet.has(String(id))) continue; // skip disliked videos early
      videoIds.push(id);
    }
  }

  // Deduplicate ids
  const uniqueIds = [...new Set(videoIds)].slice(0, 50);

  // 2) Fetch details (gives defaultAudioLanguage sometimes)
  const details = await ytVideosDetails({ apiKey, ids: uniqueIds });

  // 3) Filter + shape
  const out = [];
  for (const v of details) {
    const sn = v?.snippet;
    if (!sn) continue;

    if (dislikedSet.has(String(v.id))) continue;

    const okLang = passesLanguageFilter({
      targetYt,
      targetFranc,
      videoSnippet: sn,
    });

    if (!okLang) continue;

    out.push({
      id: v.id,
      title: sn.title || "",
      channel: sn.channelTitle || "",
      url: `https://www.youtube.com/watch?v=${v.id}`,
      thumbnail: sn.thumbnails?.medium?.url || sn.thumbnails?.high?.url || "",
      language: targetLanguage,
      reason: `Target language: ${targetLanguage}`,
    });
  }

  // Return up to 20
  return out.slice(0, 20);
}

module.exports = { buildRecommendations };
