// const OpenAI = require("openai");

// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function stt(req, res) {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "Missing audio file (field name: audio)" });
//     }

//     const model = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe";

//     // OpenAI JS SDK accepts a File/Blob in some runtimes; in Node we can pass a Buffer via a File-like wrapper.
//     // The simplest approach is to create a Blob from the buffer (Node 18+ has Blob).
//     const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "audio/webm" });

//     const result = await client.audio.transcriptions.create({
//       model,
//       file: blob,
//       // Optional: you can set language (BCP-47 or ISO-like) if you want to force it,
//       // but leaving it empty allows auto language detection.
//       // language: "fr",
//     });

//     // result.text is the transcript
//     return res.json({ text: result.text || "" });
//   } catch (e) {
//     return res.status(500).json({ error: e.message || "STT failed" });
//   }
// }

// module.exports = { stt };

const OpenAI = require("openai");
const { toFile } = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function stt(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing audio file (field name: audio)" });
    }

    const model = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe";

    // IMPORTANT: give a filename WITH extension so the API can infer format
    // Use .webm because MediaRecorder is producing audio/webm
    const file = await toFile(req.file.buffer, "speech.webm");

    const result = await client.audio.transcriptions.create({
      model,
      file,
    });

    return res.json({ text: result.text || "" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "STT failed" });
  }
}

module.exports = { stt };
