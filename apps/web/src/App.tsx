import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TimerPage from "./pages/TimerPage";
import LogsPage from "./pages/LogsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ProjectsPage from "./pages/ProjectsPage";
import { sync } from "./lib/sync";

export default function App() {
  useEffect(() => {
    if (navigator.onLine) sync().catch(() => {});

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        sync().catch(() => {});
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", () => sync().catch(() => {}));
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TimerPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}
