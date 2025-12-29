// ===== MESSAGE BAR V2 - REACT APP =====

import { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from './game/Game.js';
import { soundManager } from './game/SoundManager.js';
import { getSessionStatus, CONFIG } from './services/api.js';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover
  const [isMuted, setIsMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState({ served: 0, lost: 0, combo: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [session, setSession] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const game = new Game(canvas);
    gameRef.current = game;

    // Handle loading progress
    const loadingInterval = setInterval(() => {
      if (game.isReady) {
        setIsLoading(false);
        clearInterval(loadingInterval);
      } else {
        setLoadingProgress(prev => Math.min(prev + 10, 90));
      }
    }, 100);

    // Sync game state with React
    const stateInterval = setInterval(() => {
      if (game) {
        setGameState(game.state);
        setScore(game.score);
        setStats({
          served: game.customersServed,
          lost: game.customersLost,
          combo: game.comboCount,
        });
        setDemoMode(game.demoMode);
      }
    }, 100);

    return () => {
      clearInterval(loadingInterval);
      clearInterval(stateInterval);
      game.destroy();
    };
  }, []);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      soundManager.setMuted(newMuted);
      return newMuted;
    });
  }, []);

  // Handle start game
  const handleStart = useCallback(() => {
    if (gameRef.current) {
      soundManager.init();
      gameRef.current.start();
    }
  }, []);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.restart();
    }
  }, []);

  // Handle pause
  const handlePause = useCallback(() => {
    if (gameRef.current) {
      if (gameRef.current.state === 'playing') {
        gameRef.current.pause();
      } else if (gameRef.current.state === 'paused') {
        gameRef.current.resume();
      }
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handlePause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (gameState === 'menu') {
          handleStart();
        } else if (gameState === 'gameover') {
          handleRestart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleStart, handleRestart, handlePause, toggleMute]);

  // Poll WAHA session status
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSessionStatus();
        setSession(sessionData);

        // Update demo mode based on session status
        const isLive = sessionData?.status === 'WORKING';
        setDemoMode(!isLive);

        // Also update game's demo mode
        if (gameRef.current) {
          gameRef.current.demoMode = !isLive;
        }
      } catch (e) {
        console.error('Failed to fetch session:', e);
        setSession(null);
        setDemoMode(true);
      }
    };

    // Initial fetch
    fetchSession();

    // Poll every 5 seconds
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reconnect to WAHA
  const handleReconnect = useCallback(async () => {
    if (reconnecting) return; // Prevent double-clicks
    setReconnecting(true);

    try {
      // First stop the session (handles FAILED state)
      console.log('Stopping session...');
      await fetch(`${CONFIG.WAHA_URL}/api/sessions/${CONFIG.SESSION}/stop`, {
        method: 'POST',
        headers: { 'X-Api-Key': CONFIG.API_KEY },
      });

      // Wait a moment
      await new Promise(r => setTimeout(r, 1000));

      // Then start it
      console.log('Starting session...');
      const res = await fetch(`${CONFIG.WAHA_URL}/api/sessions/${CONFIG.SESSION}/start`, {
        method: 'POST',
        headers: { 'X-Api-Key': CONFIG.API_KEY },
      });

      if (res.ok) {
        console.log('Session started successfully!');
      } else {
        console.log('Start response:', res.status);
      }
    } catch (e) {
      console.error('Failed to reconnect:', e);
    }
    setReconnecting(false);
  }, [reconnecting]);

  return (
    <div className="game-container">
      {/* CRT Overlay Effect */}
      <div className="crt-overlay" />

      {/* Scanlines */}
      <div className="scanlines" />

      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="game-canvas"
      />

      {/* Loading Screen */}
      {isLoading && (
        <div className="loading-screen">
          <div className="loading-title">MESSAGE BAR</div>
          <div className="loading-bar">
            <div
              className="loading-fill"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="loading-text">LOADING ASSETS...</div>
        </div>
      )}

      {/* HUD Overlay */}
      {gameState === 'playing' && !isLoading && (
        <div className="hud">
          <div className="hud-left">
            <div className="score-display">
              <span className="label">SCORE</span>
              <span className="value">{score.toLocaleString()}</span>
            </div>
            {stats.combo > 1 && (
              <div className="combo-display">
                <span className="combo-value">{stats.combo}x</span>
                <span className="combo-label">COMBO</span>
              </div>
            )}
          </div>
          <div className="hud-right">
            <div className="stat-box served">
              <span className="icon">✓</span>
              <span className="count">{stats.served}</span>
            </div>
            <div className="stat-box lost">
              <span className="icon">✗</span>
              <span className="count">{stats.lost}</span>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="controls">
        <button
          className={`control-btn mute-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {gameState === 'playing' && (
          <button
            className="control-btn pause-btn"
            onClick={handlePause}
            title="Pause (ESC)"
          >
            ⏸
          </button>
        )}

        {gameState === 'paused' && (
          <button
            className="control-btn resume-btn"
            onClick={handlePause}
            title="Resume (ESC)"
          >
            ▶
          </button>
        )}
      </div>

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="pause-overlay">
          <div className="pause-content">
            <h2>PAUSED</h2>
            <p>Press ESC or click ▶ to resume</p>
            <div className="pause-stats">
              <div>Score: {score.toLocaleString()}</div>
              <div>Served: {stats.served} | Lost: {stats.lost}</div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Footer */}
      {gameState === 'menu' && !isLoading && (
        <div className="instructions">
          <p>
            <span className="key">1-5</span> Select bottle &nbsp;|&nbsp;
            <span className="key">CLICK</span> Serve customer &nbsp;|&nbsp;
            <span className="key">M</span> Mute &nbsp;|&nbsp;
            <span className="key">ESC</span> Pause
          </p>
        </div>
      )}

      {/* Minimal Connection Status - top left corner */}
      <div className={`connection-badge ${session?.status === 'WORKING' ? 'live' : 'demo'}`}>
        <span className="badge-dot" />
        <span className="badge-text">{session?.status === 'WORKING' ? 'LIVE' : 'DEMO'}</span>
        {session?.status !== 'WORKING' && (
          <button
            className="badge-reconnect"
            onClick={handleReconnect}
            disabled={reconnecting}
            title="Reconnect"
          >
            ↻
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
