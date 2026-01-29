'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState<{ text: string, type: 'success' | 'warning' | 'error' }[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || isAuthenticating) return;

    setIsAuthenticating(true);
    setAuthSuccess(false);
    setLogs([]); // Clear previous logs

    // Simulate "Verifying credentials..." delay
    setLogs([{ text: '> Verifying credentials...', type: 'warning' }]);

    try {
      // Real Auth
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      // Artificial delay for effect (800ms)
      await new Promise(r => setTimeout(r, 800));

      if (data.success) {
        setLogs(prev => [
          ...prev,
          { text: '> Access granted', type: 'success' },
          { text: '> Initializing session...', type: 'success' }
        ]);

        setAuthSuccess(true);
        localStorage.setItem('enigma_user', username);

        // Final success message and redirect
        setTimeout(() => {
          setLogs(prev => [...prev, { text: '> Session established successfully', type: 'success' }]);
          setTimeout(() => {
            router.push('/game');
          }, 1500);
        }, 800);

      } else {
        setLogs(prev => [
          ...prev,
          { text: `> Access denied - ${data.message || 'Invalid credentials'}`, type: 'error' }
        ]);
        setIsAuthenticating(false);
        // Shake effect logic here via class
        const form = document.querySelector('.login-panel');
        if (form) {
          form.classList.add('glitch');
          setTimeout(() => form.classList.remove('glitch'), 500);
        }
      }

    } catch (error) {
      setLogs(prev => [
        ...prev,
        { text: '> CRITICAL ERROR: CONNECTION FAILED', type: 'error' }
      ]);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="login-body">
      <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');

                .login-body {
                    font-family: 'Roboto Mono', monospace;
                    background: #000000;
                    color: #00ff66;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                }

                .login-body::before {
                    content: '';
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(ellipse at center, rgba(0, 255, 102, 0.03) 0%, transparent 70%);
                    pointer-events: none; z-index: 0;
                }

                .login-body::after {
                    content: '';
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px);
                    pointer-events: none; z-index: 2;
                    animation: scanlines 8s linear infinite;
                }

                @keyframes scanlines {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(10px); }
                }

                .container {
                    position: relative; z-index: 10; width: 90%; max-width: 600px;
                    animation: glitchIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                @keyframes glitchIn {
                    0% { opacity: 0; transform: translate(0, -20px); }
                    50% { opacity: 0.5; transform: translate(-2px, 0); }
                    100% { opacity: 1; transform: translate(0, 0); }
                }

                .login-panel {
                    border: 4px solid #00ff66; padding: 50px; background: rgba(0, 0, 0, 0.95);
                    box-shadow: 0 0 30px rgba(0, 255, 102, 0.4), inset 0 0 30px rgba(0, 255, 102, 0.08);
                    position: relative; overflow: hidden;
                }

                .login-panel::before, .login-panel::after {
                    content: ''; position: absolute; background: #00ff66;
                }
                .login-panel::before { width: 30px; height: 3px; top: 15px; left: 15px; box-shadow: 0 0 15px #00ff66; }
                .login-panel::after { width: 30px; height: 3px; bottom: 15px; right: 15px; box-shadow: 0 0 15px #00ff66; }

                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #00ff66; padding-bottom: 30px; }
                .title {
                    font-size: 48px; font-weight: 700; letter-spacing: 6px; margin-bottom: 10px;
                    text-transform: uppercase; text-shadow: 0 0 20px rgba(0, 255, 102, 0.8);
                    animation: titleGlow 2s ease-in-out infinite;
                }
                @keyframes titleGlow {
                    0%, 100% { text-shadow: 0 0 20px rgba(0, 255, 102, 0.8); }
                    50% { text-shadow: 0 0 30px rgba(0, 255, 102, 1); }
                }

                .subtitle { font-size: 14px; letter-spacing: 3px; margin-top: 15px; margin-bottom: 15px; opacity: 0.8; }
                .system-status { font-size: 12px; color: #ff6600; letter-spacing: 2px; animation: blink 1.5s infinite; }
                @keyframes blink { 0%, 49%, 100% { opacity: 1; } 50%, 99% { opacity: 0.5; } }

                .form-group { margin-bottom: 30px; position: relative; }
                .field-label { display: flex; align-items: center; font-size: 12px; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase; color: #00ff66; }
                .field-label::before { content: ''; display: inline-block; width: 6px; height: 6px; background: #00ff66; margin-right: 8px; box-shadow: 0 0 8px #00ff66; }

                .input-wrapper {
                    position: relative; border: 2px solid #00ff66;
                    background: rgba(0, 20, 10, 0.85); padding: 14px 18px;
                    box-shadow: inset 0 0 15px rgba(0, 255, 102, 0.12);
                    transition: box-shadow 0.3s;
                }
                .input-wrapper:focus-within { box-shadow: inset 0 0 20px rgba(0, 255, 102, 0.2), 0 0 30px rgba(0, 255, 102, 0.4); }

                input {
                    width: 100%; background: transparent; border: none; color: #00ff66;
                    font-family: 'Roboto Mono', monospace; font-size: 14px; letter-spacing: 1px;
                    outline: none; caret-color: #00ff66;
                }
                input::placeholder { color: rgba(0, 255, 102, 0.4); }
                
                .cursor {
                    display: inline-block; width: 10px; height: 16px; background: #00ff66;
                    margin-left: 4px; animation: cursorBlink 1s infinite;
                    position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
                    pointer-events: none; opacity: 0;
                }
                .input-wrapper:focus-within .cursor { opacity: 1; }
                @keyframes cursorBlink { 0%, 49%, 100% { opacity: 1; } 50%, 99% { opacity: 0; } }

                .button-group { margin-top: 35px; display: flex; flex-direction: column; gap: 15px; }

                .auth-button {
                    padding: 16px; border: 3px solid #00ff66; background: transparent; color: #00ff66;
                    font-family: 'Roboto Mono', monospace; font-size: 14px; font-weight: 700;
                    letter-spacing: 3px; text-transform: uppercase; cursor: pointer; position: relative;
                    overflow: hidden; transition: all 0.3s ease; text-shadow: 0 0 10px #00ff66;
                }
                .auth-button:hover:not(:disabled) {
                    box-shadow: 0 0 20px rgba(0, 255, 102, 0.6); text-shadow: 0 0 20px #00ff66;
                }
                .auth-button:hover:not(:disabled)::before { left: 100%; }
                .auth-button::before {
                    content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
                    background: rgba(0, 255, 102, 0.1); transition: left 0.3s ease;
                }
                .auth-button:disabled { opacity: 0.7; cursor: not-allowed; }

                .terminal-output {
                    margin-top: 20px; min-height: 30px; font-size: 11px; letter-spacing: 1px;
                    color: #00ff66; opacity: 1;
                }

                .log-line { margin-bottom: 5px; animation: typeWriter 0.3s forwards; opacity: 0; }
                @keyframes typeWriter { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

                .log-success { color: #00ff66; }
                .log-error { color: #ff3333; }
                .log-warning { color: #ff6600; }

                .footer {
                    margin-top: 40px; display: flex; justify-content: space-between;
                    font-size: 11px; letter-spacing: 1px; border-top: 2px solid rgba(0, 255, 102, 0.5);
                    padding-top: 25px;
                }

                .status-left, .status-right { display: flex; align-items: center; gap: 8px; }
                .status-indicator {
                    width: 8px; height: 8px; background: #00ff66; border-radius: 50%;
                    box-shadow: 0 0 8px #00ff66; animation: pulse 2s ease-in-out infinite;
                }
                @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 8px #00ff66; } 50% { opacity: 0.6; box-shadow: 0 0 15px #00ff66; } }
                .divider { color: rgba(0, 255, 102, 0.4); margin: 0 8px; }

                @media (max-width: 600px) {
                    .login-panel { padding: 30px 20px; }
                    .title { font-size: 36px; }
                    .footer { flex-direction: column; gap: 12px; }
                }

                .glitch { animation: glitch 0.2s ease-in-out; }
                @keyframes glitch {
                    0%, 100% { transform: translate(0); }
                    25% { transform: translate(-2px, 2px); }
                    50% { transform: translate(2px, -2px); }
                    75% { transform: translate(-2px, -2px); }
                }
            `}</style>

      <div className="container">
        <div className="login-panel">
          <div className="header">
            <div className="title">ENIGMA</div>
            <div className="subtitle">USER ACCESS TERMINAL</div>

          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="field-label">{'>'} ENTER USERNAME</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="participant_id"
                  required
                  disabled={isAuthenticating}
                />
                <div className="cursor"></div>
              </div>
            </div>

            <div className="form-group">
              <label className="field-label">{'>'} ENTER COMPETITION ACCESS KEY</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="provided_by_organizers"
                  required
                  disabled={isAuthenticating}
                />
                <div className="cursor"></div>
              </div>
            </div>

            <div id="terminalOutput" className="terminal-output">
              {logs.map((log, i) => (
                <div key={i} className="log-line">
                  <span className={`log-${log.type}`}>{log.text}</span>
                </div>
              ))}
            </div>

            <div className="button-group">
              <button type="submit" className="auth-button" disabled={isAuthenticating}>
                {authSuccess ? '✓ AUTHENTICATED' : 'AUTHENTICATE'}
              </button>
            </div>
          </form>

          <div className="footer">
            <div className="status-left">
              <div className="status-indicator"></div>
              <span className="status-text">SECURE CONNECTION ESTABLISHED</span>
            </div>
            <div className="status-right">
              <span className="status-text">SESSION: GUEST</span>
              <span className="divider">|</span>
              <span className="status-text">EVENT: ENIGMA</span>
              <span className="divider">|</span>
              <span className="status-text">ENCRYPTION: AES-256</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
