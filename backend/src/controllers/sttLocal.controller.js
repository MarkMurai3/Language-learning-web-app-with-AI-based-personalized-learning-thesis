const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function runWhisperCpp({ audioPath }) {
  return new Promise((resolve, reject) => {
    const bin = process.env.WHISPER_CPP_BIN;
    const model = process.env.WHISPER_CPP_MODEL;

    if (!bin || !model) {
      return reject(new Error("Missing WHISPER_CPP_BIN or WHISPER_CPP_MODEL in .env"));
    }

    // whisper.cpp can output text to a file with -of / -otxt depending on build.
    // We'll use: output base path -> creates <base>.txt
    const outBase = path.join(os.tmpdir(), `whisper_out_${Date.now()}`);

    const args = [
      "-m", model,
      "-f", audioPath,
      "-of", outBase,
      "-otxt",
      // Optional quality/perf knobs:
      // "-l", "auto",   // let it detect language (or set "fr", "hu", etc.)
      // "-t", "4",      // threads
    ];

    const p = spawn(bin, args, { windowsHide: true });

    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", (err) => reject(err));

    p.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`whisper.cpp failed (code ${code}): ${stderr}`));
      }

      const txtPath = `${outBase}.txt`;
      try {
        const text = fs.readFileSync(txtPath, "utf8").trim();
        resolve(text);
      } catch (e) {
        reject(new Error("Could not read whisper output text file"));
      } finally {
        // cleanup output files if they exist
        try { fs.unlinkSync(txtPath); } catch {}
      }
    });
  });
}

async function sttLocal(req, res) {
  let tmpPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing audio file (field name: audio)" });
    }

    // Save uploaded blob to temp
    const ext = req.file.originalname?.endsWith(".webm") ? ".webm" : ".webm";
    tmpPath = path.join(os.tmpdir(), `stt_${Date.now()}${ext}`);
    fs.writeFileSync(tmpPath, req.file.buffer);

    const text = await runWhisperCpp({ audioPath: tmpPath });
    return res.json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Local STT failed" });
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }
}

module.exports = { sttLocal };
