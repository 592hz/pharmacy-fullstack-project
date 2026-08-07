import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, X, Trophy, RotateCcw, Award } from 'lucide-react';

interface PillLevel {
    value: number;
    radius: number;
    color: string;
    icon: string;
    name: string;
}

const PILL_LEVELS: PillLevel[] = [
    { value: 2, radius: 16, color: '#F87171', icon: '💊', name: 'Capsule C (2)' },
    { value: 4, radius: 21, color: '#FB923C', icon: '🍊', name: 'Vitamin C+ (4)' },
    { value: 8, radius: 26, color: '#FBBF24', icon: '🍌', name: 'Vitamin B (8)' },
    { value: 16, radius: 32, color: '#F472B6', icon: '🌸', name: 'Collagen (16)' },
    { value: 32, radius: 38, color: '#22D3EE', icon: '🐟', name: 'Omega 3 (32)' },
    { value: 64, radius: 45, color: '#34D399', icon: '🌿', name: 'Bio Herb (64)' },
    { value: 128, radius: 52, color: '#C084FC', icon: '💜', name: 'Biotin (128)' },
    { value: 256, radius: 60, color: '#FACC15', icon: '⚡', name: 'Multivitamin (256)' },
    { value: 512, radius: 68, color: '#FB7185', icon: '🌟', name: 'Royal Jelly (512)' },
    { value: 1024, radius: 76, color: '#2DD4BF', icon: '💎', name: 'Diamond Pill (1024)' },
    { value: 2048, radius: 85, color: '#A855F7', icon: '👑', name: 'Vua Dược Phẩm (2048)' }
];

interface Body {
    id: number;
    valueIndex: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    isMerging?: boolean;
}

// Audio Synthesizer
const playDropSound = (type: 'drop' | 'merge' | 'bounce' | 'over', isMuted: boolean) => {
    if (isMuted) return;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'drop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'bounce') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'merge') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.08);
            osc.frequency.setValueAtTime(783, now + 0.16);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'over') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(120, now + 0.25);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch {
        // silence audio fail
    }
};

export const PillDropMergeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [score, setScore] = useState<number>(0);
    const [highScore, setHighScore] = useState<number>(() => {
        try {
            return parseInt(localStorage.getItem('pill_drop_highscore') || '0', 10);
        } catch {
            return 0;
        }
    });
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [dropX, setDropX] = useState<number>(160); // Drop pointer X
    const [canDrop, setCanDrop] = useState<boolean>(true);

    // Current & Next pill level index (0 to 4 max for dropping)
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [nextIndex, setNextIndex] = useState<number>(1);

    // Particle effect explosions
    const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number }[]>([]);

    // Active physics bodies
    const bodiesRef = useRef<Body[]>([]);
    const nextBodyId = useRef<number>(1);
    const gameOverTimerRef = useRef<number | null>(null);

    const getRandomStartLevel = useCallback(() => {
        // Random level 0, 1, 2, or 3 (2, 4, 8, 16)
        return Math.floor(Math.random() * 4);
    }, []);

    // Init game
    const initGame = useCallback(() => {
        bodiesRef.current = [];
        particlesRef.current = [];
        setScore(0);
        setIsGameOver(false);
        setCanDrop(true);
        setCurrentIndex(getRandomStartLevel());
        setNextIndex(getRandomStartLevel());
        if (gameOverTimerRef.current) {
            clearTimeout(gameOverTimerRef.current);
            gameOverTimerRef.current = null;
        }
    }, [getRandomStartLevel]);

    useEffect(() => {
        if (isOpen) {
            initGame();
        }
    }, [isOpen, initGame]);

    // Handle Drop Action
    const handleDrop = () => {
        if (!canDrop || isGameOver) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const level = PILL_LEVELS[currentIndex];
        const radius = level.radius;

        // Clamp drop X inside container
        const clampedX = Math.max(radius + 10, Math.min(canvas.width - radius - 10, dropX));

        // Create new physics body at drop line
        const newBody: Body = {
            id: nextBodyId.current++,
            valueIndex: currentIndex,
            x: clampedX,
            y: 50,
            vx: 0,
            vy: 2,
            radius
        };

        bodiesRef.current.push(newBody);
        playDropSound('drop', isMuted);

        // Cooldown before next drop
        setCanDrop(false);
        setCurrentIndex(nextIndex);
        setNextIndex(getRandomStartLevel());

        setTimeout(() => {
            setCanDrop(true);
        }, 500);
    };

    // Physics Engine Update & Render Loop
    useEffect(() => {
        if (!isOpen) return;

        let animId: number;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gravity = 0.35;
        const friction = 0.98;
        const bounce = 0.3;
        const topOverflowY = 90; // Overfill danger line

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Container Background & Border
            ctx.fillStyle = '#FAF5FF';
            ctx.fillRect(0, 0, width, height);

            // Danger Limit Line (Red Dotted)
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(10, topOverflowY);
            ctx.lineTo(width - 10, topOverflowY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Danger label
            ctx.fillStyle = '#EF4444';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('CẢNH BÁO TRÀN VÙNG', width - 15, topOverflowY - 4);

            // 1. Update Physics for Bodies
            const bodies = bodiesRef.current;

            // Apply gravity & friction
            for (let i = 0; i < bodies.length; i++) {
                const b = bodies[i];
                b.vy += gravity;
                b.vx *= friction;
                b.vy *= friction;

                b.x += b.vx;
                b.y += b.vy;

                // Wall Collision (Left & Right)
                if (b.x - b.radius < 10) {
                    b.x = 10 + b.radius;
                    b.vx = -b.vx * bounce;
                } else if (b.x + b.radius > width - 10) {
                    b.x = width - 10 - b.radius;
                    b.vx = -b.vx * bounce;
                }

                // Floor Collision
                if (b.y + b.radius > height - 10) {
                    b.y = height - 10 - b.radius;
                    b.vy = -b.vy * bounce;
                }
            }

            // Body-to-Body Collision & Merging
            for (let i = 0; i < bodies.length; i++) {
                for (let j = i + 1; j < bodies.length; j++) {
                    const b1 = bodies[i];
                    const b2 = bodies[j];

                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const dist = Math.hypot(dx, dy);
                    const minDist = b1.radius + b2.radius;

                    if (dist < minDist && dist > 0) {
                        // Check if same type -> MERGE!
                        if (b1.valueIndex === b2.valueIndex && !b1.isMerging && !b2.isMerging && b1.valueIndex < PILL_LEVELS.length - 1) {
                            b1.isMerging = true;
                            b2.isMerging = true;

                            const nextValIndex = b1.valueIndex + 1;
                            const nextPill = PILL_LEVELS[nextValIndex];

                            // Midpoint position
                            const mx = (b1.x + b2.x) / 2;
                            const my = (b1.y + b2.y) / 2;

                            // Create merged body
                            const mergedBody: Body = {
                                id: nextBodyId.current++,
                                valueIndex: nextValIndex,
                                x: mx,
                                y: my,
                                vx: (b1.vx + b2.vx) * 0.5,
                                vy: -3, // slight pop upward
                                radius: nextPill.radius
                            };

                            // Remove b1 & b2, add mergedBody
                            bodiesRef.current = bodiesRef.current.filter(b => b.id !== b1.id && b.id !== b2.id);
                            bodiesRef.current.push(mergedBody);

                            // Sound & Score
                            playDropSound('merge', isMuted);
                            const points = nextPill.value;
                            setScore((s) => {
                                const ns = s + points;
                                if (ns > highScore) {
                                    setHighScore(ns);
                                    try { localStorage.setItem('pill_drop_highscore', ns.toString()); } catch { }
                                }
                                return ns;
                            });

                            // Spawn Particles
                            for (let p = 0; p < 8; p++) {
                                const angle = Math.random() * Math.PI * 2;
                                const speed = Math.random() * 3 + 1;
                                particlesRef.current.push({
                                    x: mx,
                                    y: my,
                                    vx: Math.cos(angle) * speed,
                                    vy: Math.sin(angle) * speed,
                                    color: nextPill.color,
                                    life: 1.0
                                });
                            }
                            return;
                        }

                        // Normal Elastic Collision Push-apart
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;

                        b1.x -= nx * overlap * 0.5;
                        b1.y -= ny * overlap * 0.5;
                        b2.x += nx * overlap * 0.5;
                        b2.y += ny * overlap * 0.5;

                        // Exchange velocity
                        const kx = b1.vx - b2.vx;
                        const ky = b1.vy - b2.vy;
                        const p = 2 * (nx * kx + ny * ky) / 2;

                        b1.vx -= p * nx * 0.6;
                        b1.vy -= p * ny * 0.6;
                        b2.vx += p * nx * 0.6;
                        b2.vy += p * ny * 0.6;
                    }
                }
            }

            // 2. Render Bodies
            bodiesRef.current.forEach((b) => {
                const info = PILL_LEVELS[b.valueIndex];

                // Sphere Circle Gradient
                const grad = ctx.createRadialGradient(
                    b.x - b.radius * 0.3,
                    b.y - b.radius * 0.3,
                    b.radius * 0.1,
                    b.x,
                    b.y,
                    b.radius
                );
                grad.addColorStop(0, '#FFFFFF');
                grad.addColorStop(0.3, info.color);
                grad.addColorStop(1, info.color);

                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();

                // Icon & Value text inside sphere
                ctx.font = `${Math.max(10, Math.floor(b.radius * 0.6))}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(info.icon, b.x, b.y - b.radius * 0.15);

                ctx.font = `bold ${Math.max(9, Math.floor(b.radius * 0.4))}px sans-serif`;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(info.value.toString(), b.x, b.y + b.radius * 0.35);
            });

            // 3. Render Particles
            particlesRef.current.forEach((pt, idx) => {
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.life -= 0.04;

                if (pt.life > 0) {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 3 * pt.life, 0, Math.PI * 2);
                    ctx.fillStyle = pt.color;
                    ctx.fill();
                }
            });
            particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);

            // 4. Render Dropper Pointer & Loaded Pill Preview
            if (canDrop && !isGameOver) {
                const currentPill = PILL_LEVELS[currentIndex];

                // Dotted line down
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = '#C084FC';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(dropX, 40);
                ctx.lineTo(dropX, height - 10);
                ctx.stroke();
                ctx.setLineDash([]);

                // Loaded Sphere at pointer
                ctx.beginPath();
                ctx.arc(dropX, 45, currentPill.radius, 0, Math.PI * 2);
                ctx.fillStyle = currentPill.color;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();

                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(currentPill.icon, dropX, 45);
            }

            // 5. Check Overfill Game Over
            const overflowBody = bodiesRef.current.find(b => b.y - b.radius < topOverflowY && Math.abs(b.vy) < 0.5);
            if (overflowBody) {
                if (!gameOverTimerRef.current) {
                    gameOverTimerRef.current = window.setTimeout(() => {
                        setIsGameOver(true);
                        playDropSound('over', isMuted);
                    }, 2500);
                }
            } else {
                if (gameOverTimerRef.current) {
                    clearTimeout(gameOverTimerRef.current);
                    gameOverTimerRef.current = null;
                }
            }

            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [isOpen, dropX, canDrop, currentIndex, isMuted, highScore, isGameOver]);

    // Handle Pointer Movement on Canvas
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        setDropX(mx);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none">
            <div className="relative w-full max-w-md bg-purple-50/95 dark:bg-neutral-900 border-4 border-purple-300 dark:border-purple-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-3.5 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/40">
                            🧪
                        </div>
                        <div>
                            <h2 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 drop-shadow-sm">
                                Thả Viên Thuốc Hợp Nhất
                            </h2>
                            <p className="text-[11px] opacity-90 font-medium">Pill Merge Physics Drop • Suika Style</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 border border-white/30 shadow-sm">
                            <Trophy size={14} className="text-yellow-300" />
                            <span>{score}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition text-white border border-white/30"
                            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-rose-600 transition text-white border border-white/30"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Game Info Bar */}
                <div className="p-2.5 bg-purple-100/80 dark:bg-neutral-850 border-b border-purple-200 dark:border-neutral-800 flex items-center justify-between text-xs font-extrabold px-4">
                    <div className="flex items-center gap-3">
                        <span className="text-purple-800 dark:text-purple-300 flex items-center gap-1">
                            <Award size={15} className="text-amber-500" />
                            <span>Kỷ kỷ lục: <strong className="text-amber-600">{highScore}</strong></span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Upcoming Next Pill Preview */}
                        <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-neutral-700 text-[11px] font-black text-purple-900 dark:text-purple-200 shadow-sm">
                            <span className="text-[10px] opacity-70">Tiếp:</span>
                            <span>{PILL_LEVELS[nextIndex].icon}</span>
                            <span className="text-[10px]">({PILL_LEVELS[nextIndex].value})</span>
                        </div>

                        <button
                            type="button"
                            onClick={initGame}
                            className="p-1 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow"
                        >
                            <RotateCcw size={13} />
                            <span>Chơi lại</span>
                        </button>
                    </div>
                </div>

                {/* Game Canvas Container */}
                <div className="p-3 flex-1 flex flex-col items-center justify-center overflow-y-auto">
                    <div className="relative border-4 border-purple-300 dark:border-neutral-700 rounded-3xl shadow-lg bg-white overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={320}
                            height={420}
                            onPointerMove={handlePointerMove}
                            onClick={handleDrop}
                            className="cursor-pointer touch-none"
                        />

                        {/* Game Over Screen Overlay */}
                        {isGameOver && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white text-center animate-fadeIn z-20">
                                <span className="text-5xl mb-2">🙀</span>
                                <h3 className="text-2xl font-black mb-1">Ống Thí Nghiệm Đã Tràn!</h3>
                                <p className="text-xs opacity-90 mb-4">Điểm số lượt này: <strong>{score}</strong></p>
                                <button
                                    type="button"
                                    onClick={initGame}
                                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs rounded-xl shadow-lg hover:scale-105 transition"
                                >
                                    Thử Lại Lượt Mới 🚀
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer instructions */}
                <div className="p-2.5 bg-purple-100/80 dark:bg-neutral-850 border-t border-purple-200 dark:border-neutral-800 text-center text-[11px] text-purple-800 dark:text-purple-400 font-bold">
                    💡 Di chuột / thả tay để thả viên thuốc! 2 viên cùng số chạm vào nhau sẽ ghép thành viên lớn hơn!
                </div>

            </div>
        </div>
    );
};

export default PillDropMergeModal;
