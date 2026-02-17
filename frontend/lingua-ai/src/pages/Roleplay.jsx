import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChat, tts, stt } from "../services/api";
import { isLoggedIn, clearAuth, getUser } from "../services/authStorage";

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normLang(s) {
  return String(s || "").trim().toLowerCase();
}

const ROLEPLAYS = [
  {
    id: "grocery_store",
    language: "Spanish",
    title: "Buying groceries",
    description:
      "You are in a grocery store. You want ingredients for a recipe. Ask for help, compare options, and pay. The assistant is the store employee.",
    starterUser: "¡Hola! Busco ingredientes para hacer pasta. ¿Me puedes ayudar?",
    starterAssistant: "¡Hola! Claro 😊 ¿Qué quieres cocinar exactamente y para cuántas personas?",
    systemPrompt: `
You are a grocery store employee.
The user is a customer trying to buy ingredients.
Speak ONLY in the user's target language.
Be natural, friendly, and realistic.
Ask short follow-up questions to keep the conversation going.
If the user uses the wrong word or grammar, correct gently and continue the roleplay.
`.trim(),
  },
  {
    id: "directions",
    language: "French",
    title: "Asking for directions",
    description:
      "You are lost in a city. Ask someone for directions, clarify landmarks, and confirm you understood. The assistant is a local person.",
    starterUser: "Excusez-moi, vous pouvez m’aider ? Je cherche la gare.",
    starterAssistant: "Bien sûr ! Tu es à pied ou en voiture ? Et tu sais où tu es en ce moment ?",
    systemPrompt: `
You are a local person on the street.
The user is lost and asks for directions.
Speak ONLY in the user's target language.
Ask clarifying questions (where they want to go, landmarks, etc.).
Use simple, practical directions and confirm understanding.
Correct mistakes gently without breaking the roleplay.
`.trim(),
  },
  {
    id: "restaurant",
    language: "English",
    title: "Ordering food",
    description:
      "You’re at a restaurant. Ask about the menu, order food and drinks, and handle small problems (spicy, allergies, etc.). The assistant is the waiter.",
    starterUser: "Hello! Could I see the menu, please?",
    starterAssistant: "Of course! Here you go 😊 Do you have any allergies or preferences today?",
    systemPrompt: `
You are a waiter in a restaurant.
The user is ordering food.
Speak ONLY in the user's target language.
Ask about preferences, allergies, drinks, desserts.
Be polite and conversational.
Correct mistakes gently and continue.
`.trim(),
  },
  {
    id: "hotel_checkin",
    language: "English",
    title: "Hotel check-in",
    description:
      "You arrive at a hotel. Check in, confirm your booking, ask about breakfast/Wi-Fi, and request anything you need. The assistant is the receptionist.",
    starterUser: "Hi, I have a reservation under the name Márk Murai.",
    starterAssistant: "Welcome! 😊 Great — may I see your ID, and what dates are you staying with us?",
    systemPrompt: `
You are a hotel receptionist.
The user is checking in to their hotel.
Speak ONLY in the user's target language.
Ask for name, booking details, dates, ID, and preferences.
Offer helpful info (breakfast time, Wi-Fi, checkout time).
Correct mistakes gently and keep going.
`.trim(),
  },
  {
  id: "grocery_store_it",
  language: "Italian",
  title: "Buying groceries",
  description:
    "You are in a grocery store. You want ingredients for a recipe. Ask for help, compare options, and pay. The assistant is the store employee.",
  starterUser: "Ciao! Cerco ingredienti per fare la pasta. Mi puoi aiutare?",
  starterAssistant: "Ciao! Certo 😊 Che cosa vuoi cucinare esattamente e per quante persone?",
  systemPrompt: `
You are a grocery store employee.
The user is a customer trying to buy ingredients.
Speak ONLY in the user's target language.
Be natural, friendly, and realistic.
Ask short follow-up questions to keep the conversation going.
Correct mistakes gently and continue the roleplay.
`.trim(),
},
{
  id: "grocery_store_de",
  language: "German",
  title: "Buying groceries",
  description:
    "You are in a grocery store. You want ingredients for a recipe. Ask for help, compare options, and pay. The assistant is the store employee.",
  starterUser: "Hallo! Ich suche Zutaten, um Pasta zu kochen. Können Sie mir helfen?",
  starterAssistant: "Hallo! Klar 😊 Was genau möchtest du kochen und für wie viele Personen?",
  systemPrompt: `
You are a grocery store employee.
The user is a customer trying to buy ingredients.
Speak ONLY in the user's target language.
Be natural, friendly, and realistic.
Ask short follow-up questions to keep the conversation going.
Correct mistakes gently and continue the roleplay.
`.trim(),
},

];

function pickScenarioForLanguage(targetLanguage, currentScenarioId = null) {
  const tl = normLang(targetLanguage);

  const pool = ROLEPLAYS.filter((s) => normLang(s.language) === tl);

  // if you don't have scenarios yet for that language, fallback to all
  const effectivePool = pool.length ? pool : ROLEPLAYS;

  // avoid picking the same one if possible
  if (effectivePool.length > 1 && currentScenarioId) {
    let next = pickRandom(effectivePool);
    while (next.id === currentScenarioId) next = pickRandom(effectivePool);
    return next;
  }

  return pickRandom(effectivePool);
}

export default function Roleplay() {
  const navigate = useNavigate();

  const [provider, setProvider] = useState("openai");

  // read target language from local storage user
  const [targetLanguage, setTargetLanguage] = useState("English");

  // scenario starts as null, we choose it once we know the language
  const [scenario, setScenario] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

  // Protect page + init language + initial scenario
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    const u = getUser();
    const tl = u?.targetLanguage || "English";
    setTargetLanguage(tl);

    const first = pickScenarioForLanguage(tl);
    setScenario(first);
  }, [navigate]);

  // Whenever scenario changes (or assistantStarts), reset conversation
  useEffect(() => {
    if (!scenario) return;

    const baseSystem = [
      {
        role: "system",
        content: scenario.systemPrompt,
      },
      {
        role: "system",
        content: `Reminder: Speak ONLY in ${targetLanguage}. Stay in roleplay.`,
      },
    ];

    if (assistantStarts && scenario.starterAssistant) {
      setMessages([...baseSystem, { role: "assistant", content: scenario.starterAssistant }]);
    } else {
      setMessages(baseSystem);
    }

    setInput("");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, assistantStarts, targetLanguage]);

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  function newScenario() {
    const next = pickScenarioForLanguage(targetLanguage, scenario?.id);
    setScenario(next);
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

  if (!scenario) return <p>Loading roleplay…</p>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Roleplay</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          Scenario: <b>{scenario.title}</b> <span style={{ opacity: 0.7 }}>({targetLanguage})</span>
        </div>

        <button type="button" onClick={newScenario} disabled={loading}>
          New scenario
        </button>

        <label>
          Provider{" "}
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="openai">OpenAI</option>
            <option value="llama3">Llama 3 (local)</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            // reset current scenario conversation
            const resetScenario = pickScenarioForLanguage(targetLanguage, scenario.id);
            setScenario(resetScenario); // easiest reliable reset
          }}
          disabled={loading}
        >
          Reset
        </button>
      </div>

      <div style={{ marginTop: 10, opacity: 0.9 }}>
        <p style={{ margin: "8px 0" }}>{scenario.description}</p>

        <p style={{ margin: "8px 0" }}>
          Suggested start: <i>{scenario.starterUser}</i>{" "}
          <button
            type="button"
            onClick={() => setInput(scenario.starterUser)}
            style={{ marginLeft: 8 }}
          >
            Use
          </button>
        </p>
      </div>

      <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={assistantStarts}
          onChange={(e) => setAssistantStarts(e.target.checked)}
        />
        Assistant starts
      </label>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
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

        <button type="button" onClick={recording ? stopRecording : startRecording} disabled={sttLoading}>
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
          <p style={{ opacity: 0.7 }}>Start the conversation (e.g., “Hello! I need…”)</p>
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
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
