import React, { useState } from "react";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
function Login({ onSuccess, onSwitchToRegister }) {
  /** Simple Login form component for user authentication */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, authLoading, error } = useAuth();
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!username || !password) {
      setFormError("Username and password are required.");
      return;
    }
    const result = await login(username, password);
    if (result && onSuccess) onSuccess();
    else if (!result) setFormError("Invalid username or password.");
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {formError && <div className="auth-error">{formError}</div>}
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          autoComplete="username"
          placeholder="Username"
          value={username}
          className="auth-input"
          onChange={(e) => setUsername(e.target.value)}
          disabled={authLoading}
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
          disabled={authLoading}
        />
        <button
          type="submit"
          className="auth-button"
          disabled={authLoading}
        >
          {authLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="auth-switch">
        Don't have an account?{" "}
        <button
          className="auth-link"
          onClick={onSwitchToRegister}
          disabled={authLoading}
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default Login;
