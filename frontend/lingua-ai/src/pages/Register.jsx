// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerApi } from "../services/api";
import { saveAuth } from "../services/authStorage";
import AuthLayout from "../components/AuthLayout";

const LANGUAGE_OPTIONS = [
  "English", "French", "Spanish", "German", "Italian", "Portuguese",
  "Mandarin Chinese", "Arabic", "Russian", "Japanese", "Korean", "Hindi",
  "Thai", "Vietnamese", "Indonesian", "Bengali", "Urdu", "Turkish",
  "Polish", "Swedish", "Finnish", "Romanian", "Dutch", "Czech", "Greek",
  "Bulgarian", "Swahili", "Afrikaans", "Norwegian", "Tagalog",
  "Ukrainian", "Hebrew", "Malay", "Tamil",
];

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
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
      const { user, token } = await registerApi(email, password, targetLanguage);
      saveAuth(token, user);

      // after register -> interests onboarding
      navigate("/interests");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Practice Languages With AI"
      subtitle="Create your account and start immersing today."
    >
      <div className="auth-cardHeader">
        <div className="auth-icon" aria-hidden="true">✨</div>
        <div className="auth-cardTitle">Register</div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label>Target language</label>
          <select
            className="input"
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

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="field">
          <label>Confirm password</label>
          <input
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            required
          />
        </div>

        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Creating account..." : "Register"}
        </button>

        {error ? <div className="err">{error}</div> : null}
      </form>

      <div className="auth-footer">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </AuthLayout>
  );
}