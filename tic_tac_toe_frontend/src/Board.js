import React from "react";

/**
 * Board component renders the tic tac toe grid and delegates square clicks.
 * Receives board state as a 2D array.
 */

// PUBLIC_INTERFACE
export default function Board({ board, onSquareClick, disabled }) {
  // returns a component for one cell
  function renderSquare(x, y) {
    return (
      <Square
        value={board?.[x]?.[y]}
        onClick={() => !disabled && onSquareClick(x, y)}
        key={`sq-${x}-${y}`}
        disabled={disabled || Boolean(board?.[x]?.[y])}
      />
    );
  }

  return (
    <div style={{
      display: "inline-block",
      background: "var(--bg-secondary)",
      padding: 24,
      borderRadius: 14,
      boxShadow: "0 4px 16px rgba(30,136,229,0.05)",
      margin: "0 auto",
    }}>
      <div
        style={{
          display: "grid",
          gridTemplateRows: "repeat(3, 68px)",
          gridTemplateColumns: "repeat(3, 68px)",
          gap: 3
        }}>
        {[0, 1, 2].map((x) =>
          [0, 1, 2].map((y) => renderSquare(x, y))
        )}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * PUBLIC_INTERFACE
 * Square displays a single tic tac toe square. For future direct imports.
 */
export function Square({ value, onClick, disabled }) {
  // Determines display and color style for each square
  let text = value || "";
  let color = "#1E88E5";
  if (text === "X") color = "#E87A41";
  if (text === "O") color = "#43A047";
  return (
    <button
      className="ttt-square"
      style={{
        width: 68,
        height: 68,
        fontSize: "2.2rem",
        background: disabled ? "#e9ecef" : "var(--bg-primary)",
        border: `2.5px solid var(--border-color)`,
        borderRadius: 10,
        cursor: disabled ? "default" : "pointer",
        color,
        fontWeight: 700,
        boxShadow: disabled ? undefined : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "background .2s, box-shadow .2s"
      }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-label={
        value
          ? `Square already filled with ${value}`
          : "Empty square: click to mark"
      }
    >
      {text}
    </button>
  );
}

export { Board };
