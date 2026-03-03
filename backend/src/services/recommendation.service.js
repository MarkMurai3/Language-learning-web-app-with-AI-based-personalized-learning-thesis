// backend/src/services/recommendation.service.js
const franc = require("franc");
const { getHints } = require("./langHints");

const { getInterestsForUser } = require("./interests.service");
const { getUserById } = require("./auth.service");
const { ytSearch, ytVideosDetails } = require("./youtube.service");
const { getLangCodes } = require("./languageMap");
const { translateToTarget } = require("./translate.service");

// admin rules
const { isBlocked, getSeedChannelsForLanguage } = require("./admin.service");

// OPTIONAL: feedback (dislikes/likes)
let getFeedback;
try {
  ({ getFeedback } = require("./feedback.service"));
} catch {
  getFeedback = null;
}

/* ================= caches ================= */

// query translation cache
const queryTranslateCache = new Map(); // key: `${targetLanguage}::${text}`

// ✅ recommendations cache (final list)
const recCache = new Map();
// key: `${userId}::${targetLanguage}::${stableKey({ interests, prefs })}`
// value: { expiresAt, items }
const REC_TTL_MS = 1000 * 60 * 20; // 20 min

function stableKey(obj) {
  // simple stable stringify by sorting top-level keys
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/* ================= helpers ================= */

function normalizeLangPrefix(s) {
  return (s || "").toLowerCase().split("-")[0];
}

function detectTextLanguageISO3(text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length < 20) return "und";
  return franc(t, { minLength: 20 });
}

async function translateQueryCached(text, targetLanguage) {
  const key = `${targetLanguage}::${text}`;
  if (queryTranslateCache.has(key)) return queryTranslateCache.get(key);
  const t = await translateToTarget({ text, targetLanguage });
  queryTranslateCache.set(key, t);
  return t;
}

function passesLanguageFilter({ targetYt, targetFranc, videoSnippet }) {
  const title = videoSnippet?.title || "";
  const description = videoSnippet?.description || "";

  const audioLang = normalizeLangPrefix(videoSnippet?.defaultAudioLanguage);
  const textLang = normalizeLangPrefix(videoSnippet?.defaultLanguage);

  // If YouTube gives explicit language, trust it
  if (audioLang) return audioLang === targetYt;
  if (textLang) return textLang === targetYt;

  const detected = detectTextLanguageISO3(`${title}\n${description}`);

  // unknown language is NOT OK for non-English targets
  if (detected === "und") {
    return targetFranc === "eng"; // allow only if target is English
  }

  // Prevent English leaking into non-English targets
  if (targetFranc !== "eng" && detected === "eng") return false;

  return detected === targetFranc;
}

function containsAny(text, words) {
  const t = (text || "").toLowerCase();
  return (words || []).some((w) => t.includes(String(w).toLowerCase()));
}

function extractKeywordsFromInterestId(id) {
  const s = String(id || "").trim();
  if (!s) return [];

  // custom:football
  if (s.startsWith("custom:")) {
    const kw = s.slice("custom:".length).trim();
    return kw ? [kw] : [];
  }

  // Movies:Comedy -> "Comedy"
  const parts = s.split(":");
  if (parts.length >= 2) {
    const sub = parts.slice(1).join(":").trim();
    return sub ? [sub] : [];
  }

  // fallback
  return [s];
}

function buildQueriesFromInterests(interests, targetLanguageName) {
  const hints = getHints(targetLanguageName);

  const nativeQueries = [];
  const learningQueries = [];

  for (const it of interests || []) {
    const weight = it?.weight === 2 ? 2 : 1;
    const kws = extractKeywordsFromInterestId(it?.id);

    for (const kw of kws) {
      // push more often if favorite
      for (let i = 0; i < weight; i++) nativeQueries.push(kw);

      // learning lane optional; keep very light
      learningQueries.push(`${kw} ${targetLanguageName}`);
      learningQueries.push(`${kw} in ${targetLanguageName}`);
      learningQueries.push(`learn ${kw} ${targetLanguageName}`);
    }
  }

  return { nativeQueries, learningQueries, hints };
}

async function isBlockedForUser(videoId, userId) {
  // Make admin.service usage consistent everywhere
  try {
    return await isBlocked({ videoId: String(videoId), userId });
  } catch {
    // if admin.service throws, fail open (do not block)
    return false;
  }
}

async function collectIdsFromQueries({ apiKey, queries, targetYt, dislikedSet, userId }) {
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
      if (!id) continue;

      const sid = String(id);
      if (dislikedSet.has(sid)) continue;
      if (await isBlockedForUser(sid, userId)) continue;

      ids.push(id);
    }
  }

  return ids;
}

async function collectIdsFromSeedChannels({ apiKey, seeds, q, targetYt, dislikedSet, userId }) {
  const ids = [];

  for (const s of (seeds || []).slice(0, 5)) {
    const items = await ytSearch({
      apiKey,
      q: q || "",
      relevanceLanguage: targetYt,
      maxResults: 5,
      channelId: s.channelId,
    });

    for (const it of items) {
      const id = it?.id?.videoId;
      if (!id) continue;

      const sid = String(id);
      if (dislikedSet.has(sid)) continue;
      if (await isBlockedForUser(sid, userId)) continue;

      ids.push(id);
    }
  }

  return ids;
}

/* ================= main ================= */

async function buildRecommendations(jwtUser) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

  const { interests, prefs } = await getInterestsForUser(jwtUser.userId);
  if (!interests || interests.length === 0) return [];

  const profile = await getUserById(jwtUser.userId);

  const targetLanguage = profile?.targetLanguage || "English";
  const { yt: targetYt, franc: targetFranc } = getLangCodes(targetLanguage);

  // ✅ CACHE HIT (right after interests/prefs/profile/targetLanguage known)
  const cacheKey = `${jwtUser.userId}::${targetLanguage}::${stableKey({
    interests,
    prefs,
  })}`;
  const now = Date.now();
  const hit = recCache.get(cacheKey);

  if (hit && hit.expiresAt > now) {
    return hit.items;
  }

  // feedback sets
  let dislikedSet = new Set();
  let likedSet = new Set();

  if (getFeedback) {
    try {
      const fb = getFeedback(jwtUser.userId);
      dislikedSet = new Set((fb?.disliked || []).map(String));
      likedSet = new Set((fb?.liked || []).map(String));
    } catch {}
  }

  // liked channels boost
  let likedChannelIds = new Set();
  if (likedSet.size > 0) {
    try {
      const likedIds = Array.from(likedSet).slice(0, 25); // limit cost
      const likedDetails = await ytVideosDetails({ apiKey, ids: likedIds });
      for (const v of likedDetails) {
        const chId = v?.snippet?.channelId;
        if (chId) likedChannelIds.add(String(chId));
      }
    } catch {
      // ignore if YouTube details fail
    }
  }

  // queries
  const { nativeQueries, learningQueries, hints } = buildQueriesFromInterests(
    interests,
    targetLanguage
  );

  // Translate native queries into target language to bias results toward native content
  const translatedNativeQueries = [];
  for (const q of nativeQueries.slice(0, 12)) {
    // cap to control cost
    try {
      translatedNativeQueries.push(await translateQueryCached(q, targetLanguage));
    } catch {
      translatedNativeQueries.push(q); // fallback
    }
  }

  // first keyword for seed search
  const firstKeyword = extractKeywordsFromInterestId(interests?.[0]?.id)?.[0] || "";

  // seed lane
  const seeds = await getSeedChannelsForLanguage({
    language: targetLanguage,
    userId: jwtUser.userId,
  });

  const seedIds = await collectIdsFromSeedChannels({
    apiKey,
    seeds,
    q: firstKeyword,
    targetYt,
    dislikedSet,
    userId: jwtUser.userId,
  });

  // native + learning lanes
  const nativeIds = await collectIdsFromQueries({
    apiKey,
    queries: translatedNativeQueries,
    targetYt,
    dislikedSet,
    userId: jwtUser.userId,
  });

  let learningIds = [];
  if (!prefs?.avoidLearningContent) {
    learningIds = await collectIdsFromQueries({
      apiKey,
      queries: learningQueries,
      targetYt,
      dislikedSet,
      userId: jwtUser.userId,
    });
  }

  // merge (seed > native > learning)
  const uniqueIds = [];
  const seen = new Set();

  for (const id of seedIds) {
    const sid = String(id);
    if (seen.has(sid)) continue;
    seen.add(sid);
    uniqueIds.push(id);
    if (uniqueIds.length >= 15) break;
  }

  for (const id of nativeIds) {
    const sid = String(id);
    if (seen.has(sid)) continue;
    seen.add(sid);
    uniqueIds.push(id);
    if (uniqueIds.length >= 35) break;
  }

  for (const id of learningIds) {
    const sid = String(id);
    if (seen.has(sid)) continue;
    seen.add(sid);
    uniqueIds.push(id);
    if (uniqueIds.length >= 50) break;
  }

  if (!uniqueIds.length) return [];

  // fetch details
  const details = await ytVideosDetails({ apiKey, ids: uniqueIds });

  // filter + score
  const out = [];
  for (const v of details) {
    const sn = v?.snippet;
    if (!sn) continue;

    const vid = String(v.id);
    if (dislikedSet.has(vid)) continue;
    if (await isBlockedForUser(vid, jwtUser.userId)) continue;

    const okLang = passesLanguageFilter({
      targetYt,
      targetFranc,
      videoSnippet: sn,
    });
    if (!okLang) continue;

    const title = sn.title || "";
    const description = sn.description || "";

    const isLearning = containsAny(`${title}\n${description}`, hints.learnStop);

    // hard filter learning content if preference says so
    if (prefs?.avoidLearningContent && isLearning) continue;

    let score = isLearning ? 0 : 10;

    // boost if user liked this channel before
    const chId = sn.channelId ? String(sn.channelId) : "";
    if (chId && likedChannelIds.has(chId)) score += 5;

    out.push({
      id: v.id,
      title,
      channel: sn.channelTitle || "",
      url: `https://www.youtube.com/watch?v=${v.id}`,
      thumbnail: sn.thumbnails?.medium?.url || sn.thumbnails?.high?.url || "",
      language: targetLanguage,
      reason: isLearning ? "Learning content" : "Native content",
      _score: score,
    });
  }

  out.sort((a, b) => (b._score || 0) - (a._score || 0));

  // ✅ CACHE SET right before returning
  const finalItems = out.slice(0, 20).map(({ _score, ...rest }) => rest);
  recCache.set(cacheKey, {
    expiresAt: Date.now() + REC_TTL_MS,
    items: finalItems,
  });

  return finalItems;
}

module.exports = { buildRecommendations };