import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAvailableInterests,
  getMyInterests,
  setMyInterests,
} from "../services/api";
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
  const canSave = selected.length > 0;

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

        const cat = a.catalog || {};
        setCatalog(cat);

        setSelected(Array.isArray(mine.interests) ? mine.interests : []);
        setPrefs(mine.prefs || { avoidLearningContent: false });

        // default expand first category
        const keys = Object.keys(cat);
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
      await setMyInterests({ interests: selected, prefs });
      navigate("/");
    } catch (e) {
      setError(e.message || "Failed to save interests");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card cardPad" style={{ color: "rgba(255,255,255,0.75)" }}>
          Loading interests…
        </div>
      </div>
    );
  }

  const categories = Object.keys(catalog || {});
  const subs = expandedCat ? catalog[expandedCat] || [] : [];

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">Interests</h1>
          <p className="sub">
            Pick what you actually enjoy. This improves recommendations and keeps immersion fun.
          </p>
        </div>

        <div className="row">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !canSave}
            type="button"
          >
            {saving ? "Saving..." : "Save interests"}
          </button>
        </div>
      </div>

      {error ? <div className="err" style={{ marginBottom: 10 }}>{error}</div> : null}

      {/* Preferences */}
      <div className="card cardPad" style={{ marginBottom: 12 }}>
        <div className="sectionTitle">Preferences</div>

        <label className="checkbox" style={{ marginTop: 8 }}>
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
      <div className="card cardPad" style={{ marginBottom: 12 }}>
        <div className="sectionTitle">Custom interests</div>
        <div className="mini" style={{ marginBottom: 10 }}>
          Add anything not in the list. Example: manga, streetwear, football, history memes…
        </div>

        <div className="row">
          <input
            className="input"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type an interest…"
          />
          <button
            className="btn"
            type="button"
            onClick={addCustom}
            disabled={!customText.trim()}
          >
            Add
          </button>
        </div>
      </div>

      {/* Category + tags */}
      {categories.length === 0 ? (
        <div className="card cardPad">No interest catalog received from backend.</div>
      ) : (
        <div className="interestsLayout">
          {/* Categories */}
          <div className="card cardPad">
            <div className="sectionTitle">Categories</div>
            <div className="list">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpandedCat(cat)}
                  className={`catBtn ${expandedCat === cat ? "catBtnActive" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="card cardPad">
            <div className="sectionTitle">{expandedCat || "Tags"}</div>
            <div className="mini" style={{ marginBottom: 10 }}>
              Select tags, then optionally mark favorites ⭐ for stronger recommendations.
            </div>

            <div className="list">
              {subs.map((sub) => {
                const id = makeId(expandedCat, sub);
                const item = selectedMap.get(id);
                const checked = !!item;
                const fav = item?.weight === 2;

                return (
                  <div key={id} className="tagRow">
                    <div className="tagLeft">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTag(id)}
                      />
                      <div>{sub}</div>
                    </div>

                    <button
                      type="button"
                      className="starBtn"
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
      <div style={{ marginTop: 12 }} className="selectedBox">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Selected</div>

        {selected.length === 0 ? (
          <div className="mini">none</div>
        ) : (
          <div>
            {selected.map((x) => (
              <span
                key={x.id}
                className={`selectedPill ${x.weight === 2 ? "selectedPillFav" : ""}`}
              >
                {x.weight === 2 ? "⭐" : ""} {x.id}
              </span>
            ))}
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !canSave}
            type="button"
          >
            {saving ? "Saving..." : "Save interests"}
          </button>

          {!canSave ? (
            <span className="mini">Select at least one interest to continue.</span>
          ) : (
            <span className="mini">You can edit this anytime in Profile.</span>
          )}
        </div>
      </div>
    </div>
  );
}