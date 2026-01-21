const { textToSpeechMp3Buffer } = require("../services/tts.service");

async function tts(req, res) {
  try {
    const { text, voice, instructions } = req.body;

    if (!text || String(text).trim() === "") {
      return res.status(400).json({ error: "Missing text" });
    }

    const mp3 = await textToSpeechMp3Buffer({
      text: String(text),
      voice,
      instructions,
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(mp3);
  } catch (e) {
    return res.status(500).json({ error: e.message || "TTS failed" });
  }
}

module.exports = { tts };
