import React, { useState, useEffect, useCallback } from "react";
import Board from "./Board";
import { useAuth } from "./AuthContext";

/**
 * GameContainer component handles the tic tac toe game logic:
 * - Starts a new game
 * - Submits moves
 * - Polls for real-time game state (every 1s)
 * - Displays turn, winner, or game status
 */

// PUBLIC_INTERFACE
/**
 * GameContainer now supports loading an existing game ID (for open/continue from lobby/history).
 * Accepts:
 *   - gameId: if null, lets user start game. If set, loads that game from backend.
 *   - onLeaveGame: callback when user leaves: returns to dashboard.
 */
export default function GameContainer({ gameId = null, onLeaveGame }) {
  const { user, token } = useAuth();
  const [game, setGame] = useState(null); // game object from backend
  const [polling, setPolling] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState(null);
  const [moveError, setMoveError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);

  const BACKEND =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  // Helper for authenticated fetch
  const authFetch = useCallback(
    async (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    },
    [token]
  );

  // On load: if gameId prop is provided, load that game.
  useEffect(() => {
    let ignore = false;
    if (gameId && (!game || game.id !== gameId)) {
      setLoadingGame(true);
      authFetch(`${BACKEND}/games/${gameId}`)
        .then(resp => {
          if (!resp.ok) throw new Error("Could not fetch game");
          return resp.json();
        })
        .then(data => {
          if (!ignore) {
            setGame(data);
            setPolling(true);
          }
        })
        .catch(() => setMoveError("Game not found or you are not a player"))
        .finally(() => setLoadingGame(false));
    } else if (!gameId && !game) {
      setGame(null);
      setPolling(false);
    }
    return () => { ignore = true; };
    // eslint-disable-next-line
  }, [gameId]);

  // Start a new game
  const startGame = async () => {
    setCreating(true);
    setMoveError("");
    try {
      const resp = await authFetch(`${BACKEND}/games`, { method: "POST" });
      if (!resp.ok) throw new Error("Could not start game");
      const data = await resp.json();
      setGame(data);
      setPolling(true); // begin polling for state
    } catch (err) {
      setMoveError(
        err.message === "Failed to fetch"
          ? "Backend unavailable"
          : err.message
      );
    } finally {
      setCreating(false);
    }
  };

  // Poll game state
  const pollGame = useCallback(
    (gameId) => {
      if (!gameId) return;
      if (!polling) return;
      let interval = setInterval(async () => {
        try {
          const resp = await authFetch(`${BACKEND}/games/${gameId}`);
          if (resp.ok) {
            const data = await resp.json();
            setGame(data);
            // If finished, stop polling
            if (data.status === "FINISHED" || data.status === "WAITING_FOR_PLAYER") {
              setPolling(false);
            }
          }
        } catch {
          // suppress errors for polling
        }
      }, 1000);
      setPollIntervalId(interval);
      return () => clearInterval(interval);
    },
    [authFetch, BACKEND, polling]
  );

  // Start/stop polling
  useEffect(() => {
    if (!game || !polling) {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        setPollIntervalId(null);
      }
      return;
    }
    const cleanup = pollGame(game.id);
    return cleanup;
    // eslint-disable-next-line
  }, [game, polling]);

  // Cleanup interval on leave
  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [pollIntervalId]);

  // Make a move: {x, y}
  const handleSquareClick = async (x, y) => {
    if (!game || game.status !== "IN_PROGRESS") return;
    setMoveError("");
    // Check your turn
    const currTurnSymbol =
      game.move_history.length % 2 === 0 ? "X" : "O";
    const currUserSymbol =
      user?.id === game.player_x ? "X" : user?.id === game.player_o ? "O" : null;
    if (!currUserSymbol) return setMoveError("You are not a player in this game!");
    if (currTurnSymbol !== currUserSymbol)
      return setMoveError("Not your turn!");

    // If already filled, ignore
    if (game.board[x][y]) return;
    // Send move
    try {
      const resp = await authFetch(
        `${BACKEND}/games/${game.id}/move`,
        {
          method: "POST",
          body: JSON.stringify({ game_id: game.id, x, y }),
        }
      );
      if (!resp.ok) {
        const { detail } = await resp.json();
        setMoveError(detail || "Move failed");
        return;
      }
      const data = await resp.json();
      setGame(data);
      // If game finished (win/tie), stop polling
      if (data.status === "FINISHED") setPolling(false);
    } catch (err) {
      setMoveError("Move failed");
    }
  };

  // Join as 2nd player (if needed)
  const handleJoin = async () => {
    setMoveError("");
    try {
      const resp = await authFetch(`${BACKEND}/games/${game.id}/join`, { method: "POST" });
      if (!resp.ok) throw new Error("Failed to join as O");
      const data = await resp.json();
      setGame(data);
      setPolling(true);
    } catch (err) {
      setMoveError(err.message || "Join failed");
    }
  };

  // When user clicks "Leave Game", reset all state and notify parent
  const handleLeave = () => {
    setGame(null);
    setMoveError("");
    setPolling(false);
    if (typeof onLeaveGame === "function") {
      onLeaveGame();
    }
  };

  // UI
  return (
    <div className="game-container" style={{ marginTop: "2rem" }}>
      <h2>Tic Tac Toe Arena</h2>
      {/* Case: loading a game by gameId */}
      {loadingGame && (
        <div style={{margin:"1.5rem 0"}}><em>Loading game...</em></div>
      )}
      {!game && !gameId && !loadingGame ? (
        <button
          onClick={startGame}
          className="auth-button"
          disabled={creating}
        >
          {creating ? "Starting Game..." : "Start New Game"}
        </button>
      ) : null}
      {game ? (
        <>
          <Board board={game.board} onSquareClick={handleSquareClick} disabled={game.status !== "IN_PROGRESS"} />
          <div style={{ marginTop: 16 }}>
            <GameStatus game={game} user={user} onJoin={handleJoin} />
          </div>
          <button
            style={{marginTop: 16}}
            className="auth-button"
            onClick={handleLeave}
          >
            Leave Game
          </button>
        </>
      ) : null}
      {moveError && (
        <div style={{ color: "#f32828", fontWeight: 500, marginTop: 12 }}>
          {moveError}
        </div>
      )}
    </div>
  );
}


/**
 * GameStatus displays info below the board about turn, players, winner, or join prompt
 */
function GameStatus({ game, user, onJoin }) {
  if (!game) return null;

  // Player symbols
  const youAre =
    user?.id === game.player_x
      ? "X"
      : user?.id === game.player_o
        ? "O"
        : null;

  // If waiting for O and user not yet a player
  if (game.status === "WAITING_FOR_PLAYER" && youAre !== "O") {
    return (
      <div>
        Waiting for another player to join.<br />
        <button className="auth-button" onClick={onJoin}>
          Join as O
        </button>
      </div>
    );
  }

  if (game.status === "IN_PROGRESS") {
    const currTurn =
      game.move_history.length % 2 === 0 ? "X" : "O";
    const isYourTurn = currTurn === youAre;
    return (
      <div>
        {youAre
          ? (
            <span>
              You are <b>{youAre}</b>
              <br />
              {isYourTurn ? (
                <span style={{ color: "#43A047" }}>Your turn!</span>
              ) : (
                <span>Waiting for opponent...</span>
              )}
            </span>
          )
          : (
            <span>
              Spectating. (<b>{currTurn}</b>&apos;s turn)
            </span>
          )}
      </div>
    );
  }

  if (game.status === "FINISHED") {
    let winnerLabel;
    if (!game.winner) {
      winnerLabel = <span style={{ color: "#FFC107" }}>It&apos;s a tie!</span>;
    } else if (user?.id === game.winner) {
      winnerLabel = <span style={{ color: "#43A047" }}>You won! 🎉</span>;
    } else {
      winnerLabel = <span style={{ color: "#f32828" }}>You lost.</span>;
    }
    return (
      <div>
        <span style={{ fontWeight: 600 }}>
          Game Finished:
        </span>{" "}
        {winnerLabel}
      </div>
    );
  }

  return null;
}
