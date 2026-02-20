import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

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
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Google Sign-In failed")}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
            />
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
