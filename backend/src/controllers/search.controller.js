const { getUserById } = require("../services/auth.service");
const { getLangCodes } = require("../services/languageMap");
const { translateToTarget } = require("../services/translate.service");
const { ytSearch, ytVideosDetails } = require("../services/youtube.service");

// reuse your passesLanguageFilter from recommendation.service.js if you want strict filtering
const franc = require("franc");

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
  if (detected === "und") return true; // permissive; change to false for strict
  return detected === targetFranc;
}

async function searchVideos(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Missing q" });

    const profile = getUserById(req.user.userId);
    const targetLanguage = profile?.targetLanguage || "English";
    const { yt: targetYt, franc: targetFranc } = getLangCodes(targetLanguage);

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

    // 1) translate query into target language
    const translated = await translateToTarget({ text: q, targetLanguage });

    // 2) YouTube search
    const items = await ytSearch({
      apiKey,
      q: translated,
      relevanceLanguage: targetYt,
      maxResults: 15,
    });

    const ids = [...new Set(items.map((it) => it?.id?.videoId).filter(Boolean))].slice(0, 30);

    // 3) details + filter
    const details = await ytVideosDetails({ apiKey, ids });

    const out = [];
    for (const v of details) {
      const sn = v?.snippet;
      if (!sn) continue;

      if (!passesLanguageFilter({ targetYt, targetFranc, videoSnippet: sn })) continue;

      out.push({
        id: v.id,
        title: sn.title || "",
        channel: sn.channelTitle || "",
        url: `https://www.youtube.com/watch?v=${v.id}`,
        thumbnail: sn.thumbnails?.medium?.url || sn.thumbnails?.high?.url || "",
        language: targetLanguage,
        reason: `Search translated: "${q}" → "${translated}"`,
      });
    }

    res.json({
      query: q,
      translated,
      items: out.slice(0, 20),
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Search failed" });
  }
}

module.exports = { searchVideos };
