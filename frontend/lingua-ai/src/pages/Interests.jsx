import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableInterests, getMyInterests, setMyInterests } from "../services/api";
import { isLoggedIn, clearAuth } from "../services/authStorage";

export default function Interests() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    async function load() {
      setError("");
      setLoading(true);
      try {
        const a = await getAvailableInterests();
        const mine = await getMyInterests();
        setAvailable(a.interests || []);
        setSelected(mine.interests || []);
      } catch (e) {
        // token invalid/expired
        clearAuth();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [navigate]);

  function toggleInterest(interest) {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((x) => x !== interest)
        : [...prev, interest]
    );
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await setMyInterests(selected);
      navigate("/");
    } catch (e) {
      setError(e.message || "Failed to save interests");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading interests...</p>;

  return (
    <div>
      <h1>Select your interests</h1>
      <p>These will be used to personalize recommendations.</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        {available.map((interest) => (
          <label key={interest} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={selected.includes(interest)}
              onChange={() => toggleInterest(interest)}
            />
            {interest}
          </label>
        ))}
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
