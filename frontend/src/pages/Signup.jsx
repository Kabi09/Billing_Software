// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../ToastProvider";

export default function Signup() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !phoneNumber.trim() || !email.trim() || !password) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // NOTE: no role sent → backend should set default (admin/employee)
      const res = await api.post("/auth/signup", {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        password,
      });

      toast.success(res.data.message || "Signup successful. Please login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Signup failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-main">
        <div className="login-card">
          <h2 className="login-title">Create account 📝</h2>
          <p className="login-subtitle">
            Add new staff / owner account for this billing system.
          </p>

          <form onSubmit={handleSubmit} className="form" style={{ gap: 14 }}>
            <label>
              Full Name
              <input
                type="text"
                value={name}
                style={{ fontSize: 18, padding: "12px 14px" }}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>

            <label>
              Phone Number
              <input
                type="number"
                value={phoneNumber}
                style={{ fontSize: 18, padding: "12px 14px" }}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={email}
                style={{ fontSize: 18, padding: "12px 14px" }}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                style={{ fontSize: 18, padding: "12px 14px" }}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={confirm}
                style={{ fontSize: 18, padding: "12px 14px" }}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{ fontSize: 18, padding: "10px 16px", marginTop: 8 }}
            >
              {loading ? "Creating..." : "Sign up"}
            </button>
          </form>

          <p className="login-footer" style={{ marginTop: 16 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ fontWeight: 600 }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
