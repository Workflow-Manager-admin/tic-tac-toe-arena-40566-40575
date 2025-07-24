import React, { createContext, useContext, useState, useEffect } from "react";

// PUBLIC_INTERFACE
export const AuthContext = createContext();

/**
 * AuthProvider handles authentication state and JWT management.
 * Provides: user, token, login, logout, register, isAuthenticated, and auth loading states.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user info if token changes, for session persistence.
  useEffect(() => {
    if (token) {
      setAuthLoading(true);
      fetch(`${process.env.REACT_APP_BACKEND_URL || "http://localhost:3001"}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem("auth_token");
          }
        })
        .catch(() => {
          setUser(null);
          setToken(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setUser(null);
    }
  }, [token]);

  // PUBLIC_INTERFACE
  const login = async (username, password) => {
    setAuthLoading(true);
    setError(null);
    try {
      // Login endpoint expects form-encoded data
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || "http://localhost:3001"}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        }
      );
      if (!response.ok) {
        const err = await response.json();
        const message = err?.detail || "Login failed";
        throw new Error(message);
      }
      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem("auth_token", data.access_token);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message || "Login failed");
      setToken(null);
      localStorage.removeItem("auth_token");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  // PUBLIC_INTERFACE
  const register = async (username, password) => {
    setAuthLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || "http://localhost:3001"}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        const message =
          typeof err?.detail === "string"
            ? err.detail
            : err?.detail?.[0]?.msg || "Registration failed";
        throw new Error(message);
      }
      // Registration returns user object
      return true;
    } catch (err) {
      setError(err.message || "Registration failed");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        error,
        login,
        logout,
        register,
        authLoading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAuth() {
  /**
   * useAuth hook provides access to authentication context.
   */
  return useContext(AuthContext);
}
