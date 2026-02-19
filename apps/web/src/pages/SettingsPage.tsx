import { useState } from "react";
import { useSync } from "../hooks/useSync";
import { useTheme } from "../hooks/useTheme";

export default function SettingsPage() {
  const { sync, isSyncing, lastSync } = useSync();
  const { theme, setTheme } = useTheme();
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem("apiUrl") ?? "";
  });

  const handleSaveApiUrl = () => {
    localStorage.setItem("apiUrl", apiUrl);
    alert("API URL saved.");
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>

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
          Backend URL for sync (leave empty to use same origin)
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
        <h2 className="settings-section-title">Sync</h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-3)" }}>
          {lastSync
            ? `Last sync: ${new Date(lastSync).toLocaleString()}`
            : "Not synced yet"}
        </p>
        <button
          onClick={sync}
          disabled={isSyncing}
          className={`btn ${isSyncing ? "btn-secondary" : "btn-primary"}`}
        >
          {isSyncing ? "Syncing..." : "Sync now"}
        </button>
      </div>
    </div>
  );
}
