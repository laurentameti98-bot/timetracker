import { NavLink } from "react-router-dom";
import {
  Timer,
  ClipboardList,
  BarChart3,
  FolderKanban,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import InstallPrompt from "./InstallPrompt";

const navItems: { to: string; icon: LucideIcon; label: string }[] = [
  { to: "/", icon: Timer, label: "Timer" },
  { to: "/logs", icon: ClipboardList, label: "Logs" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();

  return (
    <div className="layout-main">
      <InstallPrompt />
      {!isOnline && (
        <div className="offline-banner">
          Offline – data will sync when connected
        </div>
      )}
      <main className="layout-content">{children}</main>
      <nav className="nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon className="nav-icon" size={22} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
