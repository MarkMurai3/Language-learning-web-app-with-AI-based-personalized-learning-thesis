import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as registerApi } from "../services/api";
import { saveAuth } from "../services/authStorage";

const LANGUAGE_OPTIONS = [
  "English",
  "French",
  "Spanish",
  "Italian",
  "German",
  "Hungarian",
];

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [nativeLanguage, setNativeLanguage] = useState("Hungarian");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [targetLevel, setTargetLevel] = useState("A2");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await registerApi(
        email,
        password,
        username,
        nativeLanguage,
        targetLanguage,
        targetLevel
      );

      saveAuth(token, user);

      // After register → interests onboarding
      navigate("/interests");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Register</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
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

        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        <label>
          Confirm password
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Creating account..." : "Register"}
        </button>

        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </div>
  );
}
