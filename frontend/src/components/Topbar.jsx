import useTheme from "../hooks/useTheme";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";

const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || "Nil";
const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || "Nil";
const SHOP_PHONE = import.meta.env.VITE_SHOP_PHONE || "Nil";
const SHOP_EMAIL = import.meta.env.VITE_SHOP_EMAIL || "Nil";

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{SHOP_NAME}</h1>
        <div className="topbar-sub">
          <span>{SHOP_ADDRESS}</span>
          <span>Ph: {SHOP_PHONE}</span>
          <span>Email: {SHOP_EMAIL}</span>
        </div>
      </div>

      <div className="topbar-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {user && (
          <button
            className="logout-btn"
            onClick={handleLogout}
            style={{
              marginLeft: "10px",
              padding: "8px 14px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            🔐 Logout
          </button>
        )}
      </div>
    </header>
  );
}
