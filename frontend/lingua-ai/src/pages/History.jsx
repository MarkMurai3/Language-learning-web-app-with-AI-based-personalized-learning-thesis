import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, clearHistory } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";

function getVideoIdFromUrl(url) {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    // youtube.com/watch?v=<id>
    const v = u.searchParams.get("v");
    if (v) return v;
    // youtube.com/embed/<id>
    const parts = u.pathname.split("/").filter(Boolean);
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
  } catch {}
  return "";
}

function thumbFromUrl(url) {
  const id = getVideoIdFromUrl(url);
  if (!id) return "";
  // good default size
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export default function History() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await getHistory(50);
      setItems(data.items || []);
    } catch (e) {
      clearAuth();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    load();
  }, [navigate]);

  async function handleClear() {
    setError("");
    setClearing(true);
    try {
      await clearHistory();
      await load();
    } catch (e) {
      setError(e?.message || "Failed to clear history");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">History</h1>
          <p className="sub">Videos you opened from recommendations/search.</p>
        </div>

        <div className="row">
          <button className="btn" type="button" onClick={handleClear} disabled={clearing}>
            {clearing ? "Clearing..." : "Clear history"}
          </button>
        </div>
      </div>

      {error ? <div className="err">{error}</div> : null}

      {loading ? (
        <div className="card cardPad" style={{ color: "rgba(255,255,255,0.75)" }}>
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="card cardPad" style={{ color: "rgba(255,255,255,0.75)" }}>
          No history yet. Open a video from Home to add items.
        </div>
      ) : (
        <div className="grid">
          {items.map((h, idx) => {
            const thumbnail = h.thumbnail || thumbFromUrl(h.url);
            return (
              <div key={`${h.id || "h"}_${idx}`} className="videoCard">
                <div className="videoTop">
                  {thumbnail ? (
                    <img className="thumb" src={thumbnail} alt={h.title || "Video"} />
                  ) : (
                    <div className="thumb" />
                  )}

                  <div>
                    <h3 className="videoTitle">{h.title || "(no title)"}</h3>
                    <p className="videoMeta">{h.channel || "(no channel)"}</p>
                    <p className="videoReason" style={{ opacity: 0.8 }}>
                      Opened: {h.watchedAt || "—"}
                    </p>
                  </div>
                </div>

                <div className="actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => h.url && window.open(h.url, "_blank", "noreferrer")}
                    disabled={!h.url}
                  >
                    Open again
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}