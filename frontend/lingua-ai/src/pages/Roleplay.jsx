// frontend/src/pages/Roleplay.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChat, tts, stt, getRoleplayScenarios, prepareRoleplayScenario, getMe } from "../services/api";
import { isLoggedIn, clearAuth, getUser } from "../services/authStorage";
/**
 * Reads token from localStorage. Adjust the key if your project stores it differently.
 * Common options in projects like yours:
 * - localStorage.getItem("auth_token")
 * - localStorage.getItem("token")
 * - JSON.parse(localStorage.getItem("auth_user"))?.token
 */
// function getAuthToken() {
//   return (
//     localStorage.getItem("auth_token") ||
//     localStorage.getItem("token") ||
//     (() => {
//       try {
//         const u = JSON.parse(localStorage.getItem("auth_user") || "null");
//         return u?.token || "";
//       } catch {
//         return "";
//       }
//     })()
//   );
// }

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// async function apiGet(path) {
//   const token = getAuthToken();
//   const res = await fetch(`${import.meta.env.VITE_API_URL || ""}${path}`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//   });
//   const data = await res.json().catch(() => ({}));
//   if (!res.ok) {
//     const msg = data?.error || `Request failed: ${res.status}`;
//     const err = new Error(msg);
//     err.status = res.status;
//     throw err;
//   }
//   return data;
// }

export default function Roleplay() {
  const navigate = useNavigate();

  const [provider, setProvider] = useState("openai");
  const [targetLanguage, setTargetLanguage] = useState("English");

  // list of scenario "stubs" from backend: [{id,title,description}]
  const [scenarioList, setScenarioList] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");

  // prepared (translated) scenario from backend:
  // { id, title, description, starterUser, systemPrompt }
  const [scenario, setScenario] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [error, setError] = useState("");
  const [assistantStarts, setAssistantStarts] = useState(true);

  // TTS/STT state
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [voice, setVoice] = useState("coral");

  const [recording, setRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  async function fetchScenarioList() {
    const data = await getRoleplayScenarios();
    return data?.items || [];
  }

  async function prepareScenario(id) {
    return prepareRoleplayScenario(id);
  }

  async function loadAndPrepareScenario(id) {
    if (!id) return;

    setError("");
    setLoadingScenario(true);
    setScenario(null);

    try {
      const prepared = await prepareScenario(id);

      // keep UI label in sync with backend/user
      if (prepared?.targetLanguage) setTargetLanguage(prepared.targetLanguage);

      setScenario(prepared?.scenario || null);
    } catch (e) {
      const msg = e?.message || "Failed to load scenario";
      if (String(msg).toLowerCase().includes("token") || e?.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoadingScenario(false);
    }
  }

  // Initial page protection + load scenario list + prepare first scenario
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

  // Load targetLanguage from backend (source of truth). Fallback to localStorage.
  (async () => {
    try {
      const me = await getMe(); // GET /api/me
      const tl = me?.user?.targetLanguage || "English";
      setTargetLanguage(tl);
    } catch {
      const u = getUser();
      setTargetLanguage(u?.targetLanguage || "English");
    }
  })();

    let cancelled = false;

    (async () => {
      try {
        const list = await fetchScenarioList();
        if (cancelled) return;

        setScenarioList(list);

        // pick first scenario: either first in list, or random
        const firstId = list?.[0]?.id || "";
        const chosenId = firstId || "";
        setSelectedScenarioId(chosenId);

        if (chosenId) {
          await loadAndPrepareScenario(chosenId);
        } else {
          setError("No roleplay scenarios available.");
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e?.message || "Failed to load roleplay scenarios";
        if (String(msg).toLowerCase().includes("token") || e?.status === 401) {
          clearAuth();
          navigate("/login");
          return;
        }
        setError(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // When scenario changes OR assistantStarts/provider changes => reset conversation
  useEffect(() => {
    if (!scenario) return;

    let cancelled = false;

    async function resetScenarioConversation() {
      setError("");
      setInput("");

      // Start fresh with only the system prompt coming from backend (already translated + enforced)
      const base = [{ role: "system", content: scenario.systemPrompt }];

      if (!assistantStarts) {
        setMessages(base);
        return;
      }

      setLoading(true);
      try {
        // Kick off the roleplay with a first assistant message, guaranteed in target language
        const kickoff = [
          ...base,
          {
            role: "user",
            content: "Start the roleplay now. Begin naturally in character with a short message.",
          },
        ];

        const data = await sendChat(provider, kickoff);
        const first = (data.reply || "").trim();

        if (!cancelled) {
          setMessages([...base, { role: "assistant", content: first }]);
        }
      } catch (e) {
        const msg = e?.message || "Failed to start roleplay";
        if (!cancelled) {
          setMessages(base);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resetScenarioConversation();
    return () => {
      cancelled = true;
    };
  }, [scenario, assistantStarts, provider]);

  const visibleMessages = useMemo(() => messages.filter((m) => m.role !== "system"), [messages]);

  async function handleScenarioChange(e) {
    const id = e.target.value;
    setSelectedScenarioId(id);
    await loadAndPrepareScenario(id);
  }

  async function newScenario() {
    if (!scenarioList?.length) return;
    const candidates = scenarioList.filter((s) => s.id !== selectedScenarioId);
    const next = (candidates.length ? pickRandom(candidates) : pickRandom(scenarioList)) || null;
    if (!next?.id) return;

    setSelectedScenarioId(next.id);
    await loadAndPrepareScenario(next.id);
  }

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
      const msg = err.message || "Roleplay chat failed";
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

          const data = await stt(audioBlob);
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

  const scenarioStub = scenarioList.find((s) => s.id === selectedScenarioId);

  if (!isLoggedIn()) return null;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Roleplay</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          Scenario:{" "}
          <b>{scenario?.title || scenarioStub?.title || (loadingScenario ? "Loading..." : "—")}</b>{" "}
          <span style={{ opacity: 0.7 }}>({targetLanguage})</span>
        </div>

        <button type="button" onClick={newScenario} disabled={loading || loadingScenario || !scenarioList.length}>
          New scenario
        </button>

        <label>
          Provider{" "}
          <select value={provider} onChange={(e) => setProvider(e.target.value)} disabled={loading}>
            <option value="openai">OpenAI</option>
            <option value="llama3">Llama 3 (local)</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            // Reset current scenario conversation (keep same scenario object)
            setScenario((prev) => (prev ? { ...prev } : prev));
          }}
          disabled={loading || loadingScenario || !scenario}
        >
          Reset
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Choose scenario{" "}
          <select
            value={selectedScenarioId}
            onChange={handleScenarioChange}
            disabled={loadingScenario || loading || !scenarioList.length}
          >
            {scenarioList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>

        {loadingScenario ? <span style={{ opacity: 0.7 }}>Preparing in {targetLanguage}…</span> : null}
      </div>

      <div style={{ marginTop: 10, opacity: 0.9 }}>
        <p style={{ margin: "8px 0" }}>{scenario?.description || scenarioStub?.description || ""}</p>

        {scenario?.starterUser ? (
          <p style={{ margin: "8px 0" }}>
            Suggested start: <i>{scenario.starterUser}</i>{" "}
            <button
              type="button"
              onClick={() => setInput(scenario.starterUser)}
              style={{ marginLeft: 8 }}
              disabled={loading || loadingScenario}
            >
              Use
            </button>
          </p>
        ) : null}
      </div>

      <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={assistantStarts}
          onChange={(e) => setAssistantStarts(e.target.checked)}
          disabled={loadingScenario}
        />
        Assistant starts
      </label>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
        <label>
          Voice{" "}
          <select value={voice} onChange={(e) => setVoice(e.target.value)} disabled={loadingScenario}>
            <option value="coral">coral</option>
            <option value="alloy">alloy</option>
            <option value="nova">nova</option>
            <option value="onyx">onyx</option>
            <option value="sage">sage</option>
            <option value="shimmer">shimmer</option>
          </select>
        </label>

        <button type="button" onClick={recording ? stopRecording : startRecording} disabled={sttLoading || loadingScenario}>
          {sttLoading ? "Transcribing..." : recording ? "Stop recording" : "Start recording"}
        </button>

        <button
          type="button"
          disabled={speaking || loadingScenario}
          onClick={() => {
            const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
            speak(lastAssistant?.content || "");
          }}
        >
          {speaking ? "Speaking..." : "Speak last reply"}
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
          <p style={{ opacity: 0.7 }}>
            {loadingScenario
              ? "Preparing roleplay…"
              : "Start the conversation (e.g., “Hello! I need…”) or use the suggested start."}
          </p>
        ) : (
          visibleMessages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>{m.role === "user" ? "You" : "Roleplay"}</div>
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
          disabled={loading || loadingScenario}
        />
        <button type="submit" disabled={loading || loadingScenario || !input.trim() || !scenario}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}