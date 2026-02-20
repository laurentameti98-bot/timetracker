import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvalidateAll } from "../hooks/useApiData";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../contexts/AuthContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const invalidateAll = useInvalidateAll();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem("apiUrl") ?? "";
  });

  const handleSaveApiUrl = () => {
    localStorage.setItem("apiUrl", apiUrl);
    alert("API URL saved.");
  };

  const handleRefresh = () => {
    invalidateAll();
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>

      <div className="settings-section">
        <h2 className="settings-section-title">Account</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-3)" }}>
          {user?.email}
        </p>
        <button onClick={handleLogout} className="btn btn-secondary">
          Log out
        </button>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Theme</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-3)" }}>
          Choose light, dark, or match your system preference.
        </p>
        <div className="theme-options">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`theme-option ${theme === t ? "active" : ""}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">API URL</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-3)" }}>
          Backend URL (leave empty to use same origin)
        </p>
        <input
          type="url"
          placeholder="https://api.example.com"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="input"
          style={{ marginBottom: "var(--space-3)" }}
        />
        <button onClick={handleSaveApiUrl} className="btn btn-primary">
          Save
        </button>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Data</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-3)" }}>
          Refresh data from the server
        </p>
        <button onClick={handleRefresh} className="btn btn-primary">
          Refresh
        </button>
      </div>
    </div>
  );
}
