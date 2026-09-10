import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { operator, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        🛰️ Fleet Command
      </Link>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/missions">Missions</Link>
        {operator ? (
          <>
            <span className="operator-name">{operator.name}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </div>
    </nav>
  );
}
