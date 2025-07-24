import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

/**
 * GameHistory component lists all games user played (+ outcome for each).
 * Loaded from /stats/history backend endpoint.
 */

// PUBLIC_INTERFACE
export default function GameHistory() {
  const { token, user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${BACKEND}/stats/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Could not fetch history");
      const data = await resp.json();
      setHistory(data || []);
    } catch (err) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [BACKEND, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div style={{
      background: "var(--bg-secondary)",
      borderRadius: 12,
      padding: "1rem",
      boxShadow: "0 2px 8px rgba(30,136,229,0.07)",
      margin: "0 auto 1.4rem auto",
      maxWidth: 440
    }}>
      <h4 style={{color:"var(--text-primary)", marginTop: 0, marginBottom: 9}}>Game History</h4>
      {loading && <div><em>Loading history...</em></div>}
      {error && <div style={{color: "#f32828"}}>Failed to load history: {error}</div>}
      <ul style={{listStyle: "none", padding: 0, marginBottom: 0}}>
        {history.length === 0 && !loading ? (
          <li><em>No games played yet.</em></li>
        ) : (
          history.map(g => (
            <li key={g.id} style={{
              borderBottom: "1px solid var(--border-color)",
              marginBottom: 6,
              paddingBottom: 4
            }}>
              #{g.id.slice(-6)} &mdash; <span style={{fontSize:12, color:"#555"}}>{g.status.replaceAll("_", " ")}</span>
              <br />
              Outcome: {determineOutcome(g, user?.id)}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function determineOutcome(game, userId) {
  if (game.status !== "FINISHED") return <span style={{color:"#888"}}>Ongoing</span>;
  if (!game.winner) return <span style={{color:"#FFC107"}}>Tie</span>;
  if (game.winner === userId) return <span style={{color:"#43A047"}}>Win 🎉</span>;
  return <span style={{color:"#f32828"}}>Loss</span>;
}
