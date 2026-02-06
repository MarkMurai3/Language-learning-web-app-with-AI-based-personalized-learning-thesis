const franc = require("franc");
const { getHints } = require("./langHints");

const { getInterestsForUser } = require("./interests.service");
const { getUserById } = require("./auth.service");
const { ytSearch, ytVideosDetails } = require("./youtube.service");
const { getLangCodes } = require("./languageMap");

// ✅ admin rules
const { isBlocked, getSeedChannelsForLanguage } = require("./admin.service");

// OPTIONAL: feedback (dislikes)
let getFeedback;
try {
  ({ getFeedback } = require("./feedback.service"));
} catch {
  getFeedback = null;
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

function passesLanguageFilter({ targetYt, targetFranc, videoSnippet }) {
  const title = videoSnippet?.title || "";
  const description = videoSnippet?.description || "";

  const audioLang = normalizeLangPrefix(videoSnippet?.defaultAudioLanguage);
  const textLang = normalizeLangPrefix(videoSnippet?.defaultLanguage);

  if (audioLang) return audioLang === targetYt;
  if (textLang) return textLang === targetYt;

  const detected = detectTextLanguageISO3(`${title}\n${description}`);
  if (detected === "und") return false; // ✅ strict: if we can't tell, skip
  return detected === targetFranc;

}

function containsAny(text, words) {
  const t = (text || "").toLowerCase();
  return (words || []).some((w) => t.includes(String(w).toLowerCase()));
}

// function makeQueries(interests, targetLanguageName) {
//   const hints = getHints(targetLanguageName);

//   const nativeQueries = [];
//   const learningQueries = [];

//   for (const interest of interests.slice(0, 4)) {
//     const translated = hints.interestMap?.[interest];
//     const keywords =
//       Array.isArray(translated) && translated.length ? translated : [interest];

//     for (const kw of keywords) nativeQueries.push(String(kw));

//     learningQueries.push(`${interest} ${targetLanguageName}`);
//     learningQueries.push(`${interest} in ${targetLanguageName}`);
//   }

//   return { nativeQueries, learningQueries, hints };
// }

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

  for (const it of (interests || [])) {
    const weight = it?.weight === 2 ? 2 : 1;
    const kws = extractKeywordsFromInterestId(it?.id);

    for (const kw of kws) {
      // push more often if favorite
      for (let i = 0; i < weight; i++) nativeQueries.push(kw);

      // learning lane optional; keep very light
      learningQueries.push(`learn ${kw}`);
      learningQueries.push(`${kw} explained`);
    }
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
      if (!id) continue;

      const sid = String(id);
      if (dislikedSet.has(sid)) continue;
      if (isBlocked(sid)) continue;

      ids.push(id);
    }
  }

  return ids;
}

async function collectIdsFromSeedChannels({
  apiKey,
  seeds,
  q,
  targetYt,
  dislikedSet,
}) {
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
      if (isBlocked(sid)) continue;

      ids.push(id);
    }
  }

  return ids;
}

/* ================= main ================= */

async function buildRecommendations(jwtUser) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

  const { interests, prefs } = getInterestsForUser(jwtUser.userId);
  if (!interests.length) return [];


  const profile = getUserById(jwtUser.userId);

  const targetLanguage = profile?.targetLanguage || "English";
  const { yt: targetYt, franc: targetFranc } = getLangCodes(targetLanguage);

  if (!interests.length) return [];

  // disliked videos
  let dislikedSet = new Set();
  let likedSet = new Set();

  if (getFeedback) {
    try {
      const fb = getFeedback(jwtUser.userId);
      dislikedSet = new Set((fb?.disliked || []).map(String));
      likedSet = new Set((fb?.liked || []).map(String));
    } catch {}
  }

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
  const { nativeQueries, learningQueries, hints } = buildQueriesFromInterests(interests, targetLanguage);


  // seed lane
  const seeds = getSeedChannelsForLanguage(targetLanguage);
  const seedIds = await collectIdsFromSeedChannels({
    apiKey,
    seeds,
    q: interests[0] || "",
    targetYt,
    dislikedSet,
  });

  // native + learning lanes
  const nativeIds = await collectIdsFromQueries({
    apiKey,
    queries: nativeQueries,
    targetYt,
    dislikedSet,
  });

  let learningIds = [];
  if (!prefs?.avoidLearningContent) {
    learningIds = await collectIdsFromQueries({
      apiKey,
      queries: learningQueries,
      targetYt,
      dislikedSet,
    });
  }


  // merge (seed > native > learning)
  const uniqueIds = [];
  const seen = new Set();

  for (const id of seedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    uniqueIds.push(id);
    if (uniqueIds.length >= 15) break;
  }

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

  if (!uniqueIds.length) return [];

  // fetch details
  const details = await ytVideosDetails({ apiKey, ids: uniqueIds });

  // filter + score
  const out = [];
  for (const v of details) {
    const sn = v?.snippet;
    if (!sn) continue;

    if (dislikedSet.has(String(v.id))) continue;
    if (isBlocked(String(v.id))) continue;

    const okLang = passesLanguageFilter({
      targetYt,
      targetFranc,
      videoSnippet: sn,
    });
    if (!okLang) continue;

    const title = sn.title || "";
    const description = sn.description || "";

    const isLearning = containsAny(`${title}\n${description}`, hints.learnStop);

    // ✅ if user says "avoid learning content", hard filter it out
    if (prefs?.avoidLearningContent && isLearning) continue;

    const score = isLearning ? 0 : 10;

    // ✅ boost if user liked this channel before
    const chId = sn.channelId ? String(sn.channelId) : "";
    if (chId && likedChannelIds.has(chId)) score += 5;

    out.push({
      id: v.id,
      title,
      channel: sn.channelTitle || "",
      url: `https://www.youtube.com/watch?v=${v.id}`,
      thumbnail:
        sn.thumbnails?.medium?.url || sn.thumbnails?.high?.url || "",
      language: targetLanguage,
      reason: isLearning ? "Learning content" : "Native content",
      _score: score,
    });
  }

  out.sort((a, b) => (b._score || 0) - (a._score || 0));
  return out.slice(0, 20).map(({ _score, ...rest }) => rest);
}

module.exports = { buildRecommendations };

