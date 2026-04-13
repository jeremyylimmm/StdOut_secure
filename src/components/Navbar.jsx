import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

const PATH_LABELS = {
  "/interview/setup": "~/dashboard",
  "/interviews/old": "~/interviews",
  "/interview/session": "~/session",
  "/dashboard": "~/dashboard",
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, theme, toggleTheme } = useAppState();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pathLabel = PATH_LABELS[location.pathname] ?? "~";

  return (
    <header className="navbar">
      <Link to="/interview/setup" className="navbar-brand">
        <span className="navbar-prompt">&gt;</span>
        <span className="navbar-brand-name">St<span className="navbar-brand-sub">an</span>dOut</span>
      </Link>

      <div className="navbar-path">{pathLabel}</div>

      <nav className="navbar-actions">
        {user && (
          <span className="navbar-user">
            <span className="navbar-user-sigil">@</span>{user.name}
          </span>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className="navbar-flag-btn"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "light" : "dark"}
        </button>
        {user && (
          <button type="button" onClick={handleLogout} className="navbar-flag-btn navbar-flag-btn--danger">
            logout
          </button>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
