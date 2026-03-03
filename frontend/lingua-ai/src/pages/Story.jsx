// frontend/src/pages/Story.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChat, getMe, tts } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";

function makeSystemPrompt(targetLanguage) {
  return `
You are a story partner for language immersion using the Natural Approach.

CRITICAL LANGUAGE RULE:
- Speak ONLY in ${targetLanguage}.

OUTPUT RULE:
- Return ONLY valid JSON with this exact shape:
  {"story":"...","options":["...","...","..."]}

STORY RULES:
- Write 4–8 short, natural sentences (simple style).
- Everyday vocabulary.
- After the story chunk, include 1–2 short questions inside "story".
- Do NOT add translations unless asked.

OPTIONS RULES:
- Provide exactly 3 options in ${targetLanguage}.
- Each option must be different and fit the story context.
- Each option must be a short action the user can choose (max ~8 words).
- Do not number them. No emojis.
`.trim();
}

function parseStoryJson(text) {
  try {
    const obj = JSON.parse(text);
    const story = typeof obj.story === "string" ? obj.story : "";
    const opts = Array.isArray(obj.options)
      ? obj.options.filter((x) => typeof x === "string")
      : [];
    return { story, options: opts.slice(0, 3) };
  } catch {
    // fallback: treat it as plain story text
    return { story: text, options: [] };
  }
}

export default function Story() {
  const navigate = useNavigate();

  const [provider, setProvider] = useState("openai");
  const [targetLanguage, setTargetLanguage] = useState("English");

  const [messages, setMessages] = useState([]); // includes system
  const [options, setOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // optional TTS
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState("coral");

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const me = await getMe();
        setTargetLanguage(me?.user?.targetLanguage || "English");
      } catch {
        // keep default
      }
    })();
  }, [navigate]);

  async function startNewStory() {
    setError("");
    setLoading(true);

    const system = { role: "system", content: makeSystemPrompt(targetLanguage) };

    try {
      const kickoff = [
        system,
        {
          role: "user",
          content:
            "Start a new story now. Make it interesting but simple. End with 1–2 short questions.",
        },
      ];

      const data = await sendChat(provider, kickoff);
      const raw = (data.reply || "").trim();

      const parsed = parseStoryJson(raw);
      setMessages([system, { role: "assistant", content: parsed.story || raw }]);
      setOptions(parsed.options || []);
    } catch (err) {
      const msg = err.message || "Failed to start story";
      if (String(msg).toLowerCase().includes("token")) {
        clearAuth();
        navigate("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function continueStory() {
    setError("");
    if (loading || messages.length === 0) return;

    setLoading(true);
    try {
      const nextMessages = [
        ...messages,
        {
          role: "user",
          content:
            "Continue the story in the same style. End with 1–2 short questions.",
        },
      ];

      const data = await sendChat(provider, nextMessages);
      const raw = (data.reply || "").trim();
      const parsed = parseStoryJson(raw);

      setMessages([
        ...nextMessages,
        { role: "assistant", content: parsed.story || raw },
      ]);
      setOptions(parsed.options || []);
    } catch (err) {
      const msg = err.message || "Failed to continue story";
      if (String(msg).toLowerCase().includes("token")) {
        clearAuth();
        navigate("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function speakLast() {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const text = lastAssistant?.content || "";
    if (!text) return;

    setSpeaking(true);
    setError("");
    try {
      const blob = await tts(text, voice);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.message || "TTS failed");
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Story mode</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ opacity: 0.8 }}>
          Target: <b>{targetLanguage}</b>
        </div>

        <label>
          Provider{" "}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={loading}
          >
            <option value="openai">OpenAI</option>
            <option value="llama3">Llama 3 (local)</option>
          </select>
        </label>

        <label>
          Voice{" "}
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={loading}
          >
            <option value="coral">coral</option>
            <option value="alloy">alloy</option>
            <option value="nova">nova</option>
            <option value="onyx">onyx</option>
            <option value="sage">sage</option>
            <option value="shimmer">shimmer</option>
          </select>
        </label>

        <button type="button" onClick={startNewStory} disabled={loading}>
          {visibleMessages.length ? "Start new story" : "Start story"}
        </button>

        <button
          type="button"
          onClick={continueStory}
          disabled={loading || !visibleMessages.length}
        >
          Continue
        </button>

        <button
          type="button"
          onClick={speakLast}
          disabled={speaking || !visibleMessages.length}
        >
          {speaking ? "Speaking..." : "Speak last"}
        </button>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          minHeight: 320,
          maxHeight: 420,
          overflowY: "auto",
          background: "#000000",
        }}
      >
        {visibleMessages.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Click “Start story”.</p>
        ) : (
          visibleMessages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>
                {m.role === "user" ? "You" : "Story"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))
        )}

        {/* 3 choice buttons */}
        {options.length === 3 && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={async () => {
                  setError("");
                  setLoading(true);
                  try {
                    const nextMessages = [...messages, { role: "user", content: opt }];
                    const data = await sendChat(provider, nextMessages);
                    const raw = (data.reply || "").trim();
                    const parsed = parseStoryJson(raw);

                    setMessages([
                      ...nextMessages,
                      { role: "assistant", content: parsed.story || raw },
                    ]);
                    setOptions(parsed.options || []);
                  } catch (err) {
                    const msg = err.message || "Failed";
                    if (String(msg).toLowerCase().includes("token")) {
                      clearAuth();
                      navigate("/login");
                      return;
                    }
                    setError(msg);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}
    </div>
  );
}