import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, clearHistory } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await getHistory(20);
      setItems(data.items || []);
    } catch (e) {
      clearAuth();
      navigate("/login");
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    load();
  }, [navigate]);

  return (
    <div>
      <h1>History</h1>

      <button
        onClick={async () => {
          await clearHistory();
          load();
        }}
      >
        Clear history
      </button>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ display: "grid", gap: 10, marginTop: 12, maxWidth: 700 }}>
        {items.length === 0 ? (
          <p>No history yet. Open a video from Home to add items.</p>
        ) : (
          items.map((h, idx) => (
            <div key={`${h.id}_${idx}`} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
              <div style={{ fontWeight: 600 }}>{h.title}</div>
              <div style={{ opacity: 0.75 }}>{h.channel}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Opened: {h.watchedAt}</div>
              <a href={h.url} target="_blank" rel="noreferrer">Open again</a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
