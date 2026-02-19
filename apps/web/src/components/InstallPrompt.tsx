import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("installPromptDismissed")) {
        setShowPrompt(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", "1");
  };

  if (isInstalled || !showPrompt || !deferredPrompt) return null;

  return (
    <div className="install-banner">
      <div style={{ marginBottom: "var(--space-3)", fontWeight: 500 }}>
        Install Time Tracker
      </div>
      <div className="text-muted" style={{ marginBottom: "var(--space-3)" }}>
        Add to home screen for quick access and offline use.
      </div>
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <button onClick={handleInstall} className="btn btn-primary" style={{ flex: 1 }}>
          Install
        </button>
        <button onClick={handleDismiss} className="btn btn-ghost">
          Not now
        </button>
      </div>
    </div>
  );
}
