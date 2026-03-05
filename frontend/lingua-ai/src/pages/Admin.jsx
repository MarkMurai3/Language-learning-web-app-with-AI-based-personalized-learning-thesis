// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, getLanguages } from "../services/api";
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

  // languages
  const [languages, setLanguages] = useState([]);

  // scope (global vs per-user)
  const [scopeUserId, setScopeUserId] = useState(""); // "" means global

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
          return;
        }

        // load languages once
        getLanguages()
          .then((d) => setLanguages(d.languages || []))
          .catch(() => {});
      })
      .catch(() => {
        clearAuth();
        navigate("/login");
      });
  }, [navigate]);

  function scopeArg() {
    return scopeUserId ? Number(scopeUserId) : undefined;
  }

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
      const data = await adminGetBlockedVideos(scopeArg());
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
      const data = await adminGetSeedChannels(scopeArg());
      setSeeds(data.items || []);
    } catch (e) {
      setError(e.message || "Failed to load seed channels");
    } finally {
      setSeedsLoading(false);
    }
  }

  // load active tab (also reload when scope changes)
  useEffect(() => {
    if (!me) return;
    if (me.role !== "admin") return;

    if (tab === "users") loadUsers();
    if (tab === "blocked") loadBlocked();
    if (tab === "seeds") loadSeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, me, scopeUserId]);

  if (!me) {
    return (
      <div className="page">
        <div className="card cardPad" style={{ color: "rgba(255,255,255,0.75)" }}>
          Checking admin access…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">Admin</h1>
          <p className="sub">
            Logged in as <b>{me.email}</b> ({me.role})
          </p>
        </div>
      </div>

      <div className="adminTop">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tabBtn ${tab === "users" ? "tabBtnActive" : ""}`}
            onClick={() => setTab("users")}
            type="button"
          >
            Users
          </button>

          <button
            className={`tabBtn ${tab === "blocked" ? "tabBtnActive" : ""}`}
            onClick={() => setTab("blocked")}
            type="button"
          >
            Blocked videos
          </button>

          <button
            className={`tabBtn ${tab === "seeds" ? "tabBtnActive" : ""}`}
            onClick={() => setTab("seeds")}
            type="button"
          >
            Seed channels
          </button>
        </div>

        {error ? <div className="err">{error}</div> : null}

        {/* Scope selector */}
        <div className="card cardPad">
          <div className="sectionTitle">Scope</div>
          <div className="small" style={{ marginBottom: 10 }}>
            Choose whether changes apply globally or to a specific user.
          </div>

          <label className="field">
            <span style={{ display: "block", marginBottom: 6, color: "rgba(255,255,255,0.65)" }}>
              Apply to
            </span>
            <select
              className="select"
              value={scopeUserId}
              onChange={(e) => setScopeUserId(e.target.value)}
              disabled={usersLoading && tab !== "users"}
            >
              <option value="">All users (global)</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  #{u.id} {u.email}
                </option>
              ))}
            </select>
          </label>

          <div className="mini" style={{ marginTop: 8 }}>
            Blocked videos + seed channels will use this scope.
          </div>
        </div>

        {/* USERS */}
        {tab === "users" && (
          <div className="card cardPad">
            <div className="sectionTitle">Users</div>

            {usersLoading ? (
              <div style={{ color: "rgba(255,255,255,0.75)" }}>Loading…</div>
            ) : users.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.75)" }}>No users found.</div>
            ) : (
              <div className="list">
                {users.map((u) => (
                  <div className="rowItem" key={u.id}>
                    <div className="rowItemLeft">
                      <div>
                        <b>#{u.id}</b> {u.email} — <span className="mini">{u.role}</span>
                      </div>
                      <div className="mini">
                        targetLanguage: {u.targetLanguage || "—"} • disabled:{" "}
                        {u.disabled ? "true" : "false"}
                      </div>
                    </div>

                    <button
                      className={`btn ${u.disabled ? "btn-primary" : ""}`}
                      type="button"
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
          </div>
        )}

        {/* BLOCKED */}
        {tab === "blocked" && (
          <div className="card cardPad">
            <div className="sectionTitle">Blocked videos</div>
            <div className="mini" style={{ marginBottom: 10 }}>
              Prevent specific YouTube video IDs from being recommended.
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");

                const vid = blockVideoId.trim();
                if (!vid) return;

                try {
                  await adminAddBlockedVideo(vid, blockReason.trim(), scopeArg());
                  setBlockVideoId("");
                  setBlockReason("");
                  await loadBlocked();
                } catch (e2) {
                  setError(e2.message || "Failed to add blocked video");
                }
              }}
              className="formRow"
            >
              <input
                className="input"
                value={blockVideoId}
                onChange={(e) => setBlockVideoId(e.target.value)}
                placeholder="YouTube videoId (e.g., dQw4w9WgXcQ)"
              />
              <input
                className="input"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Reason (optional)"
              />
              <button className="btn btn-primary" type="submit" disabled={blockedLoading}>
                Block
              </button>
            </form>

            {blockedLoading ? (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.75)" }}>Loading…</div>
            ) : blocked.length === 0 ? (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.75)" }}>No blocked videos.</div>
            ) : (
              <div className="list">
                {blocked.map((b) => (
                  <div className="rowItem" key={b.videoId}>
                    <div className="rowItemLeft">
                      <div>
                        <b>{b.videoId}</b>
                      </div>
                      <div className="mini">
                        {b.reason || "—"} • {b.createdAt || ""}
                      </div>
                    </div>

                    <button
                      className="btn"
                      type="button"
                      onClick={async () => {
                        setError("");
                        try {
                          await adminDeleteBlockedVideo(b.videoId, scopeArg());
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
          </div>
        )}

        {/* SEEDS */}
        {tab === "seeds" && (
          <div className="card cardPad">
            <div className="sectionTitle">Seed channels</div>
            <div className="mini" style={{ marginBottom: 10 }}>
              Add trusted channels per language to guide recommendations.
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");

                const ch = seedChannelId.trim();
                if (!ch) return;

                try {
                  await adminAddSeedChannel(seedLanguage, ch, seedLabel.trim(), scopeArg());
                  setSeedChannelId("");
                  setSeedLabel("");
                  await loadSeeds();
                } catch (e2) {
                  setError(e2.message || "Failed to add seed channel");
                }
              }}
              className="formRow"
              style={{ gridTemplateColumns: "220px 1fr 1fr auto" }}
            >
              <select
                className="select"
                value={seedLanguage}
                onChange={(e) => setSeedLanguage(e.target.value)}
              >
                {(languages.length ? languages : ["English"]).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>

              <input
                className="input"
                value={seedChannelId}
                onChange={(e) => setSeedChannelId(e.target.value)}
                placeholder="channelId (from YouTube channel URL)"
              />

              <input
                className="input"
                value={seedLabel}
                onChange={(e) => setSeedLabel(e.target.value)}
                placeholder="Label (optional)"
              />

              <button className="btn btn-primary" type="submit" disabled={seedsLoading}>
                Add seed
              </button>
            </form>

            {seedsLoading ? (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.75)" }}>Loading…</div>
            ) : seeds.length === 0 ? (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.75)" }}>No seed channels.</div>
            ) : (
              <div className="list">
                {seeds.map((s, idx) => (
                  <div className="rowItem" key={`${s.language}:${s.channelId}:${idx}`}>
                    <div className="rowItemLeft">
                      <div>
                        <b>{s.language}</b> — {s.channelId}
                      </div>
                      <div className="mini">
                        {s.label || "—"} • {s.createdAt || ""}
                      </div>
                    </div>

                    <button
                      className="btn"
                      type="button"
                      onClick={async () => {
                        setError("");
                        try {
                          await adminDeleteSeedChannel(s.language, s.channelId, scopeArg());
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
          </div>
        )}
      </div>
    </div>
  );
}