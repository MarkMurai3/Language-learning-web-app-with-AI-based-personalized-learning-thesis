import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHealthStatus, getMe, getRecommendations } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";
import VideoCard from "../components/VideoCard";
import {getMyInterests } from "../services/api";
import { likeVideo, dislikeVideo } from "../services/api";
import { addToHistory } from "../services/api";


export default function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Loading...");
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [recError, setRecError] = useState("");

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

    getHealthStatus()
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Backend connection failed"));

    getRecommendations()
      .then((data) => setItems(data.items))
      .catch((err) => setRecError(err.message || "Failed to load recommendations"));
  }, [navigate]);

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

      <h2>Recommendations</h2>
      {recError && <p style={{ color: "crimson" }}>{recError}</p>}

      <div style={{ display: "grid", gap: 12, maxWidth: 700 }}>
        {items.map((v) => (
          <VideoCard
            key={v.id}
            title={v.title}
            channel={v.channel}
            url={v.url}
            reason={v.reason}
            onOpen={async () => {
              try {
                await addToHistory({
                  id: v.id,
                  title: v.title,
                  url: v.url,
                  channel: v.channel,
                  language: v.language,
                });
              } finally {
                window.open(v.url, "_blank", "noreferrer");
              }
            }}
            onLike={() => likeVideo(v.id)}
            onDislike={() => dislikeVideo(v.id)}
          />

        ))}

      </div>
    </div>
  );
}
