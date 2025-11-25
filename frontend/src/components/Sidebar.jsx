import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthProvider";

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo-circle">AP</span>
        <span className="logo-text">Amman Pipies</span>
      </div>

      <nav className="sidebar-nav">

        {user?.role === "admin" && (
          <NavLink to="/" end className="nav-link">
            📊 Dashboard
          </NavLink>
        )}

        <NavLink to="/categories" className="nav-link">
          📂 Categories
        </NavLink>

        <NavLink to="/products" className="nav-link">
          📦 Products
        </NavLink>

        <NavLink to="/orders" className="nav-link">
          🧾 Bills / Orders
        </NavLink>
      </nav>
    </aside>
  );
}
