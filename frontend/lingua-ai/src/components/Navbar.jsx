import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser, isLoggedIn } from "../services/authStorage";

export default function Navbar({ onToggleNotes }) {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();
  const isAdmin = user?.role === "admin";

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link className="brand" to="/">
          LinguaAI
        </Link>

        {loggedIn && (
          <div className="nav-links">
            <Link className="nav-link" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/chat">
              Chat
            </Link>
            <Link className="nav-link" to="/story">
              Story
            </Link>
            <Link className="nav-link" to="/roleplay">
              Roleplay
            </Link>
            <Link className="nav-link" to="/history">
              History
            </Link>
            <Link className="nav-link" to="/profile">
              Profile
            </Link>
            {isAdmin && (
              <Link className="nav-link" to="/admin">
                Admin
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="nav-right">
        {!loggedIn ? (
          <>
            <Link className="nav-link" to="/login">
              Login
            </Link>
            <Link className="nav-link" to="/register">
              Register
            </Link>
          </>
        ) : (
          <>
            <span className="pill">
              {user?.email || "Logged in"}
            </span>

            <button className="btn" type="button" onClick={onToggleNotes}>
              Notes
            </button>

            <button className="btn" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}