const franc = require("franc");
const { getHints } = require("./langHints");

const { getInterestsForUser } = require("./interests.service");
const { getUserById } = require("./auth.service");
const { ytSearch, ytVideosDetails } = require("./youtube.service");
const { getLangCodes } = require("./languageMap");

// OPTIONAL: only keep this if you actually have feedback.service.js
let getFeedback;
try {
  ({ getFeedback } = require("./feedback.service"));
} catch {
  getFeedback = null;
}

/** helpers **/
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

  // Best: YouTube metadata
  const audioLang = normalizeLangPrefix(videoSnippet?.defaultAudioLanguage);
  const textLang = normalizeLangPrefix(videoSnippet?.defaultLanguage);

  if (audioLang) return audioLang === targetYt;
  if (textLang) return textLang === targetYt;

  // Fallback: detect from title+description
  const detected = detectTextLanguageISO3(`${title}\n${description}`);
  if (detected === "und") return true; // unknown => allow (non-strict)
  return detected === targetFranc;
}

function containsAny(text, words) {
  const t = (text || "").toLowerCase();
  return (words || []).some((w) => t.includes(String(w).toLowerCase()));
}

function makeQueries(interests, targetLanguageName) {
  const hints = getHints(targetLanguageName);

  const nativeQueries = [];
  const learningQueries = [];

  for (const interest of interests.slice(0, 4)) {
    const translated = hints.interestMap?.[interest];

    // Lane A: native / mainstream query (no “Spanish” etc)
    const keywords =
      Array.isArray(translated) && translated.length ? translated : [interest];

    for (const kw of keywords) nativeQueries.push(String(kw));

    // Lane B: learning-friendly queries
    learningQueries.push(`${interest} ${targetLanguageName}`);
    learningQueries.push(`${interest} in ${targetLanguageName}`);
  }

  return { nativeQueries, learningQueries, hints };
}

async function collectIdsFromQueries({ apiKey, queries, targetYt, dislikedSet }) {
  const ids = [];

  for (const q of queries) {
    const items = await ytSearch({
      apiKey,
      q,
      relevanceLanguage: targetYt,
      maxResults: 12,
    });

    for (const it of items) {
      const id = it?.id?.videoId;
      if (id && !dislikedSet.has(String(id))) ids.push(id);
    }
  }

  return ids;
}

/** main **/
async function buildRecommendations(jwtUser) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

  const interests = getInterestsForUser(jwtUser.userId);
  const profile = getUserById(jwtUser.userId);

  const targetLanguage = profile?.targetLanguage || "English";
  const { yt: targetYt, franc: targetFranc } = getLangCodes(targetLanguage);

  if (!interests.length) return [];

  // disliked videos (optional)
  let dislikedSet = new Set();
  if (getFeedback) {
    try {
      const fb = getFeedback(jwtUser.userId);
      dislikedSet = new Set((fb?.disliked || []).map(String));
    } catch {
      // ignore
    }
  }

  // 1) Build queries
  const { nativeQueries, learningQueries, hints } = makeQueries(
    interests,
    targetLanguage
  );

  // 2) Collect ids from both lanes
  const nativeIds = await collectIdsFromQueries({
    apiKey,
    queries: nativeQueries,
    targetYt,
    dislikedSet,
  });

  const learningIds = await collectIdsFromQueries({
    apiKey,
    queries: learningQueries,
    targetYt,
    dislikedSet,
  });

  // 3) Merge ids: prefer native, then learning
  const uniqueIds = [];
  const seen = new Set();

  for (const id of nativeIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    uniqueIds.push(id);
    if (uniqueIds.length >= 35) break;
  }

  for (const id of learningIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    uniqueIds.push(id);
    if (uniqueIds.length >= 50) break;
  }

  if (uniqueIds.length === 0) return [];

  // 4) Fetch details
  const details = await ytVideosDetails({ apiKey, ids: uniqueIds });

  // 5) Filter + label + score
  const out = [];
  for (const v of details) {
    const sn = v?.snippet;
    if (!sn) continue;
    if (dislikedSet.has(String(v.id))) continue;

    // language check
    const okLang = passesLanguageFilter({
      targetYt,
      targetFranc,
      videoSnippet: sn,
    });
    if (!okLang) continue;

    const title = sn.title || "";
    const description = sn.description || "";

    // learning detection (uses language-specific stopwords from hints)
    const isLearning = containsAny(`${title}\n${description}`, hints.learnStop);

    const score = isLearning ? 0 : 10; // native > learning

    out.push({
      id: v.id,
      title,
      channel: sn.channelTitle || "",
      url: `https://www.youtube.com/watch?v=${v.id}`,
      thumbnail:
        sn.thumbnails?.medium?.url || sn.thumbnails?.high?.url || "",
      language: targetLanguage,
      reason: isLearning ? "Learning-friendly" : "Native content",
      _score: score,
    });
  }

  // 6) Sort and return clean
  out.sort((a, b) => (b._score || 0) - (a._score || 0));
  return out.slice(0, 20).map(({ _score, ...rest }) => rest);
}

module.exports = { buildRecommendations };
