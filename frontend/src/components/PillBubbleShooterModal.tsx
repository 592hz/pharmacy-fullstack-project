import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Volume2, VolumeX, X, Trophy, RotateCcw, Target, Award } from 'lucide-react';

interface BubbleType {
    id: string;
    name: string;
    icon: string;
    color: string;
    bgGradient: string;
    borderColor: string;
    prescriptionName: string;
}

const MEDICINE_TYPES: BubbleType[] = [
    { id: 'para', name: 'Paracetamol', icon: '💊', color: '#EF4444', bgGradient: 'from-red-400 to-rose-500', borderColor: 'border-red-300', prescriptionName: 'Liều Thuốc Hạ Sốt 🌡️' },
    { id: 'vitc', name: 'Vitamin C', icon: '🍊', color: '#F97316', bgGradient: 'from-orange-400 to-amber-500', borderColor: 'border-orange-300', prescriptionName: 'Liều Vitamin Tăng Đề Kháng ⚡' },
    { id: 'bio', name: 'Kháng Sinh Bio', icon: '🌿', color: '#10B981', bgGradient: 'from-emerald-400 to-teal-500', borderColor: 'border-emerald-300', prescriptionName: 'Liều Antibiotic Diệt Khuẩn 🦠' },
    { id: 'amox', name: 'Amoxicillin', icon: '🍋', color: '#EAB308', bgGradient: 'from-yellow-400 to-amber-400', borderColor: 'border-yellow-300', prescriptionName: 'Liều Thuốc GPP Chuẩn 🏥' },
    { id: 'omega', name: 'Omega 3 Bổ Mắt', icon: '🐟', color: '#06B6D4', bgGradient: 'from-cyan-400 to-blue-500', borderColor: 'border-cyan-300', prescriptionName: 'Liều Dầu Cá Sáng Mắt 👀' },
    { id: 'calci', name: 'Canxi Bắp Búp', icon: '🌸', color: '#EC4899', bgGradient: 'from-pink-400 to-rose-400', borderColor: 'border-pink-300', prescriptionName: 'Liều Canxi Xương Khỏe 🦴' }
];

const ROWS = 9;
const COLS = 8;
const BUBBLE_RADIUS = 18; // radius in px inside canvas

// Audio Synthesizer
const playShooterSound = (type: 'shoot' | 'bounce' | 'pop' | 'drop' | 'win' | 'over', isMuted: boolean) => {
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

        if (type === 'shoot') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'bounce') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.setValueAtTime(500, now + 0.04);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.06);
            osc.frequency.setValueAtTime(783, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'drop') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'win') {
            osc.type = 'sine';
            [523, 659, 783, 1046, 1318].forEach((f, i) => {
                osc.frequency.setValueAtTime(f, now + i * 0.06);
            });
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'over') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(140, now + 0.2);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch {
        // audio muted fallback
    }
};

export const PillBubbleShooterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [score, setScore] = useState<number>(0);
    const [highScore, setHighScore] = useState<number>(() => {
        try {
            return parseInt(localStorage.getItem('pill_shooter_highscore') || '0', 10);
        } catch {
            return 0;
        }
    });
    const [prescriptionsCrafted, setPrescriptionsCrafted] = useState<number>(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [isWon, setIsWon] = useState<boolean>(false);
    const [aimAngle, setAimAngle] = useState<number>(-Math.PI / 2); // default straight up

    // Notification toast in game
    const [lastPrescription, setLastPrescription] = useState<string | null>(null);

    // Game grid state: matrix of (BubbleType | null)
    const gridRef = useRef<(BubbleType | null)[][]>([]);
    
    // Shooter State
    const [currentBubble, setCurrentBubble] = useState<BubbleType>(MEDICINE_TYPES[0]);
    const [nextBubble, setNextBubble] = useState<BubbleType>(MEDICINE_TYPES[1]);
    
    // Flying projectile state
    const flyingRef = useRef<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        bubble: BubbleType;
        active: boolean;
    } | null>(null);

    const shotCountRef = useRef<number>(0);

    // Get random medicine type
    const getRandomMedicine = useCallback(() => {
        return MEDICINE_TYPES[Math.floor(Math.random() * MEDICINE_TYPES.length)];
    }, []);

    // Initialize Grid with top rows filled
    const initGrid = useCallback(() => {
        const grid: (BubbleType | null)[][] = [];
        for (let r = 0; r < ROWS; r++) {
            const row: (BubbleType | null)[] = [];
            for (let c = 0; c < COLS; c++) {
                if (r < 4) {
                    row.push(getRandomMedicine());
                } else {
                    row.push(null);
                }
            }
            grid.push(row);
        }
        gridRef.current = grid;
    }, [getRandomMedicine]);

    // Reset Game
    const initGame = useCallback(() => {
        initGrid();
        setCurrentBubble(getRandomMedicine());
        setNextBubble(getRandomMedicine());
        setScore(0);
        setPrescriptionsCrafted(0);
        setIsGameOver(false);
        setIsWon(false);
        setLastPrescription(null);
        flyingRef.current = null;
        shotCountRef.current = 0;
    }, [initGrid, getRandomMedicine]);

    useEffect(() => {
        if (isOpen) {
            initGame();
        }
    }, [isOpen, initGame]);

    // Calculate cell center position in canvas
    const getCellCenter = (row: number, col: number, width: number) => {
        const radius = BUBBLE_RADIUS;
        const xShift = (row % 2 === 1) ? radius : 0;
        const x = col * (radius * 2) + radius + xShift + (width - COLS * radius * 2) / 2;
        const y = row * (radius * 1.732) + radius + 15;
        return { x, y };
    };

    // Find connected matching bubbles (BFS)
    const findCluster = (startR: number, startC: number, typeId: string) => {
        const grid = gridRef.current;
        const cluster: { r: number; c: number }[] = [];
        const visited = new Set<string>();
        const queue = [{ r: startR, c: startC }];

        visited.add(`${startR},${startC}`);

        while (queue.length > 0) {
            const { r, c } = queue.shift()!;
            cluster.push({ r, c });

            // Neighbors (Hexagonal grid)
            const isOdd = r % 2 === 1;
            const neighbors = [
                { r: r, c: c - 1 }, { r: r, c: c + 1 },
                { r: r - 1, c: isOdd ? c : c - 1 }, { r: r - 1, c: isOdd ? c + 1 : c },
                { r: r + 1, c: isOdd ? c : c - 1 }, { r: r + 1, c: isOdd ? c + 1 : c }
            ];

            for (const n of neighbors) {
                if (n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS) {
                    const key = `${n.r},${n.c}`;
                    if (!visited.has(key) && grid[n.r][n.c]?.id === typeId) {
                        visited.add(key);
                        queue.push(n);
                    }
                }
            }
        }
        return cluster;
    };

    // Find all bubbles floating (not attached to row 0)
    const dropFloatingBubbles = () => {
        const grid = gridRef.current;
        const attached = new Set<string>();
        const queue: { r: number; c: number }[] = [];

        for (let c = 0; c < COLS; c++) {
            if (grid[0][c] !== null) {
                attached.add(`0,${c}`);
                queue.push({ r: 0, c });
            }
        }

        while (queue.length > 0) {
            const { r, c } = queue.shift()!;
            const isOdd = r % 2 === 1;
            const neighbors = [
                { r: r, c: c - 1 }, { r: r, c: c + 1 },
                { r: r - 1, c: isOdd ? c : c - 1 }, { r: r - 1, c: isOdd ? c + 1 : c },
                { r: r + 1, c: isOdd ? c : c - 1 }, { r: r + 1, c: isOdd ? c + 1 : c }
            ];

            for (const n of neighbors) {
                if (n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS) {
                    const key = `${n.r},${n.c}`;
                    if (!attached.has(key) && grid[n.r][n.c] !== null) {
                        attached.add(key);
                        queue.push(n);
                    }
                }
            }
        }

        // Clear unattached
        let droppedCount = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c] !== null && !attached.has(`${r},${c}`)) {
                    grid[r][c] = null;
                    droppedCount++;
                }
            }
        }

        if (droppedCount > 0) {
            playShooterSound('drop', isMuted);
            setScore((s) => s + droppedCount * 50);
        }
    };

    // Check game condition after shot
    const checkGameState = () => {
        const grid = gridRef.current;
        let total = 0;
        let isOver = false;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c] !== null) {
                    total++;
                    if (r >= ROWS - 1) {
                        isOver = true;
                    }
                }
            }
        }

        if (total === 0) {
            setIsWon(true);
            playShooterSound('win', isMuted);
        } else if (isOver) {
            setIsGameOver(true);
            playShooterSound('over', isMuted);
        }
    };

    // Shoot current bubble
    const handleShoot = () => {
        if (flyingRef.current?.active || isGameOver || isWon) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const startX = canvas.width / 2;
        const startY = canvas.height - 35;
        const speed = 12;

        playShooterSound('shoot', isMuted);

        flyingRef.current = {
            x: startX,
            y: startY,
            vx: Math.cos(aimAngle) * speed,
            vy: Math.sin(aimAngle) * speed,
            bubble: currentBubble,
            active: true
        };

        // Prepare next shot
        setCurrentBubble(nextBubble);
        setNextBubble(getRandomMedicine());

        shotCountRef.current += 1;
    };

    // Main Canvas Render & Animation Loop
    useEffect(() => {
        if (!isOpen) return;

        let animId: number;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Draw Background Grid Guide
            ctx.fillStyle = '#FAF5FF';
            ctx.fillRect(0, 0, width, height);

            // Draw Ceiling baseline
            ctx.strokeStyle = '#F3E8FF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(width, 15);
            ctx.stroke();

            // 1. Draw Grid Bubbles
            const grid = gridRef.current;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const bubble = grid[r][c];
                    if (bubble) {
                        const { x, y } = getCellCenter(r, c, width);

                        // Bubble Circle
                        ctx.beginPath();
                        ctx.arc(x, y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
                        ctx.fillStyle = bubble.color;
                        ctx.fill();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.stroke();

                        // Icon inside
                        ctx.font = '14px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(bubble.icon, x, y);
                    }
                }
            }

            // 2. Update Flying Projectile Physics
            if (flyingRef.current && flyingRef.current.active) {
                const fly = flyingRef.current;
                fly.x += fly.vx;
                fly.y += fly.vy;

                // Wall Bounce (Left / Right)
                if (fly.x - BUBBLE_RADIUS <= 10) {
                    fly.x = 10 + BUBBLE_RADIUS;
                    fly.vx = -fly.vx;
                    playShooterSound('bounce', isMuted);
                } else if (fly.x + BUBBLE_RADIUS >= width - 10) {
                    fly.x = width - 10 - BUBBLE_RADIUS;
                    fly.vx = -fly.vx;
                    playShooterSound('bounce', isMuted);
                }

                // Check collision with top ceiling or existing bubbles
                let collided = false;
                let targetR = 0;
                let targetC = 0;

                // Ceiling hit
                if (fly.y - BUBBLE_RADIUS <= 15) {
                    collided = true;
                    targetR = 0;
                    // Find nearest col
                    let minD = Infinity;
                    for (let c = 0; c < COLS; c++) {
                        const { x } = getCellCenter(0, c, width);
                        const d = Math.abs(fly.x - x);
                        if (d < minD) {
                            minD = d;
                            targetC = c;
                        }
                    }
                } else {
                    // Check bubble collisions
                    for (let r = 0; r < ROWS; r++) {
                        for (let c = 0; c < COLS; c++) {
                            if (grid[r][c] !== null) {
                                const { x, y } = getCellCenter(r, c, width);
                                const dist = Math.hypot(fly.x - x, fly.y - y);
                                if (dist <= BUBBLE_RADIUS * 1.8) {
                                    collided = true;
                                    break;
                                }
                            }
                        }
                        if (collided) break;
                    }

                    if (collided) {
                        // Find closest empty cell to snap
                        let minDist = Infinity;
                        for (let r = 0; r < ROWS; r++) {
                            for (let c = 0; c < COLS; c++) {
                                if (grid[r][c] === null) {
                                    const { x, y } = getCellCenter(r, c, width);
                                    const dist = Math.hypot(fly.x - x, fly.y - y);
                                    if (dist < minDist) {
                                        minDist = dist;
                                        targetR = r;
                                        targetC = c;
                                    }
                                }
                            }
                        }
                    }
                }

                if (collided) {
                    // Place bubble in grid
                    grid[targetR][targetC] = fly.bubble;
                    fly.active = false;

                    // Check for matching cluster (3+)
                    const cluster = findCluster(targetR, targetC, fly.bubble.id);
                    if (cluster.length >= 3) {
                        // POP!
                        playShooterSound('pop', isMuted);
                        cluster.forEach(({ r, c }) => {
                            grid[r][c] = null;
                        });

                        // Drop unattached floating bubbles
                        dropFloatingBubbles();

                        // Reward points & prescription
                        const points = cluster.length * 100;
                        setScore((s) => {
                            const ns = s + points;
                            if (ns > highScore) {
                                setHighScore(ns);
                                try { localStorage.setItem('pill_shooter_highscore', ns.toString()); } catch { }
                            }
                            return ns;
                        });

                        setPrescriptionsCrafted((p) => p + 1);
                        setLastPrescription(`Bào chế thành công +1 ${fly.bubble.prescriptionName}! (+${points} điểm)`);

                        setTimeout(() => setLastPrescription(null), 2000);
                    } else {
                        // Sound for normal attach
                        playShooterSound('bounce', isMuted);
                    }

                    checkGameState();
                } else {
                    // Draw Flying Bubble
                    ctx.beginPath();
                    ctx.arc(fly.x, fly.y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
                    ctx.fillStyle = fly.bubble.color;
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.stroke();

                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(fly.bubble.icon, fly.x, fly.y);
                }
            }

            // 3. Draw Shooter Cannon & Aim Line
            const cannonX = width / 2;
            const cannonY = height - 35;

            // Dotted aim line
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#A855F7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cannonX, cannonY);
            ctx.lineTo(cannonX + Math.cos(aimAngle) * 160, cannonY + Math.sin(aimAngle) * 160);
            ctx.stroke();
            ctx.setLineDash([]); // reset

            // Current Bubble loaded in cannon
            ctx.beginPath();
            ctx.arc(cannonX, cannonY, BUBBLE_RADIUS + 2, 0, Math.PI * 2);
            ctx.fillStyle = currentBubble.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();

            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentBubble.icon, cannonX, cannonY);

            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [isOpen, aimAngle, currentBubble, isMuted, highScore]);

    // Handle Aim Mouse/Touch Movement
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const cannonX = canvas.width / 2;
        const cannonY = canvas.height - 35;

        let angle = Math.atan2(my - cannonY, mx - cannonX);
        // Restrict aim angle (not pointing down)
        if (angle > -0.2) angle = -0.2;
        if (angle < -Math.PI + 0.2) angle = -Math.PI + 0.2;

        setAimAngle(angle);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none">
            <div className="relative w-full max-w-md bg-purple-50/95 dark:bg-neutral-900 border-4 border-purple-300 dark:border-purple-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-3.5 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/40">
                            🎯
                        </div>
                        <div>
                            <h2 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 drop-shadow-sm">
                                Bắn Viên Thuốc Bào Chế
                            </h2>
                            <p className="text-[11px] opacity-90 font-medium">Pill Bubble Shooter • Relaxing Game</p>
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

                {/* Info Bar */}
                <div className="p-2.5 bg-purple-100/80 dark:bg-neutral-850 border-b border-purple-200 dark:border-neutral-800 flex items-center justify-between text-xs font-extrabold px-4">
                    <div className="flex items-center gap-3">
                        <span className="text-purple-800 dark:text-purple-300 flex items-center gap-1">
                            <Award size={15} className="text-amber-500" />
                            <span>Kỷ lục: <strong className="text-amber-600">{highScore}</strong></span>
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-300">
                            💊 Đã chế: <strong>{prescriptionsCrafted} liều</strong>
                        </span>
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

                {/* Toast Notification when a prescription is crafted */}
                {lastPrescription && (
                    <div className="bg-emerald-500 text-white text-xs font-black p-2 text-center shadow-md animate-pop-bounce flex items-center justify-center gap-1.5">
                        <Sparkles size={15} />
                        <span>{lastPrescription}</span>
                    </div>
                )}

                {/* Game Canvas Board */}
                <div className="p-3 flex-1 flex flex-col items-center justify-center overflow-y-auto">
                    <div className="relative border-4 border-purple-300 dark:border-neutral-700 rounded-3xl shadow-lg bg-white overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={320}
                            height={380}
                            onPointerMove={handlePointerMove}
                            onClick={handleShoot}
                            className="cursor-crosshair touch-none"
                        />

                        {/* Upcoming Next Bubble Preview Badge */}
                        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-800 border-2 border-purple-200 dark:border-neutral-600 px-2.5 py-1 rounded-2xl shadow flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-200">
                            <span className="text-[10px] opacity-70">Tiếp:</span>
                            <span className="text-lg">{nextBubble.icon}</span>
                        </div>

                        {/* Aim & Shoot Helper */}
                        <div className="absolute bottom-3 right-3 bg-purple-500 text-white px-3 py-1 rounded-2xl shadow text-[11px] font-black flex items-center gap-1 animate-pulse">
                            <Target size={14} />
                            <span>Chạm để Bắn</span>
                        </div>

                        {/* Game Over Screen Overlay */}
                        {isGameOver && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white text-center animate-fadeIn z-20">
                                <span className="text-5xl mb-2">😿</span>
                                <h3 className="text-2xl font-black mb-1">Thuốc Tràn Màn Hình Gòi!</h3>
                                <p className="text-xs opacity-90 mb-4">Bạn đã chế được <strong>{prescriptionsCrafted} liều thuốc</strong>!</p>
                                <button
                                    type="button"
                                    onClick={initGame}
                                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs rounded-xl shadow-lg hover:scale-105 transition"
                                >
                                    Thử Lại Lượt Mới 🚀
                                </button>
                            </div>
                        )}

                        {/* Victory Screen Overlay */}
                        {isWon && !isGameOver && (
                            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white text-center animate-fadeIn z-20">
                                <span className="text-5xl mb-2 animate-bounce">🎉</span>
                                <h3 className="text-2xl font-black mb-1">XÓA BẢNG THÀNH CÔNG!</h3>
                                <p className="text-xs opacity-90 mb-4">Bào chế hoàn hảo toàn bộ kho dược phẩm!</p>
                                <button
                                    type="button"
                                    onClick={initGame}
                                    className="px-5 py-2.5 bg-white text-emerald-900 font-black text-xs rounded-xl shadow-lg hover:scale-105 transition"
                                >
                                    Chơi Màn Mới 🌟
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer instructions */}
                <div className="p-2.5 bg-purple-100/80 dark:bg-neutral-850 border-t border-purple-200 dark:border-neutral-800 text-center text-[11px] text-purple-800 dark:text-purple-400 font-bold">
                    💡 Nhắm góc và nhấp chuột / chạm màn hình để bắn 3+ viên cùng loại tạo thành **Liều Thuốc**!
                </div>

            </div>
        </div>
    );
};

export default PillBubbleShooterModal;
