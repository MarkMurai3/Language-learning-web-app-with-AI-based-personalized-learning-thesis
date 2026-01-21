import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sendChat, tts, stt } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";


const SYSTEM_PROMPT =
  "You are a helpful language learner. Answer their questions in the language they ask you a question. Apply the natural approach when answering their linguistic questions.";

export default function Chat() {
  const navigate = useNavigate();

  const [provider, setProvider] = useState("openai"); 
  
  const [messages, setMessages] = useState([
    { role: "system", content: SYSTEM_PROMPT },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [voice, setVoice] = useState("coral"); // matches backend default
  const [recording, setRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);

  // let mediaRecorderRef = null;
  // let chunksRef = [];
  // let streamRef = null;

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);



  // Protect page
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
    }
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

      // If token invalid/expired, our API wrapper usually throws "Invalid or expired token"
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
    // cleanup previous audio URL
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

        const data = await stt(audioBlob);
        const text = (data.text || "").trim();

        if (text) {
          // put transcript into input box for user to edit OR send immediately
          setInput(text);
        } else {
          setError("No speech detected (empty transcript).");
        }
      } catch (e) {
        setError(e.message || "STT failed");
      } finally {
        setSttLoading(false);
        // stop mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      }
    };

    recorder.start();
    setRecording(true);
  } catch (e) {
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


  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Chat</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>
          Provider{" "}
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="openai">OpenAI</option>
            <option value="llama3">Llama 3 (local)</option>
          </select>


        </label>
        <label>
          Voice{" "}
          <select value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="coral">coral</option>
            <option value="alloy">alloy</option>
            <option value="nova">nova</option>
            <option value="onyx">onyx</option>
            <option value="sage">sage</option>
            <option value="shimmer">shimmer</option>
          </select>
        </label>

        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={sttLoading}
        >
          {sttLoading ? "Transcribing..." : recording ? "Stop recording" : "Start recording"}
        </button>


        <button
          type="button"
          disabled={speaking}
          onClick={() => {
            const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
            speak(lastAssistant?.content || "");
          }}
        >
          {speaking ? "Speaking..." : "Speak last reply"}
        </button>


        <button type="button" onClick={handleReset}>
          Reset chat
        </button>
      </div>

      <div
        style={{
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
          <p style={{ opacity: 0.7 }}>Ask something about your target language…</p>
        ) : (
          visibleMessages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>
                {m.role === "user" ? "You" : "Tutor"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))
        )}
      </div>

      {error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}

      <form onSubmit={handleSend} style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          style={{ flex: 1, padding: 10 }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
