import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMe,
  getRecommendations,
  getMyInterests,
  likeVideo,
  dislikeVideo,
  addToHistory,
  searchVideos,
  getFeedback,
} from "../services/api";

import { isLoggedIn, clearAuth } from "../services/authStorage";
import VideoCard from "../components/VideoCard";

export default function Home() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);

  const [items, setItems] = useState([]);
  const [recError, setRecError] = useState("");

  const [playingId, setPlayingId] = useState(null);

  // Search
  const [searchText, setSearchText] = useState("");
  const [searchInfo, setSearchInfo] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Feedback
  const [feedback, setFeedback] = useState({ liked: [], disliked: [] });
  const likedSet = new Set((feedback?.liked || []).map(String));
  const dislikedSet = new Set((feedback?.disliked || []).map(String));

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    getMe()
      .then((data) => setMe(data.user))
      .catch(() => {
        clearAuth();
        navigate("/login");
      });

    getFeedback()
      .then((data) => setFeedback(data.feedback || { liked: [], disliked: [] }))
      .catch(() => {});

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

    getRecommendations()
      .then((data) => {
        const maybe =
          Array.isArray(data) ? data :
          Array.isArray(data?.items) ? data.items :
          Array.isArray(data?.items?.items) ? data.items.items :
          Array.isArray(data?.results) ? data.results :
          Array.isArray(data?.data) ? data.data :
          (data?.items && typeof data.items === "object") ? Object.values(data.items) :
          [];

        setItems(maybe);
      })
      .catch((err) => setRecError(err?.message || "Failed to load recommendations"));
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
    } catch {}
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
      setSearchResults([]);
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

  const listRaw = searchResults !== null ? searchResults : items;
  const listToShow = (listRaw || []).filter((v) => !dislikedSet.has(String(v?.id)));

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">Home</h1>
          <p className="sub">
            {me?.targetLanguage ? (
              <>Target: <b>{me.targetLanguage}</b> • </>
            ) : null}
            Find native content you actually like.
          </p>
        </div>

        <div className="row">
          {me?.email ? <span className="pill">{me.email}</span> : null}
          <button className="btn" type="button" onClick={() => navigate("/interests")}>
            Edit interests
          </button>
        </div>
      </div>

      <div className="card cardPad">
        <form onSubmit={handleSearchSubmit} className="searchBar">
          <input
            className="input searchInput"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search anything… (any language)"
          />

          <button className="btn btn-primary" type="submit" disabled={searchLoading || !searchText.trim()}>
            {searchLoading ? "Searching..." : "Search"}
          </button>

          {searchResults !== null && (
            <button className="btn-ghost" type="button" onClick={clearSearch}>
              Clear
            </button>
          )}
        </form>

        {searchError ? <div className="err" style={{ marginTop: 10 }}>{searchError}</div> : null}

        {searchInfo ? (
          <div style={{ marginTop: 10, color: "rgba(255,255,255,0.75)" }}>
            Translated: <b>{searchInfo.translated}</b>
          </div>
        ) : null}
      </div>

      <div className="spacer" />

      {playingId ? (
        <div className="card cardPad">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800 }}>Now playing</div>
            <button className="btn" onClick={() => setPlayingId(null)}>
              Close
            </button>
          </div>

          <div style={{ height: 12 }} />

          <div className="playerWrap">
            <iframe
              title="YouTube player"
              src={`https://www.youtube.com/embed/${playingId}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      <div className="spacer" />

      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>
          {searchResults !== null ? "Search results" : "Recommended for you"}
        </h2>
        {searchResults === null && recError ? <span className="err">{recError}</span> : null}
      </div>

      <div className="spacer" />

      {listToShow.length === 0 ? (
        <div className="card cardPad" style={{ color: "rgba(255,255,255,0.75)" }}>
          {searchResults !== null ? "No search results." : "No recommendations yet."}
        </div>
      ) : (
        <div className="grid">
          {listToShow.map((v, idx) => (
            <VideoCard
              key={v?.id ?? idx}
              title={v?.title ?? "(no title)"}
              channel={v?.channel ?? "(no channel)"}
              url={v?.url ?? ""}
              reason={v?.reason ?? ""}
              thumbnail={v?.thumbnail ?? ""}

              liked={likedSet.has(String(v?.id))}
              disliked={dislikedSet.has(String(v?.id))}

              onPlay={async () => {
                await saveHistory(v);
                if (v?.id) setPlayingId(v.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}

              onOpen={async () => {
                await saveHistory(v);
                if (v?.url) window.open(v.url, "_blank", "noreferrer");
              }}

              onLike={async () => {
                if (!v?.id) return;
                const data = await likeVideo(v.id);
                setFeedback(data.feedback || { liked: [], disliked: [] });
              }}

              onDislike={async () => {
                if (!v?.id) return;
                const data = await dislikeVideo(v.id);
                setFeedback(data.feedback || { liked: [], disliked: [] });

                setItems((prev) => prev.filter((x) => x?.id !== v.id));
                setSearchResults((prev) => (prev ? prev.filter((x) => x?.id !== v.id) : prev));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}