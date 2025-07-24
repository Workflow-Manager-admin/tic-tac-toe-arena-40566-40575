//
// api.js - Centralized API utility for Tic Tac Toe frontend
//
// Provides standardized authentication header handling, error management, 
// polling helpers, and ensures all backend requests go through one middleware.
//
import { useAuth } from "./AuthContext";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

//
// PUBLIC_INTERFACE
// Unified function for authenticated fetch requests
//
export async function apiFetch(path, { method = "GET", token, body, headers, ...rest } = {}) {
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;
  const options = {
    method,
    headers: {
      ...(headers || {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    ...rest,
  };
  if (body !== undefined && body !== null) {
    // Handle stringified object content
    if (typeof body === "string" || body instanceof FormData) {
      options.body = body;
    } else {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
  }
  let response;
  try {
    response = await fetch(url, options);
  } catch (e) {
    // Network error
    throw new Error("Could not connect to API backend.");
  }
  if (!response.ok) {
    // Try to retrieve error message from response if available
    let err = "API request failed";
    try {
      const errJson = await response.json();
      err = errJson.detail || errJson.message || JSON.stringify(errJson) || response.statusText;
    } catch { /* ignore */ }
    throw new Error(err);
  }
  // Try to parse JSON, fall back to plain text
  try {
    return await response.json();
  } catch {
    return response;
  }
}

//
// PUBLIC_INTERFACE
// Simple polling helper for repeated API checks (used for game/live polling)
//
export function pollApi(fn, { interval = 1000, stopIf, signal } = {}) {
  let active = true;
  let pollId = null;
  function stop() {
    active = false;
    if (pollId) clearTimeout(pollId);
  }
  function pollLoop() {
    if (!active) return;
    fn()
      .then(result => {
        if (stopIf && stopIf(result)) {
          stop();
        } else if (active) {
          pollId = setTimeout(pollLoop, interval);
        }
      })
      .catch(() => {
        // stop polling if error? Optional: could keep polling on certain errors.
        if (active) pollId = setTimeout(pollLoop, interval * 2);
      });
  }
  pollLoop();
  if (signal) signal.addEventListener("abort", stop);
  return stop;
}
