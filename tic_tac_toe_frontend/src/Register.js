import React, { useState } from "react";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
function Register({ onSuccess, onSwitchToLogin }) {
  /** Simple Register form component for user sign up */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { register, authLoading, error } = useAuth();
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!username || !password) {
      setFormError("Username and password are required.");
      return;
    }
    if (password.length < 4) {
      setFormError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }
    const result = await register(username, password);
    if (result) {
      // switch to login form after registration
      if (onSuccess) onSuccess();
      else onSwitchToLogin();
    } else {
      setFormError("Registration failed.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      {formError && <div className="auth-error">{formError}</div>}
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          autoComplete="username"
          value={username}
          className="auth-input"
          onChange={(e) => setUsername(e.target.value)}
          disabled={authLoading}
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={password}
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
          disabled={authLoading}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          autoComplete="new-password"
          value={confirm}
          className="auth-input"
          onChange={(e) => setConfirm(e.target.value)}
          disabled={authLoading}
        />
        <button
          type="submit"
          className="auth-button"
          disabled={authLoading}
        >
          {authLoading ? "Registering..." : "Register"}
        </button>
      </form>
      <div className="auth-switch">
        Already have an account?{" "}
        <button
          className="auth-link"
          onClick={onSwitchToLogin}
          disabled={authLoading}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Register;
