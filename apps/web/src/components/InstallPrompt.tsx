import { useState, useEffect, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const gotNativePrompt = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      gotNativePrompt.current = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("installPromptDismissed")) {
        setShowPrompt(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (!localStorage.getItem("installPromptDismissed")) {
      if (isIOS()) {
        setShowManualPrompt(true);
      } else if (isMobile()) {
        const t = setTimeout(() => {
          if (!gotNativePrompt.current) {
            setShowManualPrompt(true);
          }
        }, 3000);
        return () => {
          clearTimeout(t);
          window.removeEventListener("beforeinstallprompt", handler);
        };
      }
    }

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
    setShowManualPrompt(false);
    localStorage.setItem("installPromptDismissed", "1");
  };

  const showBanner = (showPrompt && deferredPrompt) || showManualPrompt;
  if (isInstalled || !showBanner) return null;

  if (showManualPrompt && !deferredPrompt) {
    return (
      <div className="install-banner">
        <div style={{ marginBottom: "var(--space-3)", fontWeight: 500 }}>
          Install Time Tracker
        </div>
        <div className="text-muted" style={{ marginBottom: "var(--space-3)" }}>
          {isIOS()
            ? "Tap the Share button at the bottom, then 'Add to Home Screen'."
            : "Open the browser menu (⋮) and tap 'Add to Home screen' or 'Install app'."}
        </div>
        <button onClick={handleDismiss} className="btn btn-primary" style={{ width: "100%" }}>
          Got it
        </button>
      </div>
    );
  }

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
