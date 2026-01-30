import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getHealthStatus,
  getMe,
  getRecommendations,
  getMyInterests,
  likeVideo,
  dislikeVideo,
  addToHistory,
} from "../services/api";

import { isLoggedIn, clearAuth } from "../services/authStorage";
import VideoCard from "../components/VideoCard";

export default function Home() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("Loading...");
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [recError, setRecError] = useState("");
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    // 1) must be logged in
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    // 2) load user
    getMe()
      .then((data) => setMe(data.user))
      .catch(() => {
        clearAuth();
        navigate("/login");
      });

    // 3) ensure interests exist
    getMyInterests()
      .then((data) => {
        if (!data.interests || data.interests.length === 0) {
          navigate("/interests");
        }
      })
      .catch(() => {
        clearAuth();
        navigate("/login");
      });

    // 4) backend health
    getHealthStatus()
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Backend connection failed"));




    // 5) recommendations
    getRecommendations()
      .then((data) => {
        const maybe =
          Array.isArray(data) ? data :
          Array.isArray(data?.items) ? data.items :
          Array.isArray(data?.items?.items) ? data.items.items :
          Array.isArray(data?.results) ? data.results :
          Array.isArray(data?.data) ? data.data :
          [];

        setItems(maybe);

        // Helpful debug: you will see the real shape in the console
        console.log("getRecommendations raw response:", data);
        console.log("normalized items array length:", maybe.length);
      })
      .catch((err) =>
        setRecError(err?.message || "Failed to load recommendations")
      );

      
  }, [navigate]);

  async function saveHistory(v) {
    // helper to keep your onPlay/onOpen clean
    try {
      await addToHistory({
        id: v.id,
        title: v.title,
        url: v.url,
        channel: v.channel,
        language: v.language,
      });
    } catch (e) {
      // don't block UX if history fails
      console.warn("Failed to add to history:", e);
    }
  }

  return (
    <div>
      <h1>Home</h1>
      <p>{status}</p>

      {me ? (
        <p>
          Verified user: <b>{me.email}</b>
        </p>
      ) : (
        <p>Verifying login...</p>
      )}

      {/* ✅ NOW PLAYING SECTION (PUTS PLAYER ABOVE RECOMMENDATIONS) */}
      {playingId && (
        <div style={{ marginBottom: 16 }}>
          <h2>Now playing</h2>

          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <iframe
              title="YouTube player"
              src={`https://www.youtube.com/embed/${playingId}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
                borderRadius: 10,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setPlayingId(null)}>Close player</button>
          </div>
        </div>
      )}

      <h2>Recommendations</h2>
      {recError && <p style={{ color: "crimson" }}>{recError}</p>}

        <div style={{ display: "grid", gap: 12, maxWidth: 700 }}>
          {!Array.isArray(items) ? (
            <p style={{ color: "crimson" }}>
              items is not an array (type: {typeof items})
            </p>
          ) : items.length === 0 ? (
            <p>No recommendations yet.</p>
          ) : (
            items.map((v, idx) => (
              <VideoCard
                key={v?.id ?? idx}
                title={v?.title ?? "(no title)"}
                channel={v?.channel ?? "(no channel)"}
                url={v?.url ?? ""}
                reason={v?.reason ?? ""}

                onPlay={async () => {
                  await saveHistory(v);
                  if (v?.id) setPlayingId(v.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}

                onOpen={async () => {
                  await saveHistory(v);
                  if (v?.url) window.open(v.url, "_blank", "noreferrer");
                }}

                onLike={() => v?.id && likeVideo(v.id)}
                onDislike={() => v?.id && dislikeVideo(v.id)}
              />
            ))
          )}
        </div>

    </div>
  );
}
