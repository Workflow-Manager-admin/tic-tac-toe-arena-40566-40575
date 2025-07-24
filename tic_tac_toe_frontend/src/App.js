import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import Register from "./Register";
import GameContainer from "./GameContainer";
import Lobby from "./Lobby";
import Scoreboard from "./Scoreboard";
import GameHistory from "./GameHistory";

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Render authentication overlays using a child component within context
  return (
    <AuthProvider>
      <div className="App">
        <header className="App-header">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <img src={logo} className="App-logo" alt="logo" />
          <MainContent theme={theme} />
        </header>
      </div>
    </AuthProvider>
  );
}

// PUBLIC_INTERFACE
function MainContent({ theme }) {
  /**
   * Handle switching between login/register, displaying user info, and logout.
   */
  const { isAuthenticated, user, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Open/close a game via gameId (null = not currently playing)
  const [openGameId, setOpenGameId] = useState(null);

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onSuccess={() => setShowRegister(false)}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      );
    } else {
      return (
        <Login
          onSuccess={() => {}}   // do nothing, just re-render
          onSwitchToRegister={() => setShowRegister(true)}
        />
      );
    }
  }

  // Show the main dashboard when authenticated
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "80vh",
        margin: "0 auto",
        maxWidth: 520,
        padding: 8,
      }}
    >
      <div style={{ width: "100%", textAlign: "center" }}>
        <p>
          Welcome <strong>{user && user.username}</strong>!
        </p>
        <button className="auth-button" onClick={logout}>
          Logout
        </button>
        <p style={{ marginBottom: 12, marginTop: 6 }}>
          Current theme: <strong>{theme}</strong>
        </p>
        <Scoreboard />
        {!openGameId ? (
          <>
            <Lobby onOpenGame={setOpenGameId} />
            <div style={{ marginTop: 8 }}>
              <button
                className="auth-button"
                onClick={() => setOpenGameId("NEW")}
                style={{
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  width: "90%",
                  maxWidth: 330,
                }}
              >
                Start New Game
              </button>
            </div>
            <GameHistory />
          </>
        ) : (
          <GameContainer
            gameId={openGameId === "NEW" ? null : openGameId}
            onLeaveGame={() => setOpenGameId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
