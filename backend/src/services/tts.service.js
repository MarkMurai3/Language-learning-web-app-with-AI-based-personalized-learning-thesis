const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function textToSpeechMp3Buffer({ text, voice, instructions }) {
  const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
  const usedVoice = voice || process.env.OPENAI_TTS_VOICE || "coral";

  const audio = await client.audio.speech.create({
    model,
    voice: usedVoice,
    input: text,
    // Optional: lets you steer delivery/tone
    ...(instructions ? { instructions } : {}),
    // default is mp3; you can set response_format if you want wav/pcm
  });

  const buffer = Buffer.from(await audio.arrayBuffer());
  return buffer;
}

module.exports = { textToSpeechMp3Buffer };
