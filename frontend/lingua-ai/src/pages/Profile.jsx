import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile, updateProfile, getMyInterests } from "../services/api";
import { isLoggedIn, clearAuth, setUser } from "../services/authStorage";

const LANGUAGE_OPTIONS = ["English", "French", "Spanish", "Italian", "German", "Hungarian"];

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
        // If token is invalid / expired -> log out
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
        targetLanguage,
      });

      // Update localStorage user so Navbar updates immediately
      setUser(data.user);
      setSuccess("Profile updated!");
    } catch (e) {
      setError(e?.message || "Failed to update profile");
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
          Target language
          <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
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

      {/* Interests preview + edit button */}
      <div style={{ marginTop: 16, opacity: 0.9 }}>
        <b>Interests:</b>{" "}
        {myInterests.length ? myInterests.map((x) => x.id).join(", ") : "none"}
      </div>

      <div style={{ marginTop: 10 }}>
        <Link to="/interests">
          <button type="button">Edit interests</button>
        </Link>
      </div>
    </div>
  );
}
