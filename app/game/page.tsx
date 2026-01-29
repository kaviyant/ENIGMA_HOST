'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLoop } from '@/app/hooks/useGameLoop';

export default function GamePage() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const user = localStorage.getItem('enigma_user');
        if (!user) {
            router.push('/');
        } else {
            setUsername(user);
        }
    }, [router]);

    const { gameState, isLoading } = useGameLoop(username);

    // Check if user was kicked
    useEffect(() => {
        if (gameState?.kicked) {
            localStorage.removeItem('enigma_user');
            alert('You have been kicked by an administrator');
            router.push('/');
        }
    }, [gameState, router]);

    if (!username || isLoading) return <div className="h-screen flex items-center justify-center text-2xl animate-pulse">ESTABLISHING UPLINK...</div>;

    if (gameState?.warning) {
        // Force overlay warning
    }

    const rounds = gameState?.rounds || {};

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-black text-[#00ff66] font-mono">
            {/* Background Effects */}
            {rounds.round1 && <div className="matrix-bg"></div>}

            {rounds.round2 && (
                <>
                    <div className="grid-bg"></div>
                    <div className="vignette"></div>
                </>
            )}

            <div className="scanlines"></div>
            {rounds.round1 && <div className="crt-flicker"></div>} {/* Flicker usually more for text terminals, but keeping consistent */}

            {/* HEADER (Only show if NOT in Round 1 or Round 2 since they have custom headers now) */}
            {!rounds.round1 && !rounds.round2 && (
                <header className="w-full flex justify-between items-center border-b border-[#00ff66] p-4 z-50 bg-[rgba(0,15,0,0.9)] shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-widest text-[#00ff66] drop-shadow-[0_0_5px_#00ff66]">ENIGMA_NET</h1>
                        <span className="text-xs text-[#00aa44]">ID: {username}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-[#00aa44]">STATUS</div>
                        <div className="font-bold text-lg animate-pulse text-[#00ff66]">ONLINE</div>
                    </div>
                </header>
            )}

            {/* CONTENT AREA */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 z-10 flex flex-col">
                {gameState?.warning && (
                    <div className="mb-6 p-4 border border-red-500 bg-red-900/20 text-red-500 animate-pulse text-center font-bold text-lg">
                        ⚠ WARNING: {gameState.warning.message}
                    </div>
                )}

                {rounds.lobby && <LobbyView />}
                {rounds.round1 && <TextRoundView config={gameState.textConfig} username={username} endTime={gameState.timers?.round1EndTime} />}
                {rounds.round2 && <ImageRoundView config={gameState.imgConfig} username={username} endTime={gameState.timers?.round2EndTime} />}

                {!rounds.lobby && !rounds.round1 && !rounds.round2 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80">
                        <div className="w-24 h-24 border-4 border-[#00ff66] rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_#00ff66] animate-pulse">
                            <div className="w-16 h-16 bg-[#00ff66] rounded-full opacity-20 animate-ping"></div>
                        </div>
                        <h2 className="text-5xl mb-4 font-bold tracking-[0.2em] text-[#00ff66] drop-shadow-[0_0_10px_#00ff66]">AWAITING SIGNAL</h2>
                        <p className="text-[#00ff66] tracking-widest text-sm uppercase">Secure uplink established. Stand by for command.</p>
                        <div className="mt-8 flex gap-2">
                            <div className="w-2 h-2 bg-[#00ff66] animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-[#00ff66] animate-bounce delay-150"></div>
                            <div className="w-2 h-2 bg-[#00ff66] animate-bounce delay-300"></div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function LobbyView() {
    const [time, setTime] = useState('00:00:00 UTC');

    useEffect(() => {
        // Clock
        const interval = setInterval(() => {
            setTime(new Date().toISOString().split('T')[1].split('.')[0] + ' UTC');
        }, 1000);


        // Prevent Unload
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Particles & Boot Sequence
        const pc = document.getElementById('particles');
        const out = document.getElementById('console-output');
        const lb = document.getElementById('boot-loader');
        const bar = document.getElementById('boot-bar');
        const logo = document.getElementById('enigma-logo');
        const status = document.getElementById('final-status');

        // Particles
        if (pc && pc.childElementCount === 0) {
            for (let i = 0; i < 50; i++) {
                let p = document.createElement('div');
                p.className = 'particle';
                p.style.left = Math.random() * 100 + '%';
                p.style.animationDuration = (Math.random() * 3 + 2) + 's';
                p.style.animationDelay = (Math.random() * 5) + 's';
                pc.appendChild(p);
            }
        }

        // Boot Sequence
        const msgs = ["Booting ENIGMA Event Core...", "Loading team environments...", "Initializing challenge modules...", "Syncing Imagers Assets...", "Establishing secure connection...", "Done."];
        let idx = 0;

        function type(txt: string, cb: () => void) {
            if (!out) return;
            let l = document.createElement('div');
            l.className = 'log-line';
            l.innerHTML = `<span class="log-prefix">></span><span></span>`;
            out.appendChild(l);
            let sp = l.lastChild as HTMLElement;
            let c = 0;
            let int = setInterval(() => {
                if (sp) sp.textContent += txt.charAt(c++);
                if (c >= txt.length) {
                    clearInterval(int);
                    if (cb) setTimeout(cb, 300);
                }
            }, 30);
        }

        function run() {
            if (!lb || !bar) return;
            if (idx === 0) lb.style.display = "block";
            bar.style.width = Math.min(((idx + 1) / msgs.length) * 100, 100) + "%";

            if (idx < msgs.length) {
                type(msgs[idx++], run);
            } else {
                setTimeout(() => {
                    lb.style.display = "none";

                    // Remove boot logs
                    const lines = out?.querySelectorAll('.log-line');
                    lines?.forEach(l => l.remove());

                    if (logo) logo.classList.add('show');
                    if (status) status.classList.add('show');
                }, 500);
            }
        }

        // Start sequence after short delay
        const bootTimeout = setTimeout(run, 1000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearTimeout(bootTimeout);
            // Cleanup DOM if needed, but page transition handles it usually
        };
    }, []);

    return (
        <div className="lobby-wrapper">
            <div className="bg-grid"></div>
            <div className="particles" id="particles"></div>
            {/* Scanlines are global, but we can add local if needed, user provided one */}
            <div className="scanlines"></div>

            <div className="terminal-window">
                <div className="terminal-header">
                    <div className="window-controls">
                        <div className="control close"></div>
                        <div className="control minimize"></div>
                        <div className="control maximize"></div>
                    </div>
                    <div className="terminal-title">Enigma_Core_Terminal // v2.4.0</div>
                </div>
                <div className="terminal-body" id="console-output">
                    <div className="loader-container" id="boot-loader">
                        <div className="loader-bar" id="boot-bar"></div>
                    </div>
                    {/* Logo and Status injected by script */}
                    <div id="enigma-logo" className="enigma-logo" data-text="ENIGMA">ENIGMA</div>
                    <div id="final-status" className="final-status" dangerouslySetInnerHTML={{ __html: ">> Event lobby active — waiting for host to begin <span class='cursor'></span>" }}></div>
                </div>
                <div className="terminal-footer">
                    <div id="clock">{time}</div>
                    <div className="rotating-text">
                        <div className="rotator">
                            <div>Uploding.....</div>
                            <div>Think• Decode • Repeat </div>
                            <div>Recreation starts now.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TextRoundView({ config, username, endTime }: any) {
    const [currentQ, setCurrentQ] = useState(1);
    const [answers, setAnswers] = useState({ 1: '', 2: '', 3: '' });
    const [scores, setScores] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);
    const [displayedText, setDisplayedText] = useState('');


    // Typewriter effect
    useEffect(() => {
        const textKey = `q${currentQ}` as keyof typeof config;
        const text = config?.[textKey] || "Loading mission data...";
        let i = 0;
        setDisplayedText('');

        const timer = setInterval(() => {
            if (i <= text.length) {
                setDisplayedText(text.substring(0, i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 30); // Slower speed for better effect

        return () => clearInterval(timer);
    }, [currentQ, config]);

    const submit = async () => {
        const currentAnswer = answers[currentQ as keyof typeof answers];
        if (!currentAnswer || currentAnswer.length < 5) {
            alert('Response too short. Please provide a more detailed answer.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/game/submit/text', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    answers: {
                        q1: answers[1],
                        q2: answers[2],
                        q3: answers[3]
                    },
                    questionId: currentQ
                })
            });
            const data = await res.json();

            if (!data.success) {
                alert('Submission Error: ' + (data.message || 'Unknown error'));
                return;
            }

            // Map keys back from result
            const newScores: Record<number, number> = {};
            if (data.results?.q1) newScores[1] = data.results.q1.score;
            if (data.results?.q2) newScores[2] = data.results.q2.score;
            if (data.results?.q3) newScores[3] = data.results.q3.score;

            setScores(prev => ({ ...prev, ...newScores }));

            const currentScore = newScores[currentQ] || 0;
            const reasonsKey = `q${currentQ}` as keyof typeof data.results;

            // Set last attempt score
            if (data.results?.[reasonsKey]?.attemptScore !== undefined) {
                setLastScore(data.results[reasonsKey].attemptScore);
            }

            const reason = data.results?.[reasonsKey]?.reason || (currentScore === 0 ? "Score 0 (Possible API Error)" : "Analysis Complete.");
            // Score silent update requested by user




        } catch (e: any) {
            console.error(e);
            alert("Network/System Error: " + (e.message || e));
        } finally {
            setSubmitting(false);
        }
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    return (
        <div className="app-container">
            {/* Header */}
            <div className="header">
                <div className="header-left">
                    <div className="logo">ENIGMA</div>
                    <div className="round-badge">ROUND 1 // TEXT</div>
                    {endTime && <Countdown target={endTime} color="#00ff66" />}
                </div>
                <div className="header-right">
                    <div className="question-nav">
                        {[1, 2, 3].map(q => (
                            <button
                                key={q}
                                onClick={() => setCurrentQ(q)}
                                className={`q-btn ${currentQ === q ? 'active' : ''} ${scores[q] ? 'completed' : ''}`}
                            >
                                Q{q}
                            </button>
                        ))}
                    </div>
                    <div className="score-display">
                        <span className="score-label">TOTAL SCORE</span>
                        <span className="score-value">{totalScore}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Left Panel: Target Result */}
                <div className="panel">
                    <div className="panel-header">
                        <span>// TARGET_OUTPUT</span>
                        <span className="panel-tag">[REVERSE_ENGINEER_THIS]</span>
                    </div>
                    <div className="panel-content">
                        <div className="target-label">AI Generated Result</div>
                        <div className="target-result">
                            {displayedText}
                            <span className="typing-cursor"></span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Input */}
                <div className="panel">
                    <div className="panel-header">
                        <span>// PROMPT_RECONSTRUCTION</span>
                        <span className="panel-tag">[YOUR_INPUT]</span>
                    </div>
                    <div className="panel-content">
                        <div className="input-section">
                            <div className="input-label">&gt; Enter your reconstructed prompt:</div>
                            <textarea
                                id="text-input"
                                className="user-textarea"
                                placeholder="> Analyze the result and craft your prompt here...&#10;> What instructions would generate that output?&#10;> Be specific and detailed..."
                                spellCheck={false}
                                value={answers[currentQ as keyof typeof answers]}
                                onChange={e => setAnswers({ ...answers, [currentQ]: e.target.value })}
                            ></textarea>
                        </div>
                    </div>
                    <div className="action-bar">
                        <div className="status-info">
                            <div className="status-item">
                                <div className="status-dot"></div>
                                <span>CONNECTED</span>
                            </div>
                            <div className="status-item">
                                <span className="char-count">{answers[currentQ as keyof typeof answers].length} chars</span>
                            </div>
                            {/* Show High Score / Best */}
                            <div className="status-item">
                                <span>BEST: <span className="font-bold text-[#00ff66]">{scores[currentQ] || 0}</span></span>
                            </div>
                            {/* Show Last Attempt Score explicitly if available */}
                            {lastScore !== null && (
                                <div className="status-item">
                                    <span>ATTEMPT: <span className="font-bold text-yellow-400">{lastScore}</span></span>
                                </div>
                            )}
                        </div>
                        <button
                            className="submit-btn"
                            onClick={submit}
                            disabled={submitting}
                        >
                            {submitting ? 'PROCESSING...' : 'TRANSMIT'}
                        </button>
                    </div>
                </div>
            </div>


        </div>
    )
}

function ImageRoundView({ config, username, endTime }: any) {
    const [currentQ, setCurrentQ] = useState(1);
    const [answers, setAnswers] = useState({ 1: '', 2: '', 3: '' });
    const [scores, setScores] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [glitch, setGlitch] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);


    // Trigger glitch on question change
    useEffect(() => {
        setGlitch(true);
        const timer = setTimeout(() => setGlitch(false), 300);
        return () => clearTimeout(timer);
    }, [currentQ]);

    const submit = async () => {
        const currentAnswer = answers[currentQ as keyof typeof answers];

        if (!currentAnswer || currentAnswer.length < 5) {
            alert('Description too short. Please provide more detail.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/game/submit/image', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    answers,
                    questionId: currentQ
                })
            });
            const data = await res.json();

            if (!data.success) {
                alert('Submission Error: ' + (data.message || 'Unknown error'));
                return;
            }

            // Handle the response to extract score for this specific question
            const newScores: Record<number, number> = {};
            if (data.results?.['1']) newScores[1] = data.results['1'].score;
            if (data.results?.['2']) newScores[2] = data.results['2'].score;
            if (data.results?.['3']) newScores[3] = data.results['3'].score;

            setScores(prev => ({ ...prev, ...newScores }));

            const currentScore = newScores[currentQ] || 0;
            const reasonsKey = `${currentQ}` as keyof typeof data.results;

            // Set last attempt score
            if (data.results?.[reasonsKey]?.attemptScore !== undefined) {
                setLastScore(data.results[reasonsKey].attemptScore);
            }

            const reason = data.results?.[reasonsKey]?.reason || (currentScore === 0 ? "Score 0 (Possible API Error)" : "Analysis Complete.");
            // Score silent update requested by user



        } catch (e: any) {
            console.error(e);
            alert("Network/System Error: " + (e.message || e));
        } finally {
            setSubmitting(false);
        }
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const getImageSrc = (q: number) => {
        if (config && config[`q${q}Img`]) return config[`q${q}Img`];
        return `/assets/q${q}_placeholder.png`;
    };

    return (
        <div className="app-container">
            {/* Header */}
            <div className="header">
                <div className="header-left">
                    <div className="logo">ENIGMA</div>
                    <div className="round-badge">ROUND 2 // IMAGE</div>
                    {endTime && <Countdown target={endTime} color="#00ff66" />}
                </div>
                <div className="header-right">
                    <div className="question-nav">
                        {[1, 2, 3].map(q => (
                            <button
                                key={q}
                                onClick={() => setCurrentQ(q)}
                                className={`q-btn ${currentQ === q ? 'active' : ''} ${scores[q] ? 'completed' : ''}`}
                            >
                                Q{q}
                            </button>
                        ))}
                    </div>
                    <div className="score-display">
                        <span className="score-label">TOTAL SCORE</span>
                        <span className="score-value">{totalScore}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content" style={{ gap: '20px' }}>
                {/* Left Panel: Target Image */}
                <div className="panel image-panel">
                    <div className="panel-header">
                        <span>// TARGET_VISUAL</span>
                        <span className="panel-tag">[AI_GENERATED]</span>
                    </div>
                    <div className="panel-content" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', position: 'relative', minHeight: '400px' }}>
                            {/* Decorative corners */}
                            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '2px solid #00ff66', borderLeft: '2px solid #00ff66', zIndex: 10 }}></div>
                            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '2px solid #00ff66', borderRight: '2px solid #00ff66', zIndex: 10 }}></div>
                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '2px solid #00ff66', borderLeft: '2px solid #00ff66', zIndex: 10 }}></div>
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '2px solid #00ff66', borderRight: '2px solid #00ff66', zIndex: 10 }}></div>

                            <img
                                src={getImageSrc(currentQ)}
                                alt="Target"
                                className={`${glitch ? 'image-glitch' : ''}`}
                                style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                            />
                            {/* Scanning line overlay */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: '#00ff66', opacity: 0.3, animation: 'scan 3s ease-in-out infinite', pointerEvents: 'none' }}></div>
                        </div>
                        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid #00ff66', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#c0c0c0' }}>
                            <span>RES: 1024x1024</span>
                            <span>SOURCE: STABLE_DIFFUSION</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Input */}
                <div className="panel input-panel">
                    <div className="panel-header">
                        <span>// PROMPT_RECONSTRUCTION</span>
                        <span className="panel-tag">[YOUR_INPUT]</span>
                    </div>
                    <div className="panel-content">
                        <div className="input-section">
                            <div className="input-label">&gt; Describe what you see:</div>
                            <textarea
                                id="image-input"
                                className="user-textarea"
                                placeholder="> Describe what you see...&#10;> Include style, lighting, mood...&#10;> Be specific about visual details..."
                                spellCheck={false}
                                value={answers[currentQ as keyof typeof answers]}
                                onChange={e => setAnswers({ ...answers, [currentQ]: e.target.value })}
                            ></textarea>
                        </div>
                    </div>
                    <div className="action-bar">
                        <div className="status-info">
                            <div className="status-item">
                                <div className="status-dot"></div>
                                <span>CONNECTED</span>
                            </div>
                            {/* Best Score */}
                            <div className="status-item">
                                <span>BEST: <span className="font-bold text-[#00ff66]">{scores[currentQ] || 0}</span></span>
                            </div>
                            {/* Last Attempt Score */}
                            {lastScore !== null && (
                                <div className="status-item">
                                    <span>ATTEMPT: <span className="font-bold text-yellow-400">{lastScore}</span></span>
                                </div>
                            )}
                        </div>
                        <button
                            className="submit-btn"
                            onClick={submit}
                            disabled={submitting}
                        >
                            {submitting ? 'ANALYZING...' : 'INITIATE_ANALYSIS'}
                        </button>
                    </div>
                </div>
            </div>


        </div>
    )
}

function Countdown({ target, color }: { target: number, color: string }) {
    const [left, setLeft] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            const diff = target - now;
            setLeft(Math.max(0, diff));
        }, 1000);
        return () => clearInterval(timer);
    }, [target]);

    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);

    return (
        <div className={`font-mono text-xl font-bold border-2 px-3 py-1 animate-pulse ${color === '#ff3333' ? 'text-red-500 border-red-500' : 'text-[#00ff66] border-[#00ff66]'}`}>
            {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
        </div>
    );
}
