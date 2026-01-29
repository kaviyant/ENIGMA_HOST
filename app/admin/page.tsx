'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminLoop } from '@/app/hooks/useAdminLoop';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [authorized, setAuthorized] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify({ username: 'admin', password })
        });
        const data = await res.json();
        if (data.success) {
            setAuthorized(true);
        } else {
            alert(data.message || 'Access Denied');
        }
    };

    if (!authorized) {
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
                        content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: radial-gradient(ellipse at center, rgba(0, 255, 102, 0.03) 0%, transparent 70%);
                        pointer-events: none; z-index: 0;
                    }
                    .login-body::after {
                        content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px);
                        pointer-events: none; z-index: 2; animation: scanlines 8s linear infinite;
                    }
                    @keyframes scanlines { 0% { transform: translateY(0); } 100% { transform: translateY(10px); } }
                    .container {
                        position: relative; z-index: 10; width: 90%; max-width: 600px;
                        animation: glitchIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    }
                    @keyframes glitchIn { 0% { opacity: 0; transform: translate(0, -20px); } 50% { opacity: 0.5; transform: translate(-2px, 0); } 100% { opacity: 1; transform: translate(0, 0); } }
                    .login-panel {
                        border: 4px solid #00ff66; padding: 50px; background: rgba(0, 0, 0, 0.95);
                        box-shadow: 0 0 30px rgba(0, 255, 102, 0.4), inset 0 0 30px rgba(0, 255, 102, 0.08);
                        position: relative; overflow: hidden;
                    }
                    .login-panel::before, .login-panel::after { content: ''; position: absolute; background: #00ff66; }
                    .login-panel::before { width: 30px; height: 3px; top: 15px; left: 15px; box-shadow: 0 0 15px #00ff66; }
                    .login-panel::after { width: 30px; height: 3px; bottom: 15px; right: 15px; box-shadow: 0 0 15px #00ff66; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #00ff66; padding-bottom: 30px; }
                    .title {
                        font-size: 48px; font-weight: 700; letter-spacing: 6px; margin-bottom: 10px;
                        text-transform: uppercase; text-shadow: 0 0 20px rgba(0, 255, 102, 0.8);
                        animation: titleGlow 2s ease-in-out infinite;
                    }
                    @keyframes titleGlow { 0%, 100% { text-shadow: 0 0 20px rgba(0, 255, 102, 0.8); } 50% { text-shadow: 0 0 30px rgba(0, 255, 102, 1); } }
                    .subtitle { font-size: 14px; letter-spacing: 3px; margin-bottom: 15px; opacity: 0.8; }
                    .form-group { margin-bottom: 30px; position: relative; }
                    .field-label { display: flex; align-items: center; font-size: 12px; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase; color: #00ff66; }
                    .field-label::before { content: ''; display: inline-block; width: 6px; height: 6px; background: #00ff66; margin-right: 8px; box-shadow: 0 0 8px #00ff66; }
                    .input-wrapper {
                        position: relative; border: 2px solid #00ff66;
                        background: rgba(0, 20, 10, 0.85); padding: 14px 18px;
                        box-shadow: inset 0 0 15px rgba(0, 255, 102, 0.12); transition: box-shadow 0.3s;
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
                        position: absolute; right: 15px; top: 50%; transform: translateY(-50%); pointer-events: none; opacity: 0;
                    }
                    .input-wrapper:focus-within .cursor { opacity: 1; }
                    @keyframes cursorBlink { 0%, 49%, 100% { opacity: 1; } 50%, 99% { opacity: 0; } }
                    .auth-button {
                        padding: 16px; border: 3px solid #00ff66; background: transparent; color: #00ff66;
                        font-family: 'Roboto Mono', monospace; font-size: 14px; font-weight: 700; width: 100%;
                        letter-spacing: 3px; text-transform: uppercase; cursor: pointer; position: relative;
                        overflow: hidden; transition: all 0.3s ease; text-shadow: 0 0 10px #00ff66; margin-top: 20px;
                    }
                    .auth-button:hover { box-shadow: 0 0 20px rgba(0, 255, 102, 0.6); text-shadow: 0 0 20px #00ff66; }
                    .auth-button::before {
                        content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
                        background: rgba(0, 255, 102, 0.1); transition: left 0.3s ease;
                    }
                    .auth-button:hover::before { left: 100%; }
                    .footer {
                        margin-top: 40px; display: flex; justify-content: space-between;
                        font-size: 11px; letter-spacing: 1px; border-top: 2px solid rgba(0, 255, 102, 0.5); padding-top: 25px;
                    }
                    .status-left, .status-right { display: flex; align-items: center; gap: 8px; }
                    .status-indicator { width: 8px; height: 8px; background: #00ff66; border-radius: 50%; box-shadow: 0 0 8px #00ff66; animation: pulse 2s ease-in-out infinite; }
                    @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 8px #00ff66; } 50% { opacity: 0.6; box-shadow: 0 0 15px #00ff66; } }
                `}</style>
                <div className="container">
                    <div className="login-panel">
                        <div className="header">
                            <div className="title">ENIGMA</div>
                            <div className="subtitle" style={{ marginTop: '15px' }}>ADMINISTRATION CONSOLE</div>
                        </div>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label className="field-label">{'>'} ENTER USERNAME</label>
                                <div className="input-wrapper">
                                    <input type="text" value={'admin'} readOnly style={{ cursor: 'not-allowed', opacity: 0.7 }} />
                                    <div className="cursor"></div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="field-label">{'>'} ENTER PASSWORD</label>
                                <div className="input-wrapper">
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="**************" required autoFocus />
                                    <div className="cursor"></div>
                                </div>
                            </div>
                            <button type="submit" className="auth-button">AUTHENTICATE</button>
                        </form>
                        <div className="footer">
                            <div className="status-left">
                                <div className="status-indicator"></div>
                                <span className="status-text opacity-70">SECURE UPLINK ACTIVE</span>
                            </div>
                            <div className="status-right">
                                <span className="status-text opacity-70">HOST: LOCAL</span>
                                <span className="text-[#00ff66] mx-2">|</span>
                                <span className="status-text opacity-70">ADMIN_MODE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return <Dashboard password={password} onLogout={() => { setAuthorized(false); setPassword(''); }} />;
}

function Dashboard({ password, onLogout }: { password: string, onLogout: () => void }) {
    const { dashboard, mutate } = useAdminLoop();
    const [settingsModal, setSettingsModal] = useState<'round1' | 'round2' | null>(null);
    const [viewLeaderboard, setViewLeaderboard] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Refs
    const q1Ref = useRef<HTMLTextAreaElement>(null);
    const q1AnsRef = useRef<HTMLTextAreaElement>(null);
    const q2Ref = useRef<HTMLTextAreaElement>(null);
    const q2AnsRef = useRef<HTMLTextAreaElement>(null);
    const q3Ref = useRef<HTMLTextAreaElement>(null);
    const q3AnsRef = useRef<HTMLTextAreaElement>(null);
    const timerRef = useRef<HTMLInputElement>(null);

    const r2q1ImgRef = useRef<HTMLInputElement>(null);
    const r2q1AnsRef = useRef<HTMLTextAreaElement>(null);
    const r2q2ImgRef = useRef<HTMLInputElement>(null);
    const r2q2AnsRef = useRef<HTMLTextAreaElement>(null);
    const r2q3ImgRef = useRef<HTMLInputElement>(null);
    const r2q3AnsRef = useRef<HTMLTextAreaElement>(null);
    const r2timerRef = useRef<HTMLInputElement>(null);

    const globalPassRef = useRef<HTMLInputElement>(null);
    const changeAdminPassRef = useRef<HTMLInputElement>(null);
    const broadcastMsgRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (!settingsModal) setConfigLoaded(false); }, [settingsModal]);

    // Load Config
    useEffect(() => {
        if (!dashboard?.config || configLoaded) return;
        if (settingsModal === 'round1' && dashboard.config.textRoundConfig) {
            const c = dashboard.config.textRoundConfig;
            if (q1Ref.current) q1Ref.current.value = c.q1 || '';
            if (q1AnsRef.current) q1AnsRef.current.value = c.q1Ans || '';
            if (q2Ref.current) q2Ref.current.value = c.q2 || '';
            if (q2AnsRef.current) q2AnsRef.current.value = c.q2Ans || '';
            if (q3Ref.current) q3Ref.current.value = c.q3 || '';
            if (q3AnsRef.current) q3AnsRef.current.value = c.q3Ans || '';
            if (timerRef.current) timerRef.current.value = c.timerDuration || 0;
            setConfigLoaded(true);
        }
        if (settingsModal === 'round2' && dashboard.config.imgRoundConfig) {
            const c = dashboard.config.imgRoundConfig;
            if (r2q1ImgRef.current) r2q1ImgRef.current.value = c.q1Img || '';
            if (r2q1AnsRef.current) r2q1AnsRef.current.value = c.q1Ans || '';
            if (r2q2ImgRef.current) r2q2ImgRef.current.value = c.q2Img || '';
            if (r2q2AnsRef.current) r2q2AnsRef.current.value = c.q2Ans || '';
            if (r2q3ImgRef.current) r2q3ImgRef.current.value = c.q3Img || '';
            if (r2q3AnsRef.current) r2q3AnsRef.current.value = c.q3Ans || '';
            if (r2timerRef.current) r2timerRef.current.value = c.timerDuration || 0;
            setConfigLoaded(true);
        }
    }, [dashboard, settingsModal, configLoaded]);

    const toggleRound = async (round: string) => {
        const current = dashboard?.config?.rounds?.[round] || false;
        await fetch('/api/admin/round/toggle', { method: 'POST', body: JSON.stringify({ round, state: !current, password }) });
        mutate();
    }

    const sendBroadcast = async () => {
        const message = broadcastMsgRef.current?.value;
        if (!message) return alert('Enter a message');
        if (!confirm('Broadcast this warning to ALL users?')) return;
        await fetch('/api/admin/users/warn', { method: 'POST', body: JSON.stringify({ message, password }) });
        alert('Broadcast Sent');
        if (broadcastMsgRef.current) broadcastMsgRef.current.value = '';
    }

    const saveTextConfig = async () => {
        await fetch('/api/admin/round/text', {
            method: 'POST',
            body: JSON.stringify({
                q1: q1Ref.current?.value, q1Ans: q1AnsRef.current?.value,
                q2: q2Ref.current?.value, q2Ans: q2AnsRef.current?.value,
                q3: q3Ref.current?.value, q3Ans: q3AnsRef.current?.value,
                timerDuration: Number(timerRef.current?.value), password
            })
        });
        mutate();
        setSettingsModal(null);
        alert('Saved Text Round');
    }

    const saveImgConfig = async () => {
        await fetch('/api/admin/round/image', {
            method: 'POST',
            body: JSON.stringify({
                q1Img: r2q1ImgRef.current?.value, q1Ans: r2q1AnsRef.current?.value,
                q2Img: r2q2ImgRef.current?.value, q2Ans: r2q2AnsRef.current?.value,
                q3Img: r2q3ImgRef.current?.value, q3Ans: r2q3AnsRef.current?.value,
                timerDuration: Number(r2timerRef.current?.value), password
            })
        });
        mutate();
        setSettingsModal(null);
        alert('Saved Image Round');
    }

    const updateGlobalPass = async () => {
        await fetch('/api/admin/config/password', { method: 'POST', body: JSON.stringify({ newPassword: globalPassRef.current?.value, authPassword: password }) });
        alert('Updated');
        if (globalPassRef.current) globalPassRef.current.value = '';
    }

    const updateAdminPass = async () => {
        const res = await fetch('/api/admin/change-password', { method: 'POST', body: JSON.stringify({ newPassword: changeAdminPassRef.current?.value, currentPassword: password }) });
        const d = await res.json();
        alert(d.message || (d.success ? 'Success' : 'Fail'));
        if (d.success && changeAdminPassRef.current) changeAdminPassRef.current.value = '';
    }

    const actionUser = async (action: string, username: string) => {
        await fetch(`/api/admin/users/${action}`, { method: 'POST', body: JSON.stringify({ username, password }) });
        mutate();
    }

    const rounds = dashboard?.config?.rounds || {};
    const clients = dashboard?.clients || [];
    const onlineClients = clients.filter((c: any) => c.isOnline);

    return (
        <div className="app-container">
            {settingsModal === 'round1' && (
                <div className="modal-overlay">
                    <div className="panel" style={{ width: '800px', maxWidth: '90%', maxHeight: '90vh' }}>
                        <div className="panel-header">
                            <span>ROUND 1 CONFIG [TEXT]</span>
                            <button onClick={() => setSettingsModal(null)} className="toggle-btn">CLOSE</button>
                        </div>
                        <div className="panel-content flex flex-col gap-6 font-mono text-sm">
                            <div><label className="text-[#00ff66]">Q1:</label><textarea ref={q1Ref} className="col-input" rows={2} /><label className="text-[#00ff66]">ANS1:</label><textarea ref={q1AnsRef} className="col-input" rows={1} /></div>
                            <div><label className="text-[#00ff66]">Q2:</label><textarea ref={q2Ref} className="col-input" rows={2} /><label className="text-[#00ff66]">ANS2:</label><textarea ref={q2AnsRef} className="col-input" rows={1} /></div>
                            <div><label className="text-[#00ff66]">Q3:</label><textarea ref={q3Ref} className="col-input" rows={2} /><label className="text-[#00ff66]">ANS3:</label><textarea ref={q3AnsRef} className="col-input" rows={1} /></div>
                            <div><label className="text-[#00ff66]">TIMER (MIN):</label><input ref={timerRef} type="number" className="col-input" /></div>
                            <button onClick={saveTextConfig} className="toggle-btn">UPLOAD CONFIGURATION</button>
                        </div>
                    </div>
                </div>
            )}
            {settingsModal === 'round2' && (
                <div className="modal-overlay">
                    <div className="panel" style={{ width: '800px', maxWidth: '90%', maxHeight: '90vh' }}>
                        <div className="panel-header">
                            <span>ROUND 2 CONFIG [IMAGE]</span>
                            <button onClick={() => setSettingsModal(null)} className="toggle-btn">CLOSE</button>
                        </div>
                        <div className="panel-content flex flex-col gap-6 font-mono text-sm">
                            <div><label className="text-[#00ff66]">IMG1 URL:</label><input ref={r2q1ImgRef} className="col-input" /><label className="text-[#00ff66]">ANS1:</label><textarea ref={r2q1AnsRef} className="col-input" rows={1} /></div>
                            <div><label className="text-[#00ff66]">IMG2 URL:</label><input ref={r2q2ImgRef} className="col-input" /><label className="text-[#00ff66]">ANS2:</label><textarea ref={r2q2AnsRef} className="col-input" rows={1} /></div>
                            <div><label className="text-[#00ff66]">IMG3 URL:</label><input ref={r2q3ImgRef} className="col-input" /><label className="text-[#00ff66]">ANS3:</label><textarea ref={r2q3AnsRef} className="col-input" rows={1} /></div>
                            <div><label className="text-[#00ff66]">TIMER (MIN):</label><input ref={r2timerRef} type="number" className="col-input" /></div>
                            <button onClick={saveImgConfig} className="toggle-btn">UPLOAD CONFIGURATION</button>
                        </div>
                    </div>
                </div>
            )}
            {viewLeaderboard && (
                <div className="modal-overlay">
                    <div className="panel" style={{ width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="panel-header">
                            <span className="text-xl">LIVE LEADERBOARD [FULL_SCREEN]</span>
                            <button onClick={() => setViewLeaderboard(false)} className="toggle-btn">CLOSE_VIEW</button>
                        </div>
                        <div className="panel-content custom-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
                            <div className="leaderboard-row text-[#00ff66] text-lg flex justify-between border-b border-[#003300] py-4 font-bold">
                                <span style={{ flex: 0.5 }}>#</span>
                                <span style={{ flex: 2 }}>USERNAME</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R1 SUB</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R1 SCORE</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R2 SUB</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R2 SCORE</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>TOTAL</span>
                                <span style={{ flex: 0.5, textAlign: 'center' }}>ACT</span>
                            </div>
                            {dashboard?.leaderboard?.map((l: any, i: number) => {
                                const hasR1Submission = l.answers && Object.keys(l.answers).length > 0;
                                const hasR2Submission = l.imgAnswers && Object.keys(l.imgAnswers).length > 0;
                                return (
                                    <div key={i} className="leaderboard-row text-[#00ff66] text-lg flex justify-between border-b border-[#003300] py-3 items-center hover:bg-[#001100]">
                                        <span style={{ flex: 0.5 }}>{i + 1}</span>
                                        <span style={{ flex: 2 }}>{l.username}</span>
                                        <span style={{ flex: 1, textAlign: 'center' }}>{hasR1Submission ? '✓' : '—'}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#00aaff' }}>{l.scores?.round1 || 0}</span>
                                        <span style={{ flex: 1, textAlign: 'center' }}>{hasR2Submission ? '✓' : '—'}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#ff00ff' }}>{l.scores?.round2 || 0}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#ffff00', fontWeight: 'bold' }}>{l.totalScore || 0}</span>
                                        <span style={{ flex: 0.5, textAlign: 'center' }}>
                                            <button className="text-red-500 hover:text-red-300 font-bold" onClick={() => { if (confirm('DELETE USER ' + l.username + '?')) actionUser('delete', l.username) }}>X</button>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="header">
                <div className="header-left">
                    <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        ☰
                    </button>
                    <div className="logo">ENIGMA ADMIN</div>
                </div>
                <div className="header-right">
                    <div className="flex flex-col items-end">
                        <span className="text-[#00ff66] font-bold text-lg">{dashboard?.connectedCount || 0} UPLINKS ACTIVE</span>
                        <span className="text-xs opacity-50 text-[#00ff66]">SECURE CONNECTION ESTABLISHED</span>
                    </div>
                    <button onClick={() => setViewLeaderboard(true)} className="toggle-btn" style={{ borderColor: '#00ccff', color: '#00ccff', marginRight: '10px' }}>VIEW LEADERBOARD</button>
                    <button onClick={onLogout} className="toggle-btn" style={{ borderColor: '#ff3333', color: '#ff3333' }}>DISCONNECT</button>
                </div>
            </div>

            <div className="admin-container">
                <div className="main-col">
                    <div className="panel">
                        <div className="panel-header">ROUND CONTROL</div>
                        <div className="panel-content">
                            <div className="switch-group">
                                {['lobby', 'round1', 'round2'].map(r => (
                                    <div key={r} className={`switch-card ${rounds[r] ? 'active' : ''}`}>
                                        {r !== 'lobby' && <button className="settings-btn" onClick={() => setSettingsModal(r as any)}>⚙</button>}
                                        <h3>{r === 'round1' ? 'ROUND 1 (TEXT)' : r === 'round2' ? 'ROUND 2 (IMG)' : 'LOBBY'}</h3>
                                        <div className="mb-4 font-bold text-xl">{rounds[r] ? 'ONLINE' : 'OFFLINE'}</div>
                                        <button className="toggle-btn" onClick={() => toggleRound(r)}>{rounds[r] ? 'TERMINATE' : 'INITIALIZE'}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-header">LIVE MONITORING</div>
                        <div className="panel-content custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {onlineClients.length === 0 && <div className="p-4 text-center opacity-50">NO ACTIVE SIGNALS</div>}
                            {onlineClients.map((c: any) => (
                                <div key={c._id} className="user-row hover:bg-[#002200] p-3 border-b border-[#003300] flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${c.isOnline ? 'bg-[#00ff66]' : 'bg-[#500]'}`}></span>
                                        <span className="font-bold text-[#00ff66]">{c.username}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn-warn px-3 py-1 text-xs" onClick={() => actionUser('warn', c.username)}>WARN</button>
                                        <button className="btn-kick px-3 py-1 text-xs" onClick={() => actionUser('kick', c.username)}>KICK</button>
                                        <button className="btn-reset px-3 py-1 text-xs" onClick={() => actionUser('reset', c.username)}>RESET</button>
                                        <button className="btn-delete px-3 py-1 text-xs" onClick={() => { if (confirm('DELETE USER PERMANENTLY?')) actionUser('delete', c.username) }}>DEL</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`side-col ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="panel" style={{ flex: '0 0 auto' }}>
                        <div className="panel-header">BROADCAST SYSTEM</div>
                        <div className="panel-content">
                            <div className="flex gap-2">
                                <input ref={broadcastMsgRef} type="text" className="col-input" placeholder="SYSTEM WARNING MESSAGE" />
                                <button onClick={sendBroadcast} className="btn-warn" style={{ whiteSpace: 'nowrap' }}>WARN ALL</button>
                            </div>
                            <div className="text-xs opacity-50 mt-2">* Updates client scrolling marquee immediately.</div>
                        </div>
                    </div>

                    <div className="panel" style={{ flex: '0 0 auto' }}>
                        <div className="panel-header">COMPETITION SETTINGS</div>
                        <div className="flex gap-2">
                            <input ref={globalPassRef} type="text" className="col-input" placeholder="NEW PASSWORD" />
                            <button onClick={updateGlobalPass} className="toggle-btn">UPDATE</button>
                        </div>
                    </div>
                    <div className="panel" style={{ flex: '0 0 auto' }}>
                        <div className="panel-header">ADMIN SECURITY</div>
                        <div className="panel-content">
                            <div className="flex flex-col gap-3">
                                <input ref={changeAdminPassRef} type="password" className="col-input" placeholder="NEW ADMIN PASSWORD" />
                                <button onClick={updateAdminPass} className="toggle-btn">UPDATE PASSWORD</button>
                            </div>
                        </div>
                    </div>
                    <div className="panel" style={{ flex: 1, minHeight: 0 }}>
                        <div className="panel-header">
                            LEADERBOARD <span style={{ fontSize: '0.8em', opacity: 0.7 }}>[{dashboard?.leaderboard?.length || 0}]</span>
                        </div>
                        <div className="panel-content custom-scrollbar" style={{ overflowY: 'auto' }}>
                            <div className="leaderboard-row text-[#00ff66] text-sm flex justify-between border-b border-[#003300] py-2 font-bold">
                                <span style={{ flex: 0.5 }}>#</span>
                                <span style={{ flex: 2 }}>USERNAME</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R1 SUB</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R1</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R2 SUB</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>R2</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>TOTAL</span>
                                <span style={{ flex: 0.5, textAlign: 'center' }}>ACT</span>
                            </div>
                            {dashboard?.leaderboard?.map((l: any, i: number) => {
                                const hasR1Submission = l.answers && Object.keys(l.answers).length > 0;
                                const hasR2Submission = l.imgAnswers && Object.keys(l.imgAnswers).length > 0;
                                return (
                                    <div key={i} className="leaderboard-row text-[#00ff66] text-sm flex justify-between border-b border-[#003300] py-1 items-center">
                                        <span style={{ flex: 0.5 }}>{i + 1}</span>
                                        <span style={{ flex: 2 }}>{l.username}</span>
                                        <span style={{ flex: 1, textAlign: 'center' }}>{hasR1Submission ? '✓' : '—'}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#00aaff' }}>{l.scores?.round1 || 0}</span>
                                        <span style={{ flex: 1, textAlign: 'center' }}>{hasR2Submission ? '✓' : '—'}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#ff00ff' }}>{l.scores?.round2 || 0}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#ffff00', fontWeight: 'bold' }}>{l.totalScore || 0}</span>
                                        <span style={{ flex: 0.5, textAlign: 'center' }}>
                                            <button className="text-red-500 hover:text-red-300 font-bold" onClick={() => { if (confirm('DELETE USER ' + l.username + '?')) actionUser('delete', l.username) }}>X</button>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
