import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../services/api";
import { isLoggedIn, clearAuth, setUser } from "../services/authStorage";

const LANGUAGE_OPTIONS = ["English", "French", "Spanish", "Italian", "German", "Hungarian"];
const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function Profile() {
  const navigate = useNavigate();

  const [username, setUsernameState] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("Hungarian");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [targetLevel, setTargetLevel] = useState("A2");

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
      setLoading(true);

      try {
        const data = await getProfile();
        const u = data.user;

        setUsernameState(u.username || "");
        setNativeLanguage(u.nativeLanguage || "Hungarian");
        setTargetLanguage(u.targetLanguage || "English");
        setTargetLevel(u.targetLevel || "A2");
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
      const data = await updateProfile({
        username,
        nativeLanguage,
        targetLanguage,
        targetLevel,
      });

      // Update localStorage user so Navbar updates immediately
      setUser(data.user);
      setSuccess("Profile updated!");
    } catch (e) {
      setError(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading profile...</p>;

  return (
    <div>
      <h1>Profile</h1>

      <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsernameState(e.target.value)} />
        </label>

        <label>
          Native language
          <select value={nativeLanguage} onChange={(e) => setNativeLanguage(e.target.value)}>
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target language
          <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target level
          <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)}>
            {LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </label>

        <button disabled={saving} type="submit">
          {saving ? "Saving..." : "Save profile"}
        </button>

        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </form>
    </div>
  );
}
