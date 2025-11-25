// src/ToastProvider.jsx
import { createContext, useCallback, useContext, useState } from "react";
// 1. Import the files at the top (Your Audio Imports)
import successSound from "./public/success1.mp3";
import FailSound from "./public/failure.mp3";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // --- HELPER FUNCTION FOR ICONS ---
  const getIcon = (type) => {
    switch (type) {
      case "success": return "✅"; // You can replace this with <FaCheckCircle /> later
      case "error": return "❌";   // You can replace this with <FaTimesCircle /> later
      default: return "ℹ️";
    }
  };

  const show = useCallback((message, type = "info") => {
    if (!message) return;

    // --- NEW AUDIO LOGIC STARTS HERE ---
    try {
      let audio = null;
      
      if (type === "success") {
        audio = new Audio(successSound); 
        // Path relative to public folder
      } else if (type === "error") {
        audio = new Audio(FailSound);    // Path relative to public folder
      }

      // Play the audio and catch errors
      if (audio) {
        audio.play().catch((err) => console.warn("Audio play blocked:", err));
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
    // --- NEW AUDIO LOGIC ENDS HERE ---

    const id = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id, message, type }]);

    // auto close after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = {
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error"),
    info: (msg) => show(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {/* Added Icon Span Here */}
            <span className="toast-icon">{getIcon(t.type)}</span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}