import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChat, sttLocal, tts, stt } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";

const SYSTEM_PROMPT = `
You are a language immersion tutor using the Natural Approach.
Rules:
- Always reply in the SAME language the user is practicing (infer from the conversation).
- Keep replies short, natural, and helpful.
- Prefer examples and rephrasing over tests.
- Only correct mistakes if the user asks, and do it gently.
`.trim();

export default function Chat() {
  const navigate = useNavigate();

  const [provider, setProvider] = useState("openai");
  const [messages, setMessages] = useState([{ role: "system", content: SYSTEM_PROMPT }]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // TTS
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [voice, setVoice] = useState("coral");

  // STT
  const [recording, setRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [sttProvider, setSttProvider] = useState("openai"); // openai | local

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // Protect page
  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  // Show only user/assistant messages in UI (hide system)
  const visibleMessages = messages.filter((m) => m.role !== "system");

  async function handleSend(e) {
    e.preventDefault();
    setError("");

    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChat(provider, nextMessages);
      const reply = data.reply || "";
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err.message || "Chat failed";
      if (msg.toLowerCase().includes("token")) {
        clearAuth();
        navigate("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function transformLastAssistant(mode) {
    setError("");
    if (loading) return;

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    const instructionByMode = {
      simplify:
        "Simplify your last message. Use easier words and shorter sentences. Keep the same language. Keep the meaning.",
      rephrase:
        "Say your last message another way. Keep the same meaning. Keep the same language. Keep it natural.",
      explain:
        "Briefly explain WHY you said it that way (grammar/word choice) in 2-4 short bullet points. Keep the same language.",
    };

    const instruction = instructionByMode[mode];
    if (!instruction) return;

    setLoading(true);
    try {
      const nextMessages = [...messages, { role: "user", content: instruction }];
      const data = await sendChat(provider, nextMessages);
      const reply = (data.reply || "").trim();
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err.message || "Action failed";
      if (msg.toLowerCase().includes("token")) {
        clearAuth();
        navigate("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([{ role: "system", content: SYSTEM_PROMPT }]);
    setError("");
    setInput("");
  }

  async function speak(text) {
    if (!text) return;

    setError("");
    setSpeaking(true);

    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const blob = await tts(text, voice);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      await audio.play();
    } catch (e) {
      setError(e.message || "Failed to play TTS");
    } finally {
      setSpeaking(false);
    }
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          setSttLoading(true);
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

          const data = sttProvider === "local" ? await sttLocal(audioBlob) : await stt(audioBlob);
          const text = (data.text || "").trim();

          if (text) setInput(text);
          else setError("No speech detected (empty transcript).");
        } catch (e) {
          setError(e.message || "STT failed");
        } finally {
          setSttLoading(false);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
        }
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission denied or unavailable.");
    }
  }

  function stopRecording() {
    try {
      mediaRecorderRef.current?.stop();
    } finally {
      setRecording(false);
    }
  }

  const lastAssistantText =
    [...messages].reverse().find((m) => m.role === "assistant")?.content || "";

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">Chat</h1>
          <p className="sub">
            Natural conversation practice. Use “Simplify / Rephrase / Explain” to learn without tests.
          </p>
        </div>

        <div className="quickActions">
          <button className="btn" type="button" disabled={loading} onClick={() => transformLastAssistant("simplify")}>
            Simplify last reply
          </button>
          <button className="btn" type="button" disabled={loading} onClick={() => transformLastAssistant("rephrase")}>
            Say it another way
          </button>
          <button className="btn" type="button" disabled={loading} onClick={() => transformLastAssistant("explain")}>
            Explain briefly
          </button>
          <button className="btn-ghost" type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {error ? <div className="err" style={{ marginBottom: 10 }}>{error}</div> : null}

      <div className="chatShell">
        {/* Main chat */}
        <div className="chatPanel">
          <div className="card cardPad">
            <div className="chatWindow">
              {visibleMessages.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.70)" }}>
                  Ask something in your target language…
                </div>
              ) : (
                visibleMessages.map((m, i) => (
                  <div key={i} className="msg">
                    <div className="msgMeta">{m.role === "user" ? "You" : "Tutor"}</div>
                    <div className={`bubble ${m.role === "user" ? "bubbleUser" : "bubbleAssistant"}`}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="composer">
              <input
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                disabled={loading}
              />
              <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>

        {/* Side controls */}
        <div className="chatControls">
          <div className="card cardPad">
            <div className="controlGroupTitle">Settings</div>

            <div className="controlRow">
              <label>
                Provider
                <select className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="openai">OpenAI</option>
                  <option value="llama3">Llama 3 (local)</option>
                </select>
              </label>

              <label>
                Voice
                <select className="select" value={voice} onChange={(e) => setVoice(e.target.value)}>
                  <option value="coral">coral</option>
                  <option value="alloy">alloy</option>
                  <option value="nova">nova</option>
                  <option value="onyx">onyx</option>
                  <option value="sage">sage</option>
                  <option value="shimmer">shimmer</option>
                </select>
              </label>

              <label>
                STT Provider
                <select className="select" value={sttProvider} onChange={(e) => setSttProvider(e.target.value)}>
                  <option value="openai">OpenAI (cloud)</option>
                  <option value="local">Whisper (local)</option>
                </select>
              </label>
            </div>

            <div style={{ height: 10 }} />

            <div className="quickActions">
              <button
                className="btn"
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={sttLoading}
              >
                {sttLoading ? "Transcribing..." : recording ? "Stop recording" : "Start recording"}
              </button>

              <button
                className="btn"
                type="button"
                disabled={speaking || !lastAssistantText}
                onClick={() => speak(lastAssistantText)}
              >
                {speaking ? "Speaking..." : "Speak last reply"}
              </button>
            </div>

            <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
              Tip: talk naturally. If you want corrections, ask: “Correct me gently.”
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}