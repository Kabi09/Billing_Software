// src/pages/ResetPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../ToastProvider";

export default function ResetPassword() {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter otp + new pwd
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      // backend: send OTP to email
      await api.post("/auth/request-reset-otp", {
        email: email.trim(),
      });

      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("OTP is required");
      return;
    }
    if (!password) {
      toast.error("New password is required");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: password,
      });

      toast.success("Password reset successful. Please login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "Failed to reset password. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-main">
        <div className="login-card">
          <h2 className="login-title">Reset Password 🔐</h2>
          <p className="login-subtitle">
            Enter your email, we will send OTP to reset your password.
          </p>

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="form" style={{ gap: 14 }}>
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

              <button
                type="submit"
                disabled={loading}
                style={{ fontSize: 18, padding: "10px 16px", marginTop: 8 }}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={handleResetPassword}
              className="form"
              style={{ gap: 14 }}
            >
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  style={{ fontSize: 18, padding: "12px 14px" }}
                  disabled
                />
              </label>

              <label>
                OTP from Email
                <input
                  type="text"
                  value={otp}
                  style={{ fontSize: 18, padding: "12px 14px" }}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  value={password}
                  style={{ fontSize: 18, padding: "12px 14px" }}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                />
              </label>

              <label>
                Confirm New Password
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
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <p className="login-footer" style={{ marginTop: 16 }}>
            Remembered password?{" "}
            <Link to="/login" style={{ fontWeight: 600 }}>
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
