import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../services/api";
import { clearAuth, isLoggedIn } from "../services/authStorage";

import {
  adminGetUsers,
  adminSetUserDisabled,
  adminGetBlockedVideos,
  adminAddBlockedVideo,
  adminDeleteBlockedVideo,
  adminGetSeedChannels,
  adminAddSeedChannel,
  adminDeleteSeedChannel,
} from "../services/api";

export default function Admin() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("users"); // users | blocked | seeds
  const [error, setError] = useState("");

  // users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // blocked
  const [blocked, setBlocked] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockVideoId, setBlockVideoId] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // seeds
  const [seeds, setSeeds] = useState([]);
  const [seedsLoading, setSeedsLoading] = useState(false);
  const [seedLanguage, setSeedLanguage] = useState("Spanish");
  const [seedChannelId, setSeedChannelId] = useState("");
  const [seedLabel, setSeedLabel] = useState("");

  // ---- auth + role gate ----
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    getMe()
      .then((data) => {
        const u = data.user;
        setMe(u);

        if (u?.role !== "admin") {
          navigate("/");
        }
      })
      .catch(() => {
        clearAuth();
        navigate("/login");
      });
  }, [navigate]);

  // ---- loaders ----
  async function loadUsers() {
    setError("");
    setUsersLoading(true);
    try {
      const data = await adminGetUsers();
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadBlocked() {
    setError("");
    setBlockedLoading(true);
    try {
      const data = await adminGetBlockedVideos();
      setBlocked(data.items || []);
    } catch (e) {
      setError(e.message || "Failed to load blocked videos");
    } finally {
      setBlockedLoading(false);
    }
  }

  async function loadSeeds() {
    setError("");
    setSeedsLoading(true);
    try {
      const data = await adminGetSeedChannels();
      setSeeds(data.items || []);
    } catch (e) {
      setError(e.message || "Failed to load seed channels");
    } finally {
      setSeedsLoading(false);
    }
  }

  // load active tab
  useEffect(() => {
    if (!me) return;
    if (me.role !== "admin") return;

    if (tab === "users") loadUsers();
    if (tab === "blocked") loadBlocked();
    if (tab === "seeds") loadSeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, me]);

  if (!me) return <p>Checking admin access...</p>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Admin</h1>
      <p>
        Logged in as <b>{me.email}</b> ({me.role})
      </p>

      <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
        <button onClick={() => setTab("users")} disabled={tab === "users"}>
          Users
        </button>
        <button onClick={() => setTab("blocked")} disabled={tab === "blocked"}>
          Blocked videos
        </button>
        <button onClick={() => setTab("seeds")} disabled={tab === "seeds"}>
          Seed channels
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {tab === "users" && (
        <section style={{ border: "1px solid #444", padding: 12, borderRadius: 10 }}>
          <h2>Users</h2>
          {usersLoading ? (
            <p>Loading...</p>
          ) : users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: "1px solid #333",
                    padding: 10,
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div>
                    <div>
                      <b>#{u.id}</b> {u.email} — <i>{u.role}</i>
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      targetLanguage: {u.targetLanguage || "—"} • disabled:{" "}
                      {u.disabled ? "true" : "false"}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setError("");
                      try {
                        await adminSetUserDisabled(u.id, !u.disabled);
                        await loadUsers();
                      } catch (e) {
                        setError(e.message || "Update failed");
                      }
                    }}
                  >
                    {u.disabled ? "Enable" : "Disable"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "blocked" && (
        <section style={{ border: "1px solid #444", padding: 12, borderRadius: 10 }}>
          <h2>Blocked videos</h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");

              const vid = blockVideoId.trim();
              if (!vid) return;

              try {
                await adminAddBlockedVideo(vid, blockReason.trim());
                setBlockVideoId("");
                setBlockReason("");
                await loadBlocked();
              } catch (e2) {
                setError(e2.message || "Failed to add blocked video");
              }
            }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}
          >
            <input
              value={blockVideoId}
              onChange={(e) => setBlockVideoId(e.target.value)}
              placeholder="YouTube videoId (e.g., dQw4w9WgXcQ)"
              style={{ flex: 1, minWidth: 260, padding: 10 }}
            />
            <input
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason (optional)"
              style={{ flex: 1, minWidth: 220, padding: 10 }}
            />
            <button type="submit">Block</button>
          </form>

          {blockedLoading ? (
            <p>Loading...</p>
          ) : blocked.length === 0 ? (
            <p>No blocked videos.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {blocked.map((b) => (
                <div
                  key={b.videoId}
                  style={{
                    border: "1px solid #333",
                    padding: 10,
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div>
                    <div>
                      <b>{b.videoId}</b>
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      {b.reason || "—"} • {b.createdAt || ""}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setError("");
                      try {
                        await adminDeleteBlockedVideo(b.videoId);
                        await loadBlocked();
                      } catch (e) {
                        setError(e.message || "Delete failed");
                      }
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "seeds" && (
        <section style={{ border: "1px solid #444", padding: 12, borderRadius: 10 }}>
          <h2>Seed channels</h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");

              const ch = seedChannelId.trim();
              if (!ch) return;

              try {
                await adminAddSeedChannel(seedLanguage, ch, seedLabel.trim());
                setSeedChannelId("");
                setSeedLabel("");
                await loadSeeds();
              } catch (e2) {
                setError(e2.message || "Failed to add seed channel");
              }
            }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}
          >
            <select value={seedLanguage} onChange={(e) => setSeedLanguage(e.target.value)}>
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
              <option>Italian</option>
              <option>German</option>
              <option>Hungarian</option>
            </select>

            <input
              value={seedChannelId}
              onChange={(e) => setSeedChannelId(e.target.value)}
              placeholder="channelId (from YouTube channel URL)"
              style={{ flex: 1, minWidth: 260, padding: 10 }}
            />

            <input
              value={seedLabel}
              onChange={(e) => setSeedLabel(e.target.value)}
              placeholder="Label (optional)"
              style={{ flex: 1, minWidth: 220, padding: 10 }}
            />

            <button type="submit">Add seed</button>
          </form>

          {seedsLoading ? (
            <p>Loading...</p>
          ) : seeds.length === 0 ? (
            <p>No seed channels.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {seeds.map((s, idx) => (
                <div
                  key={`${s.language}:${s.channelId}:${idx}`}
                  style={{
                    border: "1px solid #333",
                    padding: 10,
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div>
                    <div>
                      <b>{s.language}</b> — {s.channelId}
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      {s.label || "—"} • {s.createdAt || ""}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setError("");
                      try {
                        await adminDeleteSeedChannel(s.language, s.channelId);
                        await loadSeeds();
                      } catch (e) {
                        setError(e.message || "Delete failed");
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
