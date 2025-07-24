import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

/**
 * Lobby component shows all current user's games, allows joining unfinished games, and can start a new one.
 * Integrates with backend to list games and join selected games.
 */

// PUBLIC_INTERFACE
export default function Lobby({ onOpenGame }) {
  const { token } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(null);
  const [error, setError] = useState(null);
  const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  const authFetch = useCallback(
    async (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [token]
  );

  // Fetch user's games
  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authFetch(`${BACKEND}/games/my`);
      if (!resp.ok) throw new Error("Could not fetch games");
      const data = await resp.json();
      setGames(data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch games");
    } finally {
      setLoading(false);
    }
  }, [authFetch, BACKEND]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleJoinGame = async (gameId) => {
    setJoinLoading(gameId);
    setError(null);
    try {
      const resp = await authFetch(`${BACKEND}/games/${gameId}/join`, { method: "POST" });
      if (!resp.ok) throw new Error("Could not join game.");
      // Opening the game will trigger GameContainer to hydrate it
      onOpenGame(gameId);
    } catch (e) {
      setError(e.message || "Failed to join game.");
    } finally {
      setJoinLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ marginBottom: 20, marginTop: 10 }}>
        <em>Loading games...</em>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--bg-secondary)",
      borderRadius: 12,
      padding: "1.2rem 1rem",
      boxShadow: "0 2px 12px rgba(30,136,229,0.06)",
      margin: "0 auto 1.2rem auto",
      maxWidth: 440
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 10, color: "var(--text-primary)" }}>Your Games Lobby</h3>
      {error && (
        <div style={{ color: "#f32828", fontWeight: 500, margin: "8px 0" }}>{error}</div>
      )}
      <button
        className="auth-button"
        onClick={fetchGames}
        style={{ marginBottom: 10, fontSize: "1.0rem" }}
      >
        Refresh
      </button>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {games.length === 0 ? (
          <li>
            <em>No games yet.</em>
          </li>
        ) : (
          games.map((g) => (
            <li key={g.id} style={{
              borderBottom: "1px solid var(--border-color)",
              marginBottom: 8,
              paddingBottom: 6,
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{
                flexGrow: 1,
                color: "var(--text-primary)",
                fontWeight: g.status === "IN_PROGRESS" ? 600 : undefined
              }}>
                #{g.id.slice(-6)}
                {" "}
                <span style={{fontSize: 11, color: "#555", marginLeft: 8}}>
                  {g.status.replaceAll("_", " ")}
                </span>
              </span>
              <button
                className="auth-button"
                style={{ padding: "6px 14px", marginLeft: 6, fontSize: "0.96rem" }}
                disabled={joinLoading === g.id || g.status === "FINISHED"}
                onClick={() => onOpenGame(g.id)}
                aria-label="Open game"
              >
                Open
              </button>
              {(g.status !== "FINISHED" && g.status !== "IN_PROGRESS" && g.player_o === null) && (
                <button
                  className="auth-button"
                  style={{ padding: "5px 10px", fontSize: "0.9rem", marginLeft: 6, background: "#43A047" }}
                  disabled={joinLoading === g.id}
                  onClick={() => handleJoinGame(g.id)}
                >
                  {joinLoading === g.id ? "Joining..." : "Join as O"}
                </button>
              )}
            </li>
          ))
        )}
      </ul>
      <div style={{ fontSize: "0.95rem", marginTop: 8, color: "var(--text-secondary)" }}>
        Open a game, or join new games waiting for a player.
      </div>
    </div>
  );
}
