import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import Dither from "../components/Dither";
import API_BASE_URL from "../config/api";

function LoginPage() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAppState();

  const API_BASE = `${API_BASE_URL}/api/auth`;

  useEffect(() => {
    if (user) navigate("/interview/setup");
  }, [user, navigate]);

  const validateForm = () => {
    if (!username.trim()) {
      setError("Username is required");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (mode === "signup") {
      if (username.length < 3) {
        setError("Username must be at least 3 characters");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `${mode} failed`);
        return;
      }
      login(data.username ?? username, data.userId);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username ?? username);
      navigate("/interview/setup");
    } catch {
      setError("Failed to connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <Dither
          waveColor={[0.1, 0.07, 0.35]}
          waveSpeed={0.04}
          waveFrequency={3}
          waveAmplitude={0.3}
          colorNum={4}
          pixelSize={3}
          enableMouseInteraction={false}
        />
        <div className="login-brand-content">
          <div className="login-brand-name">
            St<span className="login-brand-sub">an</span>dOut
          </div>
          <p className="login-brand-tagline">
            Practice technical interviews.
            <br />
            Get feedback.
          </p>
          <ul className="login-features">
            <li>Live speech transcription</li>
            <li>Real-time code diff timeline</li>
            <li>AI-powered session analysis</li>
          </ul>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-box">
          <h2 className="login-title">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <p className="login-subtitle">
            {mode === "login"
              ? "Welcome back. Enter your credentials to continue."
              : "Get started with a free account."}
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
                autoComplete="username"
              />
              {mode === "signup" && username && username.length < 3 && (
                <small className="login-hint">
                  At least 3 characters ({username.length}/3)
                </small>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
              {mode === "signup" && password && password.length < 6 && (
                <small className="login-hint">
                  At least 6 characters ({password.length}/6)
                </small>
              )}
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="login-switch">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="login-switch-btn"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
