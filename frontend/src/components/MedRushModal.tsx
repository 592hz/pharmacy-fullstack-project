import React, { useState, useEffect, useRef } from 'react';
import { X, Play, RotateCcw, Trophy, Volume2, VolumeX, Pause, Sparkles } from 'lucide-react';

interface MedRushModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MedRushModal: React.FC<MedRushModalProps> = ({ isOpen, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
    const [score, setScore] = useState<number>(0);
    const [coins, setCoins] = useState<number>(0);
    const [highScore, setHighScore] = useState<number>(() => {
        return parseInt(localStorage.getItem('MED_RUSH_HIGH_SCORE') || '0', 10);
    });
    const [isMuted, setIsMuted] = useState<boolean>(false);

    // Audio synthesizer helper using Web Audio API
    const playSound = (type: 'jump' | 'coin' | 'powerup' | 'hit' | 'gameover') => {
        if (isMuted) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            if (type === 'jump') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'coin') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(987.77, now); // B5
                osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'powerup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'gameover') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.5);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            }
        } catch (e) {
            // Audio context not allowed or unsupported
        }
    };

    // Game loop references
    const gameRef = useRef<{
        player: {
            x: number;
            y: number;
            w: number;
            h: number;
            vy: number;
            gravity: number;
            jumpPower: number;
            isGrounded: boolean;
            jumpCount: number;
            maxJumps: number;
            shield: boolean;
            rotation: number;
        };
        obstacles: Array<{ x: number; y: number; w: number; h: number; type: 'VIRUS' | 'SPIKE' | 'SYRINGE'; speed: number }>;
        coins: Array<{ x: number; y: number; r: number; collected: boolean; value: number }>;
        particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }>;
        bgOffset: number;
        speed: number;
        distance: number;
        coinCount: number;
        animId: number | null;
    }>({
        player: { x: 80, y: 250, w: 42, h: 42, vy: 0, gravity: 0.65, jumpPower: -12.5, isGrounded: false, jumpCount: 0, maxJumps: 2, shield: false, rotation: 0 },
        obstacles: [],
        coins: [],
        particles: [],
        bgOffset: 0,
        speed: 5,
        distance: 0,
        coinCount: 0,
        animId: null
    });

    const triggerJump = () => {
        const p = gameRef.current.player;
        if (p.jumpCount < p.maxJumps) {
            p.vy = p.jumpPower;
            p.jumpCount += 1;
            p.isGrounded = false;
            playSound('jump');
            // Create jump particles
            for (let i = 0; i < 8; i++) {
                gameRef.current.particles.push({
                    x: p.x + p.w / 2,
                    y: p.y + p.h,
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * 2 + 1,
                    color: '#38bdf8',
                    life: 1,
                    size: Math.random() * 4 + 2
                });
            }
        }
    };

    const startGame = () => {
        gameRef.current = {
            player: { x: 80, y: 240, w: 42, h: 42, vy: 0, gravity: 0.65, jumpPower: -12.5, isGrounded: true, jumpCount: 0, maxJumps: 2, shield: false, rotation: 0 },
            obstacles: [],
            coins: [],
            particles: [],
            bgOffset: 0,
            speed: 5,
            distance: 0,
            coinCount: 0,
            animId: null
        };
        setScore(0);
        setCoins(0);
        setGameState('PLAYING');
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                if (gameState === 'PLAYING') {
                    triggerJump();
                } else if (gameState === 'START' || gameState === 'GAMEOVER') {
                    startGame();
                }
            } else if (e.code === 'KeyP') {
                if (gameState === 'PLAYING') setGameState('PAUSED');
                else if (gameState === 'PAUSED') setGameState('PLAYING');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, gameState]);

    // Canvas render loop
    useEffect(() => {
        if (!isOpen || gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastSpawnObstacle = 0;
        let lastSpawnCoin = 0;

        const loop = (timestamp: number) => {
            const g = gameRef.current;
            const p = g.player;
            const groundY = canvas.height - 70;

            // Increase difficulty speed gradually
            g.speed = 5 + Math.floor(g.distance / 500) * 0.5;
            g.distance += 1;
            setScore(Math.floor(g.distance / 5));

            // --- 1. Update Physics ---
            p.vy += p.gravity;
            p.y += p.vy;

            if (p.y + p.h >= groundY) {
                p.y = groundY - p.h;
                p.vy = 0;
                p.isGrounded = true;
                p.jumpCount = 0;
            }

            // Player rolling rotation animation
            p.rotation += 0.08 * (g.speed / 5);

            // Background parallax scroll
            g.bgOffset = (g.bgOffset + g.speed * 0.5) % canvas.width;

            // --- 2. Spawn Items ---
            if (timestamp - lastSpawnObstacle > Math.max(1100, 2200 - g.speed * 120)) {
                lastSpawnObstacle = timestamp;
                const types: Array<'VIRUS' | 'SPIKE' | 'SYRINGE'> = ['VIRUS', 'SPIKE', 'SYRINGE'];
                const selectedType = types[Math.floor(Math.random() * types.length)];
                
                let obsH = 40;
                let obsW = 40;
                let obsY = groundY - obsH;

                if (selectedType === 'SYRINGE') {
                    obsH = 30;
                    obsW = 55;
                    obsY = groundY - 80 - Math.random() * 50; // Flying obstacle
                }

                g.obstacles.push({
                    x: canvas.width + 20,
                    y: obsY,
                    w: obsW,
                    h: obsH,
                    type: selectedType,
                    speed: g.speed
                });
            }

            // Spawn Coins
            if (timestamp - lastSpawnCoin > 800) {
                lastSpawnCoin = timestamp;
                if (Math.random() > 0.4) {
                    const coinY = groundY - 50 - Math.random() * 110;
                    g.coins.push({
                        x: canvas.width + 20,
                        y: coinY,
                        r: 12,
                        collected: false,
                        value: 10
                    });
                }
            }

            // --- 3. Draw Background ---
            // Gradient Sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGrad.addColorStop(0, '#0f172a');
            skyGrad.addColorStop(0.5, '#1e1b4b');
            skyGrad.addColorStop(1, '#311042');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Parallax Grid / Stars
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            for (let i = 0; i < 30; i++) {
                const starX = ((i * 40 - g.bgOffset * 0.3) % canvas.width + canvas.width) % canvas.width;
                const starY = (i * 17) % (canvas.height - 100);
                ctx.beginPath();
                ctx.arc(starX, starY, (i % 3) + 1, 0, Math.PI * 2);
                ctx.fill();
            }

            // Stylized Ground
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
            
            // Ground top glowing line
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(canvas.width, groundY);
            ctx.stroke();

            // Ground pattern line segments
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
            ctx.lineWidth = 2;
            for (let x = -g.bgOffset % 40; x < canvas.width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, groundY);
                ctx.lineTo(x - 20, canvas.height);
                ctx.stroke();
            }

            // --- 4. Update & Draw Coins ---
            g.coins.forEach((c) => {
                c.x -= g.speed;

                if (!c.collected) {
                    // Draw Coin (Golden Pill Vitamin Icon)
                    ctx.save();
                    ctx.translate(c.x, c.y);
                    ctx.fillStyle = '#fbbf24';
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner C design
                    ctx.fillStyle = '#78350f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('C', 0, 1);
                    ctx.restore();

                    // Collision check
                    const dx = (p.x + p.w / 2) - c.x;
                    const dy = (p.y + p.h / 2) - c.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < p.w / 2 + c.r) {
                        c.collected = true;
                        g.coinCount += 1;
                        setCoins(g.coinCount);
                        playSound('coin');
                        
                        // Sparkle effect
                        for (let i = 0; i < 6; i++) {
                            g.particles.push({
                                x: c.x,
                                y: c.y,
                                vx: (Math.random() - 0.5) * 5,
                                vy: (Math.random() - 0.5) * 5,
                                color: '#fbbf24',
                                life: 1,
                                size: 3
                            });
                        }
                    }
                }
            });
            g.coins = g.coins.filter(c => c.x > -50 && !c.collected);

            // --- 5. Update & Draw Obstacles ---
            let collisionOccurred = false;
            g.obstacles.forEach((obs) => {
                obs.x -= g.speed;

                ctx.save();
                ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);

                if (obs.type === 'VIRUS') {
                    // Spiky Red Virus Blob
                    ctx.fillStyle = '#ef4444';
                    ctx.shadowColor = '#b91c1c';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(0, 0, obs.w / 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Spikes around
                    ctx.fillStyle = '#dc2626';
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                        const sx = Math.cos(a) * (obs.w / 2 + 5);
                        const sy = Math.sin(a) * (obs.h / 2 + 5);
                        ctx.beginPath();
                        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    // Angry eyes
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(-6, -4, 4, 0, Math.PI * 2);
                    ctx.arc(6, -4, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(-6, -4, 2, 0, Math.PI * 2);
                    ctx.arc(6, -4, 2, 0, Math.PI * 2);
                    ctx.fill();

                } else if (obs.type === 'SPIKE') {
                    // Spike Trap
                    ctx.fillStyle = '#94a3b8';
                    ctx.beginPath();
                    ctx.moveTo(-obs.w / 2, obs.h / 2);
                    ctx.lineTo(0, -obs.h / 2);
                    ctx.lineTo(obs.w / 2, obs.h / 2);
                    ctx.closePath();
                    ctx.fill();

                } else if (obs.type === 'SYRINGE') {
                    // Flying Syringe
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(-obs.w / 2, -obs.h / 4, obs.w * 0.7, obs.h / 2);
                    // Needle tip
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(-obs.w / 2 - 10, -2, 10, 4);
                }

                ctx.restore();

                // AABB Collision check
                const padding = 6;
                if (
                    p.x + padding < obs.x + obs.w - padding &&
                    p.x + p.w - padding > obs.x + padding &&
                    p.y + padding < obs.y + obs.h - padding &&
                    p.y + p.h - padding > obs.y + padding
                ) {
                    collisionOccurred = true;
                }
            });
            g.obstacles = g.obstacles.filter(o => o.x > -100);

            // --- 6. Draw Player (Cute Pill Capsule Character) ---
            ctx.save();
            ctx.translate(p.x + p.w / 2, p.y + p.h / 2);

            // Rotate slightly when jumping or rolling
            ctx.rotate(p.isGrounded ? p.rotation : p.vy * 0.05);

            // Capsule Shadow
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 15;

            // Draw Pill Half 1 (White top)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -p.h / 4, p.w / 2, Math.PI, 0, false);
            ctx.lineTo(p.w / 2, 0);
            ctx.lineTo(-p.w / 2, 0);
            ctx.closePath();
            ctx.fill();

            // Draw Pill Half 2 (Vibrant Cyan / Red)
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(0, p.h / 4, p.w / 2, 0, Math.PI, false);
            ctx.lineTo(-p.w / 2, 0);
            ctx.lineTo(p.w / 2, 0);
            ctx.closePath();
            ctx.fill();

            // Divider stroke line
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-p.w / 2, 0);
            ctx.lineTo(p.w / 2, 0);
            ctx.stroke();

            // Cute Character Face (Eyes & Mouth)
            ctx.fillStyle = '#0f172a';
            // Eyes
            ctx.beginPath();
            ctx.arc(-7, -6, 3, 0, Math.PI * 2);
            ctx.arc(7, -6, 3, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlights
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-8, -7, 1, 0, Math.PI * 2);
            ctx.arc(6, -7, 1, 0, Math.PI * 2);
            ctx.fill();

            // Happy mouth
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -2, 4, 0.1 * Math.PI, 0.9 * Math.PI, false);
            ctx.stroke();

            ctx.restore();

            // --- 7. Draw Particles ---
            g.particles.forEach(pt => {
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.life -= 0.04;
                ctx.fillStyle = pt.color;
                ctx.globalAlpha = Math.max(0, pt.life);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });
            g.particles = g.particles.filter(pt => pt.life > 0);

            // Handle Collision GameOver
            if (collisionOccurred) {
                playSound('hit');
                playSound('gameover');

                const currentScore = Math.floor(g.distance / 5);
                if (currentScore > highScore) {
                    setHighScore(currentScore);
                    localStorage.setItem('MED_RUSH_HIGH_SCORE', currentScore.toString());
                }
                setGameState('GAMEOVER');
                return;
            }

            g.animId = requestAnimationFrame(loop);
        };

        const animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [isOpen, gameState, highScore]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col relative text-white">

                {/* Top Header Bar */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl font-black text-xs tracking-wider shadow-lg">
                            MED RUSH
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
                            <span className="flex items-center gap-1 text-amber-400">
                                <Trophy size={14} /> Cao nhất: {highScore}
                            </span>
                            <span className="flex items-center gap-1 text-yellow-400">
                                <Sparkles size={14} /> Xu: {coins}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Bật/Tắt Âm Thanh"
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        {gameState === 'PLAYING' && (
                            <button
                                onClick={() => setGameState('PAUSED')}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                                <Pause size={18} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div className="relative w-full h-[380px] bg-slate-950 flex items-center justify-center overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={700}
                        height={380}
                        className="w-full h-full object-cover block cursor-pointer"
                        onClick={() => {
                            if (gameState === 'PLAYING') triggerJump();
                        }}
                    />

                    {/* Score Overlay while Playing */}
                    {gameState === 'PLAYING' && (
                        <div className="absolute top-4 left-6 text-3xl font-black tracking-widest text-white drop-shadow-[0_2px_10px_rgba(6,182,212,0.8)] select-none">
                            {score} <span className="text-xs text-cyan-400 font-bold uppercase">m</span>
                        </div>
                    )}

                    {/* START overlay */}
                    {gameState === 'START' && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                            <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black mb-3 border border-cyan-500/40 uppercase tracking-widest">
                                Trò Chơi Phản Xạ Đấu Trí 🎮
                            </div>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-rose-400 mb-2 drop-shadow">
                                MED RUSH 💊
                            </h2>
                            <p className="text-xs text-slate-400 max-w-sm mb-6 font-medium leading-relaxed">
                                Nhanh tay điều khiển Viên Thuốc siêu cute nhảy tránh virus & chướng ngại vật! Thu thập Vitamin C để bứt phá kỷ lục!
                            </p>

                            <div className="flex flex-col items-center gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2"
                                >
                                    <Play size={18} /> BẮT ĐẦU CHƠI (SPACE / CLICK)
                                </button>
                                <span className="text-[11px] text-slate-500 font-bold">
                                    💡 Nhấn Phím CÁCH (Space) hoặc Chạm Màn Hình để Nhảy 2 Bước!
                                </span>
                            </div>
                        </div>
                    )}

                    {/* PAUSED overlay */}
                    {gameState === 'PAUSED' && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                            <h3 className="text-2xl font-black text-white mb-4">TẠM DỪNG GAME</h3>
                            <button
                                onClick={() => setGameState('PLAYING')}
                                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2"
                            >
                                <Play size={18} /> TIẾP TỤC CHƠI
                            </button>
                        </div>
                    )}

                    {/* GAMEOVER overlay */}
                    {gameState === 'GAMEOVER' && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-150">
                            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mb-3 border border-rose-500/40 shadow-lg">
                                💥
                            </div>
                            <h3 className="text-3xl font-black text-white mb-1">GAME OVER</h3>
                            <p className="text-xs text-slate-400 mb-4 font-semibold">Viên thuốc đã đụng phải vi rút độc hại!</p>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl w-64 space-y-2 mb-6">
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>Điểm quãng đường:</span>
                                    <span className="text-lg font-black text-cyan-400">{score} m</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>Vitamin thu thập:</span>
                                    <span className="text-base font-black text-yellow-400">+{coins} xu</span>
                                </div>
                                <div className="h-px bg-slate-800 my-1"></div>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>Kỷ lục cao nhất:</span>
                                    <span className="text-base font-black text-emerald-400">{highScore} m</span>
                                </div>
                            </div>

                            <button
                                onClick={startGame}
                                className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2"
                            >
                                <RotateCcw size={18} /> CHƠI LẠI NGAY
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Control Bar */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono font-bold">SPACE</span>
                        <span>Nhảy (Double Jump được)</span>
                    </div>
                    <button
                        onClick={() => {
                            if (gameState === 'PLAYING') triggerJump();
                        }}
                        className="sm:hidden px-6 py-2.5 bg-cyan-600 text-white font-black rounded-xl active:scale-95 transition"
                    >
                        NHẢY 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedRushModal;
