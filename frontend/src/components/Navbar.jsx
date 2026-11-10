import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { operator, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="brand-icon">✥</span>
          <span>
            Fleet
            <strong>Command</strong>
          </span>
        </Link>

        <nav className="sidebar-nav">
          <NavLink to="/" end className="sidebar-link">
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink to="/missions" className="sidebar-link">
            <span>➤</span>
            Missions
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-extra">
            <span>⚙</span>
            Settings
          </div>

          <div className="sidebar-extra">
            <span>?</span>
            Help
          </div>

          {operator && (
            <div className="sidebar-account">
              <div className="account-avatar">
                {operator.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span>{operator.name}</span>
              <span className="account-chevron">⌄</span>
            </div>
          )}

          <button className="sidebar-logout" onClick={handleLogout}>
            <span>⇥</span>
            Log out
          </button>
        </div>
      </aside>

      <header className="topbar">
        <div className="topbar-spacer" />
        <div className="topbar-account">
          <span className="notification-icon">♧</span>
          <div className="account-avatar">
            {operator?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <span>{operator?.name || "Operator"}</span>
          <span>⌄</span>
        </div>
      </header>
    </>
  );
}