// src/pages/Login.jsx
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthProvider";
import { useToast } from "../ToastProvider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // after login go back to requested page or /orders
  const from = location.state?.from?.pathname || "/orders";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = res.data;
      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      // save to AuthContext + localStorage
      login(user, token);
      toast.success("Login successful");

      // admin / employee both → go to requested page
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-main">
        <div className="login-card">
          <h2 className="login-title">Welcome back 👋</h2>
          <p className="login-subtitle">
            Please login to continue billing and orders.
          </p>

          <form onSubmit={handleSubmit} className="form" style={{ gap: 14 }}>
            <label>
              Email or Phone Number
              <input
                type="text"
                value={email}
                style={{ fontSize: 18, padding: "12px 14px" }}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  style={{ fontSize: 18, padding: "12px 14px", width: "100%" }}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 14,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "none",
                    background: "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                marginTop: 4,
              }}
            >
              <span />
              <Link to="/reset-password" style={{ textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                fontSize: 18,
                padding: "10px 16px",
                marginTop: 8,
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="login-footer" style={{ marginTop: 16 }}>
            New user?{" "}
            <Link to="/signup" style={{ fontWeight: 600 }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
