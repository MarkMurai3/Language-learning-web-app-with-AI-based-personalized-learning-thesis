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
  searchVideos,
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

  // 🔎 Search state
  const [searchText, setSearchText] = useState("");
  const [searchInfo, setSearchInfo] = useState(null); // { query, translated }
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

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
          // if backend returns { items: {} } keyed by id:
          (data?.items && typeof data.items === "object") ? Object.values(data.items) :
          [];

        setItems(maybe);
      })
      .catch((err) =>
        setRecError(err?.message || "Failed to load recommendations")
      );
  }, [navigate]);

  async function saveHistory(v) {
    try {
      await addToHistory({
        id: v.id,
        title: v.title,
        url: v.url,
        channel: v.channel,
        language: v.language,
      });
    } catch (e) {
      console.warn("Failed to add to history:", e);
    }
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchInfo(null);

    try {
      const data = await searchVideos(q);
      setSearchInfo({ query: data.query, translated: data.translated });
      setSearchResults(data.items || []);
    } catch (e2) {
      setSearchError(e2.message || "Search failed");
      setSearchResults([]); // show empty state if it fails
    } finally {
      setSearchLoading(false);
    }
  }

  function clearSearch() {
    setSearchResults(null);
    setSearchInfo(null);
    setSearchError("");
    setSearchText("");
  }

  // ✅ Choose which list to show
  const listToShow = searchResults !== null ? searchResults : items;

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

      {/* 🔎 SEARCH UI (put under verification) */}
      <form
        onSubmit={handleSearchSubmit}
        style={{ display: "flex", gap: 10, maxWidth: 700, margin: "12px 0" }}
      >
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search anything… (any language)"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #444" }}
        />
        <button type="submit" disabled={searchLoading || !searchText.trim()}>
          {searchLoading ? "Searching..." : "Search"}
        </button>

        {searchResults !== null && (
          <button type="button" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      {searchError && <p style={{ color: "crimson" }}>{searchError}</p>}

      {searchInfo && (
        <p style={{ opacity: 0.8 }}>
          Translated: <b>{searchInfo.translated}</b>
        </p>
      )}

      {/* ✅ NOW PLAYING */}
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

      {/* Title changes depending on mode */}
      <h2>{searchResults !== null ? "Search results" : "Recommendations"}</h2>

      {/* Show recommendation error only when not searching */}
      {searchResults === null && recError && (
        <p style={{ color: "crimson" }}>{recError}</p>
      )}

      <div style={{ display: "grid", gap: 12, maxWidth: 700 }}>
        {listToShow.length === 0 ? (
          <p>
            {searchResults !== null
              ? "No search results."
              : "No recommendations yet."}
          </p>
        ) : (
          listToShow.map((v, idx) => (
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
