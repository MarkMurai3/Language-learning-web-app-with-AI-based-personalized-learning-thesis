import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableInterests, getMyInterests, setMyInterests } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";

function makeId(cat, sub) {
  return `${cat}:${sub}`;
}

export default function Interests() {
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState({}); // { Movies: ["Comedy"...], ... }
  const [expandedCat, setExpandedCat] = useState(null);

  // selected = [{ id, weight }]
  const [selected, setSelected] = useState([]);

  const [prefs, setPrefs] = useState({ avoidLearningContent: false });

  const [customText, setCustomText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // quick lookup
  const selectedMap = useMemo(() => {
    const m = new Map();
    for (const x of selected) m.set(x.id, x);
    return m;
  }, [selected]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    async function load() {
      setError("");
      setLoading(true);
      try {
        const a = await getAvailableInterests(); // { catalog }
        const mine = await getMyInterests(); // { interests: [{id, weight}], prefs }

        setCatalog(a.catalog || {});
        setSelected(Array.isArray(mine.interests) ? mine.interests : []);
        setPrefs(mine.prefs || { avoidLearningContent: false });

        // default expand first category
        const keys = Object.keys(a.catalog || {});
        if (keys.length && !expandedCat) setExpandedCat(keys[0]);
      } catch (e) {
        clearAuth();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  function toggleTag(id) {
    setSelected((prev) => {
      const exists = prev.find((x) => x.id === id);
      if (exists) return prev.filter((x) => x.id !== id);
      return [...prev, { id, weight: 1 }];
    });
  }

  function toggleFavorite(id) {
    setSelected((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, weight: x.weight === 2 ? 1 : 2 } : x
      )
    );
  }

  function addCustom() {
    const raw = customText.trim();
    if (!raw) return;

    const id = `custom:${raw}`;
    setSelected((prev) => {
      if (prev.some((x) => x.id === id)) return prev;
      return [...prev, { id, weight: 1 }];
    });

    setCustomText("");
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await setMyInterests({
        interests: selected,
        prefs,
      });
      navigate("/");
    } catch (e) {
      setError(e.message || "Failed to save interests");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading interests...</p>;

  const categories = Object.keys(catalog || {});

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Select your interests</h1>
      <p>These will be used to personalize recommendations.</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {/* Preferences */}
      <div style={{ margin: "12px 0", padding: 12, border: "1px solid #444", borderRadius: 10 }}>
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={!!prefs.avoidLearningContent}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, avoidLearningContent: e.target.checked }))
            }
          />
          Don’t recommend “learning/lesson” type content (prefer native content)
        </label>
      </div>

      {/* Custom interests */}
      <div style={{ margin: "12px 0", padding: 12, border: "1px solid #444", borderRadius: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Custom interests</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g., football, manga, streetwear, history memes…"
            style={{ flex: 1, padding: 10 }}
          />
          <button type="button" onClick={addCustom} disabled={!customText.trim()}>
            Add
          </button>
        </div>
      </div>

      {/* Category + tags */}
      {categories.length === 0 ? (
        <p>No interest catalog received from backend.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
          {/* Categories */}
          <div style={{ border: "1px solid #444", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Categories</div>
            <div style={{ display: "grid", gap: 8 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpandedCat(cat)}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #333",
                    background: expandedCat === cat ? "#222" : "transparent",
                    color: "white",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div style={{ border: "1px solid #444", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>
              {expandedCat || "Tags"}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {(catalog[expandedCat] || []).map((sub) => {
                const id = makeId(expandedCat, sub);
                const item = selectedMap.get(id);
                const checked = !!item;
                const fav = item?.weight === 2;

                return (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      border: "1px solid #333",
                      padding: 10,
                      borderRadius: 10,
                    }}
                  >
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTag(id)}
                      />
                      {sub}
                    </label>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(id)}
                      disabled={!checked}
                      title="Favorite (stronger recommendations)"
                    >
                      {fav ? "⭐ Favorite" : "☆ Favorite"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected summary */}
      <div style={{ marginTop: 12, opacity: 0.9 }}>
        <b>Selected:</b>{" "}
        {selected.length === 0
          ? "none"
          : selected.map((x) => (x.weight === 2 ? `⭐ ${x.id}` : x.id)).join(", ")}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save interests"}
        </button>
        <button onClick={() => navigate("/")}>Skip</button>
      </div>
    </div>
  );
}
