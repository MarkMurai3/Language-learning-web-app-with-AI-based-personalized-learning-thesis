// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginApi } from "../services/api";
import { saveAuth } from "../services/authStorage";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user, token } = await loginApi(email, password);
      saveAuth(token, user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Practice Languages With AI"
      subtitle="Improve naturally through conversation"
    >
      <div className="auth-cardHeader">
        <div className="auth-icon" aria-hidden="true">🔒</div>
        <div className="auth-cardTitle">Login</div>
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
            required
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
          />
        </div>

        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login"}
        </button>

        {error ? <div className="err">{error}</div> : null}
      </form>

      <div className="auth-footer">
        Don’t have an account? <Link to="/register">Register</Link>
      </div>
    </AuthLayout>
  );
}