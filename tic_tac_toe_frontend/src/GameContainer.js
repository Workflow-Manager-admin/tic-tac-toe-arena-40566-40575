import React, { useState, useEffect, useCallback } from "react";
import Board from "./Board";
import { useAuth } from "./AuthContext";
import { apiFetch, pollApi } from "./api";

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

  // On load: if gameId prop is provided, load that game.
  useEffect(() => {
    let ignore = false;
    if (gameId && (!game || game.id !== gameId)) {
      setLoadingGame(true);
      apiFetch(`/games/${gameId}`, { token })
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
      const data = await apiFetch(`/games`, { method: "POST", token });
      setGame(data);
      setPolling(true);
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
      if (!gameId || !polling) return;
      // Use abort signal to clean up
      const ctrl = new AbortController();
      const stop = pollApi(
        async () => {
          try {
            const data = await apiFetch(`/games/${gameId}`, { token });
            setGame(data);
            if (data.status === "FINISHED" || data.status === "WAITING_FOR_PLAYER") {
              setPolling(false);
              return data;
            }
            return data;
          } catch (err) {
            // Could rethrow or simply continue polling
            return null;
          }
        },
        {
          interval: 1300,
          stopIf: (result) =>
            result && (result.status === "FINISHED" || result.status === "WAITING_FOR_PLAYER"),
          signal: ctrl.signal,
        }
      );
      setPollIntervalId({ stop, ctrl });
      return () => stop && stop();
    },
    [token, polling]
  );

  // Start/stop polling
  useEffect(() => {
    if (!game || !polling) {
      if (pollIntervalId) {
        pollIntervalId.stop();
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
    const currTurnSymbol =
      game.move_history.length % 2 === 0 ? "X" : "O";
    const currUserSymbol =
      user?.id === game.player_x ? "X" : user?.id === game.player_o ? "O" : null;
    if (!currUserSymbol) return setMoveError("You are not a player in this game!");
    if (currTurnSymbol !== currUserSymbol)
      return setMoveError("Not your turn!");
    if (game.board[x][y]) return;
    try {
      // Use unified apiFetch, handles errors
      const data = await apiFetch(
        `/games/${game.id}/move`,
        {
          method: "POST",
          token,
          body: { game_id: game.id, x, y },
        }
      );
      setGame(data);
      if (data.status === "FINISHED") setPolling(false);
    } catch (err) {
      setMoveError(String(err?.message || "Move failed"));
    }
  };

  // Join as 2nd player (if needed)
  const handleJoin = async () => {
    setMoveError("");
    try {
      const data = await apiFetch(`/games/${game.id}/join`, { method: "POST", token });
      setGame(data);
      setPolling(true);
    } catch (err) {
      setMoveError(String(err?.message || "Join failed"));
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
