import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, ChevronRight, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface PiggybackMazeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── AUDIO SYNTHESIZER ───
class SoundFX {
    private ctx: AudioContext | null = null;
    public muted: boolean = false;

    private init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playCollect() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(1174.66, this.ctx.currentTime + 0.1); // D6
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playSpecial() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.35);
    }

    playHit() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.25);
        });
    }
}

const sfx = new SoundFX();

// ─── MAZE LEVEL DEFINITIONS ───
interface Ghost {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    color: string;
    speedTimer: number;
}

interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
    opacity: number;
}

interface LevelConfig {
    id: number;
    title: string;
    subtitle: string;
    timeLimit: number;
    gridSize: number; // 13, 15, 17, etc.
    ghostCount: number;
    ghostSpeed: number; // ms per move step
}

const LEVELS: LevelConfig[] = [
    { id: 1, title: 'Màn 1: Khởi Động Yêu Thương', subtitle: 'Hành trình cùng bạn tìm bi ngọt ngào', timeLimit: 90, gridSize: 13, ghostCount: 1, ghostSpeed: 450 },
    { id: 2, title: 'Màn 2: Phố Phường Bận Rộn', subtitle: 'Mê cung rộng hơn với các viên ngọc hiếm', timeLimit: 80, gridSize: 15, ghostCount: 2, ghostSpeed: 380 },
    { id: 3, title: 'Màn 3: Mê Cung Đêm Trăng', subtitle: 'Thách thức quái vật đuổi theo bạn', timeLimit: 75, gridSize: 15, ghostCount: 3, ghostSpeed: 320 },
    { id: 4, title: 'Màn 4: Dược Khoa Thần Tốc', subtitle: 'Phản xạ đỉnh cao nhặt bi nhanh chóng', timeLimit: 65, gridSize: 17, ghostCount: 4, ghostSpeed: 270 },
    { id: 5, title: 'Màn 5: Siêu Thử Thách Vô Địch', subtitle: 'Tránh quái ma và nhặt sạch toàn bộ bi', timeLimit: 55, gridSize: 19, ghostCount: 5, ghostSpeed: 220 },
];

// Helper to generate solvable mazes with items
function generateMaze(size: number): { grid: number[][]; totalItems: number; startPos: { x: number; y: number } } {
    // 0: Coin, 1: Wall, 2: Empty Path, 3: Special Gem
    const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(1));

    function carve(cx: number, cy: number) {
        grid[cy][cx] = 0;
        const dirs = [
            [0, -2], [0, 2], [-2, 0], [2, 0]
        ].sort(() => Math.random() - 0.5);

        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx] === 1) {
                grid[cy + dy / 2][cx + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);

    // Make extra open loops in maze for fun navigation
    for (let r = 2; r < size - 2; r += 2) {
        for (let c = 2; c < size - 2; c += 2) {
            if (grid[r][c] === 1 && Math.random() < 0.35) {
                grid[r][c] = 0;
            }
        }
    }

    // Place player at (1, 1) and clear area
    grid[1][1] = 2;
    grid[1][2] = 0;
    grid[2][1] = 0;

    let totalItems = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) {
                // 8% chance to be a Special Gem
                if (Math.random() < 0.08) {
                    grid[r][c] = 3;
                }
                totalItems++;
            }
        }
    }

    return { grid, totalItems, startPos: { x: 1, y: 1 } };
}

// ─── SUPER CUTE CHIBI PIGGYBACK COUPLE CANVAS DRAWING ───
function drawCuteChibiCouple(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    tileSize: number,
    now: number,
    facingRight: boolean
) {
    ctx.save();
    ctx.translate(px, py);

    const bob = Math.sin(now / 100) * 2;
    const r = tileSize * 0.44;

    if (!facingRight) {
        ctx.scale(-1, 1);
    }

    // 1. Soft Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.85, r * 0.6, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Girl on Back (Behind Boy) 👧🎀
    const gx = -r * 0.15;
    const gy = -r * 0.35 + bob * 0.8;
    const headR = r * 0.36;

    // Girl Hair (Back)
    ctx.fillStyle = '#652b19';
    ctx.beginPath();
    ctx.arc(gx - r * 0.1, gy + r * 0.1, headR * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Girl Head
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(gx, gy, headR, 0, Math.PI * 2);
    ctx.fill();

    // Girl Bangs / Hair Front
    ctx.fillStyle = '#652b19';
    ctx.beginPath();
    ctx.arc(gx, gy - headR * 0.2, headR, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();

    // Girl Pink Bow 🎀
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(gx + headR * 0.6, gy - headR * 0.8, headR * 0.35, headR * 0.2, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(gx + headR * 0.6, gy - headR * 0.8, headR * 0.35, headR * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx + headR * 0.6, gy - headR * 0.8, headR * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Girl Eyes (Sparkling Big Anime Eyes)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(gx + headR * 0.35, gy - headR * 0.05, headR * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Eye Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx + headR * 0.42, gy - headR * 0.12, headR * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Girl Blush Cheek 🌸
    ctx.fillStyle = 'rgba(251, 113, 133, 0.7)';
    ctx.beginPath();
    ctx.ellipse(gx + headR * 0.3, gy + headR * 0.25, headR * 0.22, headR * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Girl Cute Smile
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(gx + headR * 0.4, gy + headR * 0.1, headR * 0.15, 0.1, Math.PI * 0.9);
    ctx.stroke();

    // Girl Hugging Arm around Boy's Neck
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.ellipse(gx + r * 0.2, gy + r * 0.35, r * 0.2, r * 0.1, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Boy Carrying Girl (Front Carrier) 👦👕
    const bx = 0;
    const by = r * 0.1 + bob;
    const bHeadR = r * 0.38;

    // Boy Body / Mint Cyan Hoodie
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.roundRect(bx - bHeadR * 0.85, by + bHeadR * 0.4, bHeadR * 1.7, bHeadR * 1.2, 8);
    ctx.fill();

    // Hoodie Strings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 3, by + bHeadR * 0.6);
    ctx.lineTo(bx - 3, by + bHeadR * 1.1);
    ctx.moveTo(bx + 3, by + bHeadR * 0.6);
    ctx.lineTo(bx + 3, by + bHeadR * 1.1);
    ctx.stroke();

    // Boy Head
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(bx, by, bHeadR, 0, Math.PI * 2);
    ctx.fill();

    // Boy Hair (Spiky Cool Hair)
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.arc(bx, by - bHeadR * 0.15, bHeadR * 1.05, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Hair bangs spikes
    ctx.beginPath();
    ctx.moveTo(bx - bHeadR * 0.7, by - bHeadR * 0.3);
    ctx.lineTo(bx - bHeadR * 0.2, by + bHeadR * 0.1);
    ctx.lineTo(bx + bHeadR * 0.2, by - bHeadR * 0.4);
    ctx.lineTo(bx + bHeadR * 0.6, by + bHeadR * 0.05);
    ctx.lineTo(bx + bHeadR * 0.9, by - bHeadR * 0.2);
    ctx.lineTo(bx + bHeadR, by - bHeadR * 0.8);
    ctx.closePath();
    ctx.fill();

    // Boy Eyes
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(bx + bHeadR * 0.35, by - bHeadR * 0.05, bHeadR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye Sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx + bHeadR * 0.42, by - bHeadR * 0.1, bHeadR * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Boy Blush Cheek
    ctx.fillStyle = 'rgba(251, 113, 133, 0.65)';
    ctx.beginPath();
    ctx.ellipse(bx + bHeadR * 0.3, by + bHeadR * 0.25, bHeadR * 0.2, bHeadR * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boy Happy Mouth
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx + bHeadR * 0.35, by + bHeadR * 0.15, bHeadR * 0.15, 0.1, Math.PI * 0.9);
    ctx.stroke();

    // 4. Floating Sparkling Heart 💖 Above Head
    const heartY = -r * 1.1 + Math.sin(now / 120) * 3;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.font = `${r * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', 0, heartY);
    ctx.shadowBlur = 0;

    ctx.restore();
}

// ─── SMART BFS SHORTEST PATHFINDING AI FOR CAT GHOSTS ───
function findBFSNextStep(
    grid: number[][],
    sx: number,
    sy: number,
    tx: number,
    ty: number
): { dx: number; dy: number } | null {
    const size = grid.length;
    if (sx === tx && sy === ty) return null;

    const queue: { x: number; y: number; path: { dx: number; dy: number }[] }[] = [
        { x: sx, y: sy, path: [] }
    ];
    const visited = new Set<string>();
    visited.add(`${sx},${sy}`);

    const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr.x === tx && curr.y === ty) {
            return curr.path[0] || null;
        }

        for (const d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            const key = `${nx},${ny}`;

            if (
                nx >= 0 && nx < size && ny >= 0 && ny < size &&
                grid[ny][nx] !== 1 && !visited.has(key)
            ) {
                visited.add(key);
                queue.push({
                    x: nx,
                    y: ny,
                    path: [...curr.path, d]
                });
            }
        }
    }

    return null;
}

export const PiggybackMazeModal: React.FC<PiggybackMazeModalProps> = ({ isOpen, onClose }) => {
    const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [combo, setCombo] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(90);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'WIN' | 'GAMEOVER'>('IDLE');
    const [soundMuted, setSoundMuted] = useState<boolean>(false);
    const [itemsCollected, setItemsCollected] = useState<number>(0);
    const [totalItems, setTotalItems] = useState<number>(0);

    const levelConfig = LEVELS[currentLevelIdx];

    // Game world refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gridRef = useRef<number[][]>([]);
    const playerPosRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
    const playerDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
    const ghostsRef = useRef<Ghost[]>([]);
    const floatTextsRef = useRef<FloatingText[]>([]);
    const animFrameRef = useRef<number | null>(null);
    const lastGhostMoveRef = useRef<number>(0);
    const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // High score from localStorage
    const [highScore, setHighScore] = useState<number>(() => {
        return Number(localStorage.getItem('PIGGYBACK_MAZE_HIGH_SCORE') || 0);
    });

    const initLevel = useCallback((lvlIdx: number) => {
        const config = LEVELS[lvlIdx];
        const { grid, totalItems: count, startPos } = generateMaze(config.gridSize);
        gridRef.current = grid;
        playerPosRef.current = { ...startPos };
        playerDirRef.current = { dx: 0, dy: 0 };
        setTotalItems(count);
        setItemsCollected(0);
        setTimeLeft(config.timeLimit);
        setCombo(0);
        floatTextsRef.current = [];

        // Spawn ghosts at random corners away from start
        const ghostColors = ['#ff4d6d', '#4cc9f0', '#fbbf24', '#a855f7', '#34d399'];
        const newGhosts: Ghost[] = [];
        const size = config.gridSize;

        for (let i = 0; i < config.ghostCount; i++) {
            let gx = size - 2;
            let gy = size - 2;
            if (i === 1) { gx = size - 2; gy = 1; }
            if (i === 2) { gx = 1; gy = size - 2; }
            if (i === 3) { gx = Math.floor(size / 2); gy = Math.floor(size / 2); }

            // Ensure ghost is on a path
            grid[gy][gx] = 2; // path

            newGhosts.push({
                x: gx,
                y: gy,
                dirX: Math.random() < 0.5 ? 1 : -1,
                dirY: 0,
                color: ghostColors[i % ghostColors.length],
                speedTimer: 0
            });
        }
        ghostsRef.current = newGhosts;
    }, []);

    const startGame = (lvlIdx: number = 0) => {
        setCurrentLevelIdx(lvlIdx);
        setScore(0);
        initLevel(lvlIdx);
        setGameState('PLAYING');
    };

    const nextLevel = () => {
        if (currentLevelIdx < LEVELS.length - 1) {
            const nxt = currentLevelIdx + 1;
            setCurrentLevelIdx(nxt);
            initLevel(nxt);
            setGameState('PLAYING');
            toast.success(`🎉 Chuyển sang ${LEVELS[nxt].title}!`);
        } else {
            toast.success('🏆 CHÚC MỪNG! Bạn đã xuất sắc hoàn thành toàn bộ các màn chơi!');
            setGameState('WIN');
        }
    };

    // Countdown Timer Effect
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setGameState('GAMEOVER');
                    sfx.playHit();
                    toast.error('⏰ Hết giờ! Hãy thử lại nhé!');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Handle Player Movement
    const movePlayer = useCallback((dx: number, dy: number) => {
        if (gameState !== 'PLAYING') return;
        const grid = gridRef.current;
        const px = playerPosRef.current.x + dx;
        const py = playerPosRef.current.y + dy;

        // Check bounds & wall collision
        if (py >= 0 && py < grid.length && px >= 0 && px < grid[0].length && grid[py][px] !== 1) {
            playerPosRef.current = { x: px, y: py };
            playerDirRef.current = { dx, dy };

            // Collect items
            const cellValue = grid[py][px];
            if (cellValue === 0 || cellValue === 3) {
                grid[py][px] = 2; // Collected
                const isSpecial = cellValue === 3;
                const basePts = isSpecial ? 50 : 10;

                setCombo((prev) => {
                    const nextCombo = prev + 1;

                    // Reset combo timer
                    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
                    comboTimerRef.current = setTimeout(() => setCombo(0), 2000);

                    const comboMultiplier = Math.min(Math.floor(nextCombo / 3) + 1, 5);
                    const pointsGained = basePts * comboMultiplier;

                    setScore((s) => {
                        const newScore = s + pointsGained;
                        setHighScore((h) => {
                            if (newScore > h) {
                                localStorage.setItem('PIGGYBACK_MAZE_HIGH_SCORE', String(newScore));
                                return newScore;
                            }
                            return h;
                        });
                        return newScore;
                    });

                    // Add Floating Score Text
                    floatTextsRef.current.push({
                        id: Date.now() + Math.random(),
                        x: px,
                        y: py,
                        text: `+${pointsGained}${comboMultiplier > 1 ? ` (x${comboMultiplier})` : ''}`,
                        color: isSpecial ? '#f43f5e' : '#eab308',
                        opacity: 1
                    });

                    return nextCombo;
                });

                setItemsCollected((c) => {
                    const nextC = c + 1;
                    if (nextC >= totalItems) {
                        sfx.playWin();
                        setGameState('WIN');
                    } else {
                        if (isSpecial) sfx.playSpecial();
                        else sfx.playCollect();
                    }
                    return nextC;
                });
            }
        }
    }, [gameState, totalItems]);

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'PLAYING') return;
            if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); movePlayer(0, -1); }
            if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); movePlayer(0, 1); }
            if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); movePlayer(-1, 0); }
            if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); movePlayer(1, 0); }
            if (['Space', 'KeyP'].includes(e.code)) {
                setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, movePlayer]);

    // Canvas Render & Game Engine Loop
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = (now: number) => {

            const grid = gridRef.current;
            if (!grid || grid.length === 0) return;

            const size = grid.length;
            const tileSize = canvas.width / size;

            // Clear Background
            ctx.fillStyle = '#0f172a'; // Deep slate blue/black
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Maze Grid Tiles
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const tile = grid[r][c];
                    const x = c * tileSize;
                    const y = r * tileSize;

                    if (tile === 1) {
                        // Wall Tile: Glowing 3D Brick effect
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(x, y, tileSize, tileSize);
                        ctx.strokeStyle = '#334155';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, tileSize, tileSize);

                        // Top inner highlight
                        ctx.fillStyle = '#475569';
                        ctx.fillRect(x, y, tileSize, 2);
                    } else {
                        // Path Tile
                        ctx.fillStyle = '#090d16';
                        ctx.fillRect(x, y, tileSize, tileSize);
                        ctx.strokeStyle = '#1e293b/30';
                        ctx.strokeRect(x, y, tileSize, tileSize);

                        // Draw Collectibles
                        if (tile === 0) {
                            // Gold Coin / Pearl
                            const pulse = Math.sin(now / 150 + c + r) * 1.5;
                            const radius = Math.max(tileSize * 0.18 + pulse, 2);

                            ctx.shadowColor = '#f59e0b';
                            ctx.shadowBlur = 8;
                            ctx.fillStyle = '#fbbf24';
                            ctx.beginPath();
                            ctx.arc(x + tileSize / 2, y + tileSize / 2, radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 0;
                        } else if (tile === 3) {
                            // Special Gem (Diamond)
                            const pulse = Math.sin(now / 100 + c) * 2;
                            const sizeGem = tileSize * 0.35 + pulse;

                            ctx.shadowColor = '#ec4899';
                            ctx.shadowBlur = 12;
                            ctx.fillStyle = '#f43f5e';
                            ctx.beginPath();
                            ctx.ellipse(x + tileSize / 2, y + tileSize / 2, sizeGem / 2, sizeGem, Math.PI / 4, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.shadowBlur = 0;
                        }
                    }
                }
            }

            // Move Smart Tactical Cat Ghosts AI (BFS Shortest Path + Ambush Tactics)
            if (gameState === 'PLAYING' && now - lastGhostMoveRef.current > levelConfig.ghostSpeed) {
                lastGhostMoveRef.current = now;

                const px = playerPosRef.current.x;
                const py = playerPosRef.current.y;
                const pDir = playerDirRef.current;
                const smartProbability = 0.6 + currentLevelIdx * 0.08; // 60% -> 92% smart AI per level

                ghostsRef.current.forEach((g, gIdx) => {
                    let nextMove: { dx: number; dy: number } | null = null;

                    // Determine Target position based on Cat Ghost Role
                    let targetX = px;
                    let targetY = py;

                    // Ghost 1 (Cyan Ambusher): Predicts 3 steps ahead of player
                    if (gIdx === 1) {
                        targetX = Math.max(1, Math.min(size - 2, px + (pDir.dx || 1) * 3));
                        targetY = Math.max(1, Math.min(size - 2, py + (pDir.dy || 0) * 3));
                    }

                    // Ghost 2 (Yellow Flanker): Flanks from behind/side
                    if (gIdx === 2) {
                        targetX = Math.max(1, Math.min(size - 2, px - (pDir.dx || 0) * 2));
                        targetY = Math.max(1, Math.min(size - 2, py - (pDir.dy || 1) * 2));
                    }

                    // Try BFS shortest path lookup
                    if (Math.random() < smartProbability) {
                        nextMove = findBFSNextStep(grid, g.x, g.y, targetX, targetY);
                    }

                    // Fallback to closest adjacent move if BFS not taken or blocked
                    if (!nextMove) {
                        const validMoves: { dx: number; dy: number }[] = [];
                        const dirs = [
                            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                        ];

                        dirs.forEach(({ dx, dy }) => {
                            const nx = g.x + dx;
                            const ny = g.y + dy;
                            if (ny >= 0 && ny < size && nx >= 0 && nx < size && grid[ny][nx] !== 1) {
                                validMoves.push({ dx, dy });
                            }
                        });

                        if (validMoves.length > 0) {
                            validMoves.sort((a, b) => {
                                const distA = Math.hypot(g.x + a.dx - targetX, g.y + a.dy - targetY);
                                const distB = Math.hypot(g.x + b.dx - targetX, g.y + b.dy - targetY);
                                return distA - distB;
                            });
                            nextMove = validMoves[0];
                        }
                    }

                    if (nextMove) {
                        g.x += nextMove.dx;
                        g.y += nextMove.dy;
                    }

                    // Check Collision with Player
                    if (g.x === px && g.y === py) {
                        sfx.playHit();
                        setGameState('GAMEOVER');
                        toast.error('💥 Đã bị Quái Ma Mèo đuổi kịp & bắt trúng! Hãy phản xạ nhanh hơn!');
                    }
                });
            }

            // Render Ghosts (👾 Cute Chibi Ghost Ma Mèo)
            ghostsRef.current.forEach((g) => {
                const gx = g.x * tileSize + tileSize / 2;
                const gy = g.y * tileSize + tileSize / 2;
                const bob = Math.sin(now / 120 + g.x) * 2.5;

                ctx.save();
                ctx.shadowColor = g.color;
                ctx.shadowBlur = 12;

                // Cat ears on top of ghost 🐱
                ctx.fillStyle = g.color;
                ctx.beginPath();
                ctx.moveTo(gx - tileSize * 0.3, gy - tileSize * 0.2 + bob);
                ctx.lineTo(gx - tileSize * 0.18, gy - tileSize * 0.45 + bob);
                ctx.lineTo(gx - tileSize * 0.05, gy - tileSize * 0.25 + bob);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(gx + tileSize * 0.05, gy - tileSize * 0.25 + bob);
                ctx.lineTo(gx + tileSize * 0.18, gy - tileSize * 0.45 + bob);
                ctx.lineTo(gx + tileSize * 0.3, gy - tileSize * 0.2 + bob);
                ctx.fill();

                // Inner Ear Pink Accent
                ctx.fillStyle = '#fda4af';
                ctx.beginPath();
                ctx.moveTo(gx - tileSize * 0.24, gy - tileSize * 0.22 + bob);
                ctx.lineTo(gx - tileSize * 0.18, gy - tileSize * 0.38 + bob);
                ctx.lineTo(gx - tileSize * 0.1, gy - tileSize * 0.25 + bob);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(gx + tileSize * 0.1, gy - tileSize * 0.25 + bob);
                ctx.lineTo(gx + tileSize * 0.18, gy - tileSize * 0.38 + bob);
                ctx.lineTo(gx + tileSize * 0.24, gy - tileSize * 0.22 + bob);
                ctx.fill();

                // Main Ghost Body
                ctx.fillStyle = g.color;
                ctx.beginPath();
                ctx.arc(gx, gy - 2 + bob, tileSize * 0.35, Math.PI, 0, false);
                ctx.lineTo(gx + tileSize * 0.35, gy + tileSize * 0.3 + bob);
                ctx.lineTo(gx + tileSize * 0.2, gy + tileSize * 0.2 + bob);
                ctx.lineTo(gx, gy + tileSize * 0.32 + bob);
                ctx.lineTo(gx - tileSize * 0.2, gy + tileSize * 0.2 + bob);
                ctx.lineTo(gx - tileSize * 0.35, gy + tileSize * 0.3 + bob);
                ctx.closePath();
                ctx.fill();

                // Cute Big Eyes 👀
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(gx - 4.5, gy - 3 + bob, 4.2, 0, Math.PI * 2);
                ctx.arc(gx + 4.5, gy - 3 + bob, 4.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#1e1b4b';
                ctx.beginPath();
                ctx.arc(gx - 3.5, gy - 3 + bob, 2.2, 0, Math.PI * 2);
                ctx.arc(gx + 5.5, gy - 3 + bob, 2.2, 0, Math.PI * 2);
                ctx.fill();

                // Eye Highlights
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(gx - 2.5, gy - 4.5 + bob, 1, 0, Math.PI * 2);
                ctx.arc(gx + 6.5, gy - 4.5 + bob, 1, 0, Math.PI * 2);
                ctx.fill();

                // Blushing Pink Cheeks 🌸
                ctx.fillStyle = 'rgba(251, 113, 133, 0.7)';
                ctx.beginPath();
                ctx.ellipse(gx - 6, gy + 3 + bob, 3, 1.8, 0, 0, Math.PI * 2);
                ctx.ellipse(gx + 6, gy + 3 + bob, 3, 1.8, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.restore();
            });

            // Render Piggyback Player (👦🎒👧 Custom Canvas Chibi Couple)
            const px = playerPosRef.current.x * tileSize + tileSize / 2;
            const py = playerPosRef.current.y * tileSize + tileSize / 2;
            const facingRight = playerDirRef.current.dx >= 0;

            // Draw Custom Super-Cute Piggyback Couple
            drawCuteChibiCouple(ctx, px, py, tileSize, now, facingRight);

            // Render Floating Score Popups (+10, +50)
            floatTextsRef.current.forEach((ft, idx) => {
                ft.y -= 0.03;
                ft.opacity -= 0.02;

                if (ft.opacity <= 0) {
                    floatTextsRef.current.splice(idx, 1);
                    return;
                }

                const fx = ft.x * tileSize + tileSize / 2;
                const fy = ft.y * tileSize + tileSize / 2;

                ctx.font = `bold ${tileSize * 0.45}px sans-serif`;
                ctx.fillStyle = ft.color;
                ctx.globalAlpha = Math.max(ft.opacity, 0);
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 4;
                ctx.fillText(ft.text, fx, fy);
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            });

            if (gameState === 'PLAYING') {
                animFrameRef.current = requestAnimationFrame(render);
            }
        };

        animFrameRef.current = requestAnimationFrame(render);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isOpen, gameState, levelConfig]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none">
            <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

                {/* Modal Header */}
                <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 p-4 text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
                            🧑‍🤝‍🧑
                        </div>
                        <div>
                            <h2 className="font-black text-base sm:text-lg leading-tight flex items-center gap-2">
                                <span>Cõng Bạn Tìm Thuốc & Bi</span>
                                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">
                                    {levelConfig.title.split(':')[0]}
                                </span>
                            </h2>
                            <p className="text-[11px] text-white/80 font-medium">
                                {levelConfig.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const nextMuted = !soundMuted;
                                setSoundMuted(nextMuted);
                                sfx.muted = nextMuted;
                            }}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
                            title={soundMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        >
                            {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Status Bar / Dashboard */}
                <div className="bg-neutral-800 border-b border-neutral-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-amber-400">
                            <Trophy size={16} />
                            <span>Điểm: <strong className="text-white text-sm">{score}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-rose-400">
                            <Heart size={16} className="animate-pulse" />
                            <span>Đã ăn: <strong className="text-white text-sm">{itemsCollected}/{totalItems}</strong></span>
                        </div>

                        {combo > 1 && (
                            <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black animate-bounce shadow">
                                COMBO x{Math.min(Math.floor(combo / 3) + 1, 5)} 🔥
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs border ${
                            timeLeft <= 15 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-neutral-700 text-cyan-400 border-neutral-600'
                        }`}>
                            <span>⏱️ Đếm ngược: {timeLeft}s</span>
                        </div>

                        <div className="text-neutral-400 font-mono text-[11px]">
                            🏆 Kỷ lục: <span className="text-amber-400 font-bold">{highScore}</span>
                        </div>
                    </div>
                </div>

                {/* Main Game Screen */}
                <div className="relative flex-1 bg-slate-950 flex flex-col items-center justify-center p-3 overflow-hidden min-h-[360px]">

                    {/* Canvas Canvas Maze Container */}
                    <canvas
                        ref={canvasRef}
                        width={440}
                        height={440}
                        className="rounded-2xl shadow-2xl border-2 border-slate-700/60 max-w-full max-h-[50vh] object-contain bg-slate-950"
                    />

                    {/* Start Screen Overlay */}
                    {gameState === 'IDLE' && (
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
                            <div className="text-5xl animate-bounce">🧑‍🤝‍🧑🎒🪙</div>
                            <div>
                                <h3 className="text-xl font-black text-white">Cõng Bạn Tìm Thuốc & Bi</h3>
                                <p className="text-xs text-neutral-400 max-w-md mt-1.5">
                                    Di chuyển qua mê cung, ăn sạch các viên bi vàng & ngọc quý trước khi hết giờ. Hãy chú ý né tránh các quái ma 👾!
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 max-w-md my-2">
                                {LEVELS.map((lvl, idx) => (
                                    <button
                                        key={lvl.id}
                                        onClick={() => startGame(idx)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                            idx === currentLevelIdx
                                                ? 'bg-amber-500 text-neutral-950 shadow-lg font-black'
                                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                        }`}
                                    >
                                        <span>{lvl.title.split(':')[0]}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => startGame(0)}
                                className="px-6 py-3 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-sm rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2"
                            >
                                <Play size={18} />
                                <span>BẮT ĐẦU CHƠI NGAY 🚀</span>
                            </button>
                        </div>
                    )}

                    {/* Pause Screen Overlay */}
                    {gameState === 'PAUSED' && (
                        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
                            <div className="text-4xl">⏸️</div>
                            <h3 className="text-xl font-black text-white">ĐÃ TẠM DỪNG GAME</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setGameState('PLAYING')}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                                >
                                    <Play size={16} />
                                    <span>Tiếp Tục</span>
                                </button>
                                <button
                                    onClick={() => startGame(currentLevelIdx)}
                                    className="px-5 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                                >
                                    <RotateCcw size={16} />
                                    <span>Chơi Lại Màn Này</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Win Screen Overlay */}
                    {gameState === 'WIN' && (
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-in zoom-in-95">
                            <div className="text-5xl animate-bounce">🏆🌟💖</div>
                            <div>
                                <h3 className="text-2xl font-black text-amber-400">CHIẾN THẮNG RẠNG RỠ!</h3>
                                <p className="text-xs text-neutral-300 mt-1">
                                    Bạn đã xuất sắc thu thập trọn vẹn bi & thuốc ở <span className="text-amber-300 font-bold">{levelConfig.title}</span>!
                                </p>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl p-4 w-full max-w-xs space-y-2 text-xs">
                                <div className="flex justify-between text-neutral-400">
                                    <span>Tổng điểm màn này:</span>
                                    <span className="text-amber-400 font-extrabold text-sm">{score}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                    <span>Thời gian còn lại:</span>
                                    <span className="text-cyan-400 font-bold">{timeLeft}s</span>
                                </div>
                                <div className="flex justify-between text-neutral-400 pt-1 border-t border-neutral-800">
                                    <span>Kỷ lục cao nhất:</span>
                                    <span className="text-rose-400 font-bold">{highScore}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => startGame(currentLevelIdx)}
                                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                                >
                                    <RotateCcw size={16} />
                                    <span>Chơi Lại</span>
                                </button>

                                {currentLevelIdx < LEVELS.length - 1 ? (
                                    <button
                                        onClick={nextLevel}
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                                    >
                                        <span>MÀN TIẾP THEO</span>
                                        <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => startGame(0)}
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition"
                                    >
                                        Chơi Lại Từ Màn 1
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen Overlay */}
                    {gameState === 'GAMEOVER' && (
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-in zoom-in-95">
                            <div className="text-5xl">🥺💨💥</div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-500">THẤT BẠI RỒI!</h3>
                                <p className="text-xs text-neutral-300 mt-1">
                                    Đừng nản lòng nhé! Hãy cõng bạn cẩn thận hơn để chinh phục màn chơi!
                                </p>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 w-full max-w-xs space-y-2 text-xs">
                                <div className="flex justify-between text-neutral-400">
                                    <span>Số bi đã nhặt:</span>
                                    <span className="text-amber-400 font-bold">{itemsCollected}/{totalItems}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                    <span>Điểm đạt được:</span>
                                    <span className="text-white font-bold">{score}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => startGame(currentLevelIdx)}
                                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-xl transition flex items-center gap-2"
                            >
                                <RotateCcw size={16} />
                                <span>THỬ LẠI MÀN NÀY 🚀</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Virtual D-Pad / Controls Footer */}
                <div className="bg-neutral-900 border-t border-neutral-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-neutral-400 font-medium hidden sm:block">
                        💡 Thao tác: Dùng phím <strong>Mũi tên (⬆️ ⬇️ ⬅️ ➡️)</strong> hoặc nút ảo trên màn hình để cõng bạn di chuyển!
                    </div>

                    {/* Touch D-Pad */}
                    <div className="flex items-center justify-center gap-1.5 self-center">
                        <button
                            onClick={() => movePlayer(-1, 0)}
                            className="w-11 h-11 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 text-white rounded-xl flex items-center justify-center text-base font-black shadow transition border border-neutral-700"
                        >
                            ⬅️
                        </button>
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={() => movePlayer(0, -1)}
                                className="w-11 h-11 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 text-white rounded-xl flex items-center justify-center text-base font-black shadow transition border border-neutral-700"
                            >
                                ⬆️
                            </button>
                            <button
                                onClick={() => movePlayer(0, 1)}
                                className="w-11 h-11 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 text-white rounded-xl flex items-center justify-center text-base font-black shadow transition border border-neutral-700"
                            >
                                ⬇️
                            </button>
                        </div>
                        <button
                            onClick={() => movePlayer(1, 0)}
                            className="w-11 h-11 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-600 text-white rounded-xl flex items-center justify-center text-base font-black shadow transition border border-neutral-700"
                        >
                            ➡️
                        </button>
                    </div>

                    {/* Game Action Buttons */}
                    <div className="flex items-center gap-2">
                        {gameState === 'PLAYING' && (
                            <button
                                onClick={() => setGameState('PAUSED')}
                                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition flex items-center gap-1.5"
                            >
                                <Pause size={14} />
                                <span>Tạm dừng</span>
                            </button>
                        )}
                        <button
                            onClick={() => startGame(currentLevelIdx)}
                            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition flex items-center gap-1.5"
                        >
                            <RotateCcw size={14} />
                            <span>Làm mới</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PiggybackMazeModal;
