import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      setError("No credential received");
      return;
    }
    setError(null);
    try {
      await login(credential);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const triggerGoogleLogin = () => {
    const clickable = googleButtonRef.current?.querySelector('[role="button"]') ?? googleButtonRef.current?.querySelector('div[class*="LgbsSe"]');
    (clickable as HTMLElement)?.click();
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Time Tracker</h1>
          <p className="login-subtitle">
            VITE_GOOGLE_CLIENT_ID is not configured. Add it to your .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="login-title">Time Tracker</h1>
          <p className="login-subtitle">Sign in to track your time</p>
        </div>
        <div className="login-actions">
          <div className="login-google-container">
            <button
              type="button"
              className="login-google-btn"
              onClick={triggerGoogleLogin}
            >
              <svg className="login-google-icon" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.16h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Weiter mit Google</span>
            </button>
            <div ref={googleButtonRef} className="login-google-hidden" aria-hidden>
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError("Google Sign-In failed")}
                useOneTap={false}
                theme="filled_blue"
                size="large"
                text="continue_with"
                shape="pill"
              />
            </div>
          </div>
          {error && (
            <p className="login-error">{error}</p>
          )}
        </div>
      </div>
      <div className="login-bg-gradient" aria-hidden />
    </div>
  );
}
