import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile, updateProfile, getMyInterests } from "../services/api";
import { isLoggedIn, clearAuth, setUser } from "../services/authStorage";

const LANGUAGE_OPTIONS = [
  "English", "French", "Spanish", "German", "Italian", "Portuguese",
  "Mandarin Chinese", "Arabic", "Russian", "Japanese", "Korean", "Hindi",
  "Thai", "Vietnamese", "Indonesian", "Bengali", "Urdu", "Turkish",
  "Polish", "Swedish", "Finnish", "Romanian", "Dutch", "Czech", "Greek",
  "Bulgarian", "Swahili", "Afrikaans", "Norwegian", "Tagalog",
  "Ukrainian", "Hebrew", "Malay", "Tamil"
];

export default function Profile() {
  const navigate = useNavigate();

  const [targetLanguage, setTargetLanguage] = useState("English");
  const [myInterests, setMyInterests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    async function load() {
      setError("");
      setSuccess("");
      setLoading(true);

      try {
        // 1) load profile
        const data = await getProfile();
        const u = data.user || {};
        setTargetLanguage(u.targetLanguage || "English");

        // 2) load interests
        const interestsData = await getMyInterests();
        setMyInterests(interestsData.interests || []);
      } catch (e) {
        clearAuth();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const data = await updateProfile({ targetLanguage });

      // Update localStorage user so Navbar updates immediately
      setUser(data.user);
      setSuccess("Profile updated!");
    } catch (e) {
      setError(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card cardPad" style={{ color: "rgba(255,255,255,0.75)" }}>
          Loading profile…
        </div>
      </div>
    );
  }

  const interestsText =
    myInterests.length ? myInterests.map((x) => x.id).join(", ") : "none";

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="h1">Profile</h1>
          <p className="sub">Set your target language and manage your interests.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr", maxWidth: 900 }}>
        {/* Main settings card */}
        <div className="card cardPad">
          <div className="sectionTitle">Learning settings</div>

          <form onSubmit={handleSave} className="formGrid">
            <div className="field">
              <label>Target language</label>
              <select
                className="select"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <button className="btn btn-primary" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save profile"}
              </button>

              <Link to="/interests" style={{ textDecoration: "none" }}>
                <button className="btn" type="button">
                  Edit interests
                </button>
              </Link>
            </div>

            {error ? <div className="err">{error}</div> : null}
            {success ? <div className="success">{success}</div> : null}
          </form>

          <div className="divider" />

          <div className="kv">
            <div>
              <strong>Current interests:</strong>
            </div>
            <div style={{ color: "rgba(255,255,255,0.75)" }}>{interestsText}</div>
          </div>
        </div>

        {/* Secondary card (nice summary) */}
        <div className="card cardPad">
          <div className="sectionTitle">Recommendation quality</div>
          <div style={{ color: "rgba(255,255,255,0.75)" }}>
            Your target language and interests directly affect what you see on the Home page.
            If recommendations feel off, update interests and try again.
          </div>
        </div>
      </div>
    </div>
  );
}