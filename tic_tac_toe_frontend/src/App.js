import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import Register from "./Register";
import GameContainer from "./GameContainer";

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

  return (
    <div>
      <p>
        Welcome <strong>{user && user.username}</strong>!
      </p>
      <button className="auth-button" onClick={logout}>
        Logout
      </button>
      <p>
        Current theme: <strong>{theme}</strong>
      </p>
      <GameContainer />
    </div>
  );
}

export default App;
