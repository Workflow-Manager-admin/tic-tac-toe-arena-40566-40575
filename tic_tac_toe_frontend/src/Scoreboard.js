import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";

/**
 * Scoreboard shows current user's Win/Loss/Tie counts.
 * Data loaded from /stats/me endpoint.
 */
// PUBLIC_INTERFACE
export default function Scoreboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/stats/me`, { token });
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div style={{margin: 12}}><em>Loading scores...</em></div>
  }
  if (error) {
    return <div style={{color: "#f32828", margin: 12}}>Failed to load scores: {error}</div>
  }
  return (
    <div style={{
      padding: "1rem",
      background: "var(--bg-secondary)",
      borderRadius: 12,
      boxShadow: "0 2px 9px rgba(30,136,229,0.07)",
      margin: "0 auto 1rem auto",
      maxWidth: 340
    }}>
      <h4 style={{margin:0, color:"var(--text-primary)"}}>Scoreboard</h4>
      <div>
        <b>Played:</b> {stats.games_played} <span style={{color:"#888"}}>|</span>
        <b style={{marginLeft: 9, color:"#43A047"}}>Won:</b> {stats.games_won}{" "}
        <b style={{marginLeft: 9, color:"#f32828"}}>Lost:</b> {stats.games_lost}{" "}
        <b style={{marginLeft: 9, color:"#FFC107"}}>Tied:</b> {stats.games_tied}
      </div>
    </div>
  );
}
