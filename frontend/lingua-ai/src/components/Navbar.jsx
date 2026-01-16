import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser, isLoggedIn } from "../services/authStorage";

export default function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <nav style={{ display: "flex", gap: 12, padding: 12, alignItems: "center" }}>
      <Link to="/">Home</Link>

      {!loggedIn ? (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      ) : (
        <>
          <Link to="/profile">Profile</Link>
          <Link to="/history">History</Link>


          <span style={{ marginLeft: 8 }}>
            Logged in as <b>{user?.email}</b>
          </span>

          <button onClick={handleLogout} style={{ marginLeft: 8 }}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
