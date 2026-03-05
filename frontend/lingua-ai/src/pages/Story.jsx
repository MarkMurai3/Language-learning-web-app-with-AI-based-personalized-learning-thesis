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

      setMessages([...nextMessages, { role: "assistant", content: parsed.story || raw }]);
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

  async function chooseOption(opt) {
    setError("");
    setLoading(true);
    try {
      const nextMessages = [...messages, { role: "user", content: opt }];
      const data = await sendChat(provider, nextMessages);
      const raw = (data.reply || "").trim();
      const parsed = parseStoryJson(raw);

      setMessages([...nextMessages, { role: "assistant", content: parsed.story || raw }]);
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
  }

  async function speakLast() {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
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

  const hasStory = visibleMessages.length > 0;

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">Story</h1>
          <p className="sub">
            Choose what happens next. The story stays in your target language:{" "}
            <b>{targetLanguage}</b>
          </p>
        </div>

        <div className="storyHeaderRight">
          <button className="btn btn-primary" type="button" onClick={startNewStory} disabled={loading}>
            {hasStory ? "Start new story" : "Start story"}
          </button>

          <button className="btn" type="button" onClick={continueStory} disabled={loading || !hasStory}>
            Continue
          </button>

          <button className="btn" type="button" onClick={speakLast} disabled={speaking || !hasStory}>
            {speaking ? "Speaking..." : "Speak last"}
          </button>
        </div>
      </div>

      {error ? <div className="err" style={{ marginBottom: 10 }}>{error}</div> : null}

      <div className="chatShell">
        {/* Story window */}
        <div className="chatPanel">
          <div className="card cardPad">
            <div className="chatWindow">
              {!hasStory ? (
                <div style={{ color: "rgba(255,255,255,0.70)" }}>
                  Click <b>Start story</b> to begin.
                </div>
              ) : (
                visibleMessages.map((m, i) => (
                  <div key={i} className="msg">
                    <div className="msgMeta">{m.role === "user" ? "You" : "Story"}</div>
                    <div className={`bubble ${m.role === "user" ? "bubbleUser" : "bubbleAssistant"}`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 3 choice buttons */}
            {options.length === 3 ? (
              <div className="storyOptions">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="optionBtn"
                    disabled={loading}
                    onClick={() => chooseOption(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Side settings */}
        <div className="chatControls">
          <div className="card cardPad">
            <div className="controlGroupTitle">Settings</div>

            <div className="controlRow">
              <label>
                Provider
                <select
                  className="select"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  disabled={loading}
                >
                  <option value="openai">OpenAI</option>
                  <option value="llama3">Llama 3 (local)</option>
                </select>
              </label>

              <label>
                Voice
                <select
                  className="select"
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
            </div>

            <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
              Tip: use the options for “easy mode”. Use <b>Continue</b> for free progression.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}