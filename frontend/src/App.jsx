// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import { ToastProvider } from "./ToastProvider";
import { AuthProvider, useAuth } from "./AuthProvider";

function AppRoutes() {
  const { user } = useAuth();

  // Common helper: only logged-in users allowed
  const requireAuth = (element) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return element;
  };

  // Only admin allowed (dashboard)
  const requireAdmin = (element) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (user.role !== "admin") {
      // employee → redirect to Orders
      return <Navigate to="/orders" replace />;
    }
    return element;
  };

  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route
        path="/login"
        element={user ? <Navigate to="/orders" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/orders" replace /> : <Signup />}
      />
      <Route
        path="/reset-password"
        element={user ? <Navigate to="/orders" replace /> : <ResetPassword />}
      />

      {/* ---------- PROTECTED ROUTES (WITH LAYOUT) ---------- */}
      <Route
        path="/"
        element={requireAdmin(
          <Layout>
            <Dashboard />
          </Layout>
        )}
      />

      <Route
        path="/categories"
        element={requireAuth(
          <Layout>
            <Categories />
          </Layout>
        )}
      />

      <Route
        path="/products"
        element={requireAuth(
          <Layout>
            <Products />
          </Layout>
        )}
      />

      <Route
        path="/orders"
        element={requireAuth(
          <Layout>
            <Orders />
          </Layout>
        )}
      />

      {/* ---------- 404 ---------- */}
      <Route
        path="*"
        element={<div style={{ padding: 20 }}>Page not found</div>}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
