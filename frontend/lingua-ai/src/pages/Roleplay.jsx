// src/pages/Roleplay.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendChat,
  tts,
  stt,
  sttLocal,
  getRoleplayScenarios,
  prepareRoleplayScenario,
  getMe,
} from "../services/api";
import { isLoggedIn, clearAuth, getUser } from "../services/authStorage";

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Roleplay() {
  const navigate = useNavigate();

  const [provider, setProvider] = useState("openai");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [sttMode, setSttMode] = useState("openai"); // "openai" | "local"

  // list of scenario stubs: [{id,title,description}]
  const [scenarioList, setScenarioList] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");

  // prepared scenario: { id, title, description, starterUser, systemPrompt }
  const [scenario, setScenario] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [error, setError] = useState("");
  const [assistantStarts, setAssistantStarts] = useState(true);

  // TTS/STT
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

  async function loadAndPrepareScenario(id) {
    if (!id) return;

    setError("");
    setLoadingScenario(true);
    setScenario(null);

    try {
      const prepared = await prepareRoleplayScenario(id);

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

  // Initial auth + scenario list
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    // load targetLanguage from backend; fallback to storage
    (async () => {
      try {
        const me = await getMe();
        setTargetLanguage(me?.user?.targetLanguage || "English");
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

        const firstId = list?.[0]?.id || "";
        setSelectedScenarioId(firstId);

        if (firstId) await loadAndPrepareScenario(firstId);
        else setError("No roleplay scenarios available.");
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

  // Reset conversation when scenario/assistantStarts/provider changes
  useEffect(() => {
    if (!scenario) return;

    let cancelled = false;

    async function resetScenarioConversation() {
      setError("");
      setInput("");

      const base = [{ role: "system", content: scenario.systemPrompt }];

      if (!assistantStarts) {
        setMessages(base);
        return;
      }

      setLoading(true);
      try {
        const kickoff = [
          ...base,
          {
            role: "user",
            content:
              "Start the roleplay now. Begin naturally in character with a short message.",
          },
        ];

        const data = await sendChat(provider, kickoff);
        const first = (data.reply || "").trim();

        if (!cancelled) setMessages([...base, { role: "assistant", content: first }]);
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

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  async function handleScenarioChange(e) {
    const id = e.target.value;
    setSelectedScenarioId(id);
    await loadAndPrepareScenario(id);
  }

  async function newScenario() {
    if (!scenarioList?.length) return;
    const candidates = scenarioList.filter((s) => s.id !== selectedScenarioId);
    const next =
      (candidates.length ? pickRandom(candidates) : pickRandom(scenarioList)) || null;
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

          const data = sttMode === "local" ? await sttLocal(audioBlob) : await stt(audioBlob);
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

  const lastAssistantText =
    [...messages].reverse().find((m) => m.role === "assistant")?.content || "";

  if (!isLoggedIn()) return null;

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">Roleplay</h1>
          <p className="sub">
            Practice realistic situations in <b>{targetLanguage}</b>.
          </p>
        </div>

        <div className="row">
          <button
            className="btn"
            type="button"
            onClick={newScenario}
            disabled={loading || loadingScenario || !scenarioList.length}
          >
            New scenario
          </button>

          <button
            className="btn-ghost"
            type="button"
            onClick={() => setScenario((prev) => (prev ? { ...prev } : prev))}
            disabled={loading || loadingScenario || !scenario}
          >
            Reset
          </button>
        </div>
      </div>

      {error ? <div className="err" style={{ marginBottom: 10 }}>{error}</div> : null}

      {/* Scenario info card */}
      <div className="card cardPad" style={{ marginBottom: 12 }}>
        <div className="scenarioBar">
          <div className="scenarioLeft">
            <div className="scenarioTitle">
              {scenario?.title || scenarioStub?.title || (loadingScenario ? "Loading..." : "—")}
            </div>
            <div className="small">({targetLanguage})</div>

            <label className="small">
              Choose scenario
              <select
                className="select"
                value={selectedScenarioId}
                onChange={handleScenarioChange}
                disabled={loadingScenario || loading || !scenarioList.length}
                style={{ marginLeft: 10, width: 260, maxWidth: "80vw" }}
              >
                {scenarioList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="switchRow">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={assistantStarts}
                onChange={(e) => setAssistantStarts(e.target.checked)}
                disabled={loadingScenario}
              />
              Assistant starts
            </label>

            {loadingScenario ? (
              <span className="small">Preparing in {targetLanguage}…</span>
            ) : null}
          </div>
        </div>

        <p className="scenarioDesc">
          {scenario?.description || scenarioStub?.description || ""}
        </p>

        {scenario?.starterUser ? (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="small">
              Suggested start: <i>{scenario.starterUser}</i>
            </span>
            <button
              className="btn"
              type="button"
              onClick={() => setInput(scenario.starterUser)}
              disabled={loading || loadingScenario}
            >
              Use
            </button>
          </div>
        ) : null}
      </div>

      <div className="chatShell">
        {/* Conversation */}
        <div className="chatPanel">
          <div className="card cardPad">
            <div className="chatWindow">
              {visibleMessages.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.70)" }}>
                  {loadingScenario
                    ? "Preparing roleplay…"
                    : "Start the conversation or use the suggested start."}
                </div>
              ) : (
                visibleMessages.map((m, i) => (
                  <div key={i} className="msg">
                    <div className="msgMeta">{m.role === "user" ? "You" : "Roleplay"}</div>
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
                disabled={loading || loadingScenario}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || loadingScenario || !input.trim() || !scenario}
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
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
                STT
                <select
                  className="select"
                  value={sttMode}
                  onChange={(e) => setSttMode(e.target.value)}
                  disabled={sttLoading || recording || loadingScenario}
                >
                  <option value="openai">OpenAI (cloud)</option>
                  <option value="local">Local (whisper.cpp)</option>
                </select>
              </label>

              <label>
                Voice
                <select
                  className="select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  disabled={loadingScenario}
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

            <div style={{ height: 10 }} />

            <div className="quickActions">
              <button
                className="btn"
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={sttLoading || loadingScenario}
              >
                {sttLoading ? "Transcribing..." : recording ? "Stop recording" : "Start recording"}
              </button>

              <button
                className="btn"
                type="button"
                disabled={speaking || loadingScenario || !lastAssistantText}
                onClick={() => speak(lastAssistantText)}
              >
                {speaking ? "Speaking..." : "Speak last reply"}
              </button>
            </div>

            <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
              Tip: stay in character. If you don’t understand, ask: “Say it another way.”
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}