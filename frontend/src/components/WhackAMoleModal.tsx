import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, X, Trophy, RotateCcw, HelpCircle, Timer, Award, Pause, Play, Sparkles, Flame } from 'lucide-react';

interface WhackAMoleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Difficulty = 'easy' | 'normal' | 'hard';

type ItemType = 'mole' | 'cat' | 'bunny' | 'bomb' | 'magicPill';

interface ItemConfig {
    type: ItemType;
    emoji: string;
    name: string;
    points: number;
    timeBonus: number; // in seconds
    weight: number;    // probability weight
    bgGradient: string;
    borderColor: string;
}

const ITEMS: Record<ItemType, ItemConfig> = {
    mole: {
        type: 'mole',
        emoji: '🍀',
        name: 'Cỏ 4 Lá May Mắn',
        points: 10,
        timeBonus: 0,
        weight: 50,
        bgGradient: 'from-emerald-400 to-green-600',
        borderColor: 'border-emerald-300'
    },
    cat: {
        type: 'cat',
        emoji: '💎',
        name: 'Kim Cương Báu Vật',
        points: 30,
        timeBonus: 2,
        weight: 18,
        bgGradient: 'from-cyan-300 to-blue-500',
        borderColor: 'border-cyan-200'
    },
    bunny: {
        type: 'bunny',
        emoji: '🌟',
        name: 'Ngôi Sao May Mắn',
        points: 20,
        timeBonus: 0,
        weight: 20,
        bgGradient: 'from-yellow-300 to-amber-500',
        borderColor: 'border-yellow-200'
    },
    bomb: {
        type: 'bomb',
        emoji: '💣',
        name: 'Quả Bom Độc',
        points: -25,
        timeBonus: -3,
        weight: 8,
        bgGradient: 'from-rose-600 to-slate-900',
        borderColor: 'border-rose-500'
    },
    magicPill: {
        type: 'magicPill',
        emoji: '🌈',
        name: 'Cầu Vồng May Mắn',
        points: 50,
        timeBonus: 3,
        weight: 4,
        bgGradient: 'from-purple-400 via-pink-400 to-amber-400',
        borderColor: 'border-pink-300'
    }
};

const LOCAL_STORAGE_BEST_SCORE = 'whack_a_mole_best_score';

// Sound Synthesizer using Web Audio API
const playSoundEffect = (type: 'whack' | 'bonus' | 'bomb' | 'win' | 'lose', isMuted: boolean) => {
    if (isMuted) return;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (type === 'whack') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'bonus') {
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(freq, now + idx * 0.05);
                subGain.gain.setValueAtTime(0.2, now + idx * 0.05);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.start(now + idx * 0.05);
                subOsc.stop(now + idx * 0.05 + 0.15);
            });
        } else if (type === 'bomb') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.3);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'win') {
            [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.type = 'triangle';
                subOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
                subGain.gain.setValueAtTime(0.25, now + idx * 0.1);
                subGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.2);
                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.start(now + idx * 0.1);
                subOsc.stop(now + idx * 0.1 + 0.2);
            });
        } else if (type === 'lose') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.5);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    } catch {
        // Fallback silently if audio context is blocked
    }
};

interface FloatingText {
    id: number;
    text: string;
    color: string;
    x: number;
    y: number;
}

export const WhackAMoleModal: React.FC<WhackAMoleModalProps> = ({ isOpen, onClose }) => {
    const [score, setScore] = useState<number>(0);
    const [bestScore, setBestScore] = useState<number>(0);
    const [combo, setCombo] = useState<number>(0);
    const [maxCombo, setMaxCombo] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(30); // 30 seconds game round
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [showHelp, setShowHelp] = useState<boolean>(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [gridCount, setGridCount] = useState<9 | 12>(9);

    // Active item per hole index (null if hole empty)
    const [activeItems, setActiveItems] = useState<(ItemType | null)[]>(Array(12).fill(null));
    const [whackedHoles, setWhackedHoles] = useState<Record<number, boolean>>({});
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [hammerPos, setHammerPos] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

    const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load best score
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_BEST_SCORE);
            if (saved) setBestScore(parseInt(saved, 10));
        } catch {
            // Ignore storage errors
        }
    }, []);

    // Save best score
    const updateBestScore = useCallback((newScore: number) => {
        setBestScore((prev) => {
            if (newScore > prev) {
                try {
                    localStorage.setItem(LOCAL_STORAGE_BEST_SCORE, newScore.toString());
                } catch {
                    // Ignore storage errors
                }
                return newScore;
            }
            return prev;
        });
    }, []);

    // Random item generator based on weighted probability
    const getRandomItemType = useCallback((): ItemType => {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const itemKey of Object.keys(ITEMS) as ItemType[]) {
            cumulative += ITEMS[itemKey].weight;
            if (rand <= cumulative) return itemKey;
        }
        return 'mole';
    }, []);

    // Initialize/Reset Game
    const initGame = useCallback(() => {
        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);

        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setTimeLeft(30);
        setIsGameStarted(false);
        setIsPaused(false);
        setIsGameOver(false);
        setActiveItems(Array(gridCount).fill(null));
        setWhackedHoles({});
        setFloatingTexts([]);
    }, [gridCount]);

    // Handle mode changes
    useEffect(() => {
        if (isOpen) {
            initGame();
        } else {
            if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        }
    }, [isOpen, initGame]);

    // Countdown Timer logic
    useEffect(() => {
        if (isGameStarted && !isPaused && !isGameOver) {
            gameTimerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
                        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
                        setIsGameOver(true);
                        playSoundEffect('win', isMuted);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            };
        }
    }, [isGameStarted, isPaused, isGameOver, isMuted]);

    // Mole Spawning Interval logic based on difficulty (Adjusted for slower, relaxed pace)
    useEffect(() => {
        if (isGameStarted && !isPaused && !isGameOver) {
            const spawnInterval = difficulty === 'easy' ? 1500 : difficulty === 'normal' ? 1100 : 750;
            const stayDuration = difficulty === 'easy' ? 2500 : difficulty === 'normal' ? 1800 : 1200;

            spawnTimerRef.current = setInterval(() => {
                setActiveItems((prev) => {
                    const availableHoles: number[] = [];
                    for (let i = 0; i < gridCount; i++) {
                        if (!prev[i]) availableHoles.push(i);
                    }
                    if (availableHoles.length === 0) return prev;

                    // Pick 1 or 2 random holes to popup
                    const countToSpawn = Math.random() > 0.65 ? 2 : 1;
                    const next = [...prev];

                    for (let c = 0; c < countToSpawn; c++) {
                        if (availableHoles.length === 0) break;
                        const randomIndexIdx = Math.floor(Math.random() * availableHoles.length);
                        const holeIdx = availableHoles.splice(randomIndexIdx, 1)[0];
                        const itemType = getRandomItemType();
                        next[holeIdx] = itemType;

                        // Auto hide after stayDuration
                        setTimeout(() => {
                            setActiveItems((current) => {
                                if (current[holeIdx] === itemType) {
                                    const updated = [...current];
                                    updated[holeIdx] = null;
                                    return updated;
                                }
                                return current;
                            });
                        }, stayDuration);
                    }

                    return next;
                });
            }, spawnInterval);

            return () => {
                if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
            };
        }
    }, [isGameStarted, isPaused, isGameOver, difficulty, gridCount, getRandomItemType]);

    // Whack Handler
    const handleWhack = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
        if (isGameOver || isPaused) return;

        // Auto start game on first click
        if (!isGameStarted) {
            setIsGameStarted(true);
        }

        const currentItem = activeItems[index];
        const rect = e.currentTarget.getBoundingClientRect();
        const popupX = rect.left + rect.width / 2;
        const popupY = rect.top;

        // Trigger Hammer Strike animation
        setHammerPos({ x: e.clientX, y: e.clientY, active: true });
        setTimeout(() => setHammerPos((prev) => ({ ...prev, active: false })), 200);

        if (currentItem && !whackedHoles[index]) {
            const itemConfig = ITEMS[currentItem];
            const isMultiplierActive = combo >= 5;
            const multiplier = isMultiplierActive ? 2 : 1;
            const ptsGained = itemConfig.points * multiplier;

            // Mark hole as whacked
            setWhackedHoles((prev) => ({ ...prev, [index]: true }));
            setTimeout(() => {
                setWhackedHoles((prev) => ({ ...prev, [index]: false }));
                setActiveItems((prev) => {
                    const copy = [...prev];
                    copy[index] = null;
                    return copy;
                });
            }, 250);

            // Update combo & score
            if (currentItem === 'bomb') {
                playSoundEffect('bomb', isMuted);
                setCombo(0);
                setScore((prev) => Math.max(0, prev + ptsGained));
                if (itemConfig.timeBonus < 0) {
                    setTimeLeft((prev) => Math.max(0, prev + itemConfig.timeBonus));
                }
                addFloatingText(`${ptsGained} Pts 💣`, 'text-rose-400', popupX, popupY);
            } else {
                playSoundEffect(currentItem === 'magicPill' || currentItem === 'cat' ? 'bonus' : 'whack', isMuted);
                const newCombo = combo + 1;
                setCombo(newCombo);
                setMaxCombo((prev) => Math.max(prev, newCombo));

                setScore((prev) => {
                    const newScore = Math.max(0, prev + ptsGained);
                    updateBestScore(newScore);
                    return newScore;
                });

                if (itemConfig.timeBonus > 0) {
                    setTimeLeft((prev) => prev + itemConfig.timeBonus);
                }

                const comboLabel = newCombo >= 5 ? ' 🔥 2X COMBO!' : newCombo > 1 ? ` (${newCombo}x)` : '';
                addFloatingText(`+${ptsGained}${comboLabel}`, itemConfig.type === 'magicPill' ? 'text-emerald-300' : 'text-amber-300', popupX, popupY);
            }
        } else {
            // Missed click
            setCombo(0);
        }
    };

    const addFloatingText = (text: string, color: string, x: number, y: number) => {
        const id = Date.now() + Math.random();
        setFloatingTexts((prev) => [...prev.slice(-8), { id, text, color, x, y }]);
        setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-fadeIn select-none">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 px-4 py-2.5 flex items-center justify-between shadow-md shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner font-black">
                            🔨
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
                                Thử Thách Biểu Tượng May Mắn (Lucky Collector)
                            </h2>
                            <p className="text-[10px] sm:text-xs text-white/80 font-semibold">
                                Thu thập Cỏ 4 Lá, Ngôi Sao, Kim Cương - Né Bom Độc - Tích điểm Kỷ Lục!
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {!isGameOver && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isGameStarted) setIsGameStarted(true);
                                    setIsPaused(!isPaused);
                                }}
                                className={`p-1.5 rounded-lg transition backdrop-blur-md ${
                                    isPaused
                                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-bold'
                                        : 'bg-amber-500/30 text-amber-100 hover:bg-amber-500/50 border border-amber-300/40'
                                }`}
                                title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                            >
                                {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowHelp(!showHelp)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                            title="Hướng dẫn chơi"
                        >
                            <HelpCircle size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                            title={isMuted ? 'Mở âm thanh' : 'Tắt âm thanh'}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500 text-white transition backdrop-blur-md"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Main Content Body */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3 min-h-0 overflow-hidden relative">

                    {/* Instruction Alert Popup */}
                    {showHelp && (
                        <div className="bg-amber-950/90 border border-amber-500/40 p-3 rounded-2xl text-xs text-amber-200 space-y-1.5 animate-fadeIn shrink-0 shadow-2xl">
                            <h4 className="font-extrabold text-amber-100 flex items-center gap-1.5 text-xs sm:text-sm">
                                💡 Quy tắc thu thập Biểu Tượng May Mắn:
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 flex items-center gap-2">
                                    <span className="text-xl">🍀</span>
                                    <div><b>Cỏ 4 Lá:</b> +10d</div>
                                </div>
                                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 flex items-center gap-2">
                                    <span className="text-xl">🌟</span>
                                    <div><b>Ngôi Sao:</b> +20d</div>
                                </div>
                                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 flex items-center gap-2">
                                    <span className="text-xl">💎</span>
                                    <div><b>Kim Cương:</b> +30d & +2s</div>
                                </div>
                                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 flex items-center gap-2">
                                    <span className="text-xl">🌈</span>
                                    <div><b>Cầu Vồng:</b> +50d & +3s</div>
                                </div>
                                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 flex items-center gap-2">
                                    <span className="text-xl">💣</span>
                                    <div className="text-rose-300"><b>Bom độc:</b> -25d & -3s</div>
                                </div>
                            </div>
                            <p className="text-[11px] text-amber-300/90 pt-1">
                                🔥 <b>Mẹo Combo:</b> Thu thập liên tiếp không hụt 5 lần để nhận hiệu ứng <b>x2 ĐIỂM COMBO!</b>
                            </p>
                        </div>
                    )}

                    {/* Control Toolbar */}
                    <div className="bg-slate-800/80 p-2.5 sm:p-3 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        {/* Difficulty & Grid Options */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                                {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => {
                                            setDifficulty(d);
                                            initGame();
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition capitalize ${
                                            difficulty === d
                                                ? 'bg-amber-500 text-slate-950 shadow-md'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {d === 'easy' ? 'Dễ 🌱' : d === 'normal' ? 'Vừa ⚡' : 'Khó 🚀'}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setGridCount(gridCount === 9 ? 12 : 9);
                                    initGame();
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                            >
                                🎯 {gridCount} Ô
                            </button>
                        </div>

                        {/* Stats Panel (Score, Combo, Timer) */}
                        <div className="flex items-center gap-3">
                            {/* Score Display */}
                            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Điểm:</span>
                                <span className="font-mono text-base font-black text-amber-400">
                                    {score}
                                </span>
                            </div>

                            {/* Combo Display */}
                            {combo > 1 && (
                                <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-2.5 py-1 rounded-xl font-black text-xs animate-bounce shadow-md">
                                    <Flame size={14} fill="currentColor" />
                                    <span>{combo}x Combo! {combo >= 5 ? '🔥 2X' : ''}</span>
                                </div>
                            )}

                            {/* Timer Display */}
                            <div className={`flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border ${
                                timeLeft <= 8 && isGameStarted
                                    ? 'border-rose-500 text-rose-400 animate-pulse'
                                    : 'border-cyan-500/40 text-cyan-300'
                            }`}>
                                <Timer size={16} className={timeLeft <= 8 && isGameStarted ? 'animate-spin text-rose-400' : ''} />
                                <span className="font-mono text-base font-black tracking-wider">
                                    {timeLeft}s
                                </span>
                            </div>
                        </div>

                        {/* Pause, Reset & High Score */}
                        <div className="flex items-center gap-2">
                            {!isGameOver && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isGameStarted) setIsGameStarted(true);
                                        setIsPaused(!isPaused);
                                    }}
                                    className={`px-3 py-1.5 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 ${
                                        isPaused
                                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 animate-pulse'
                                            : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/50'
                                    }`}
                                >
                                    {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
                                    <span>{isPaused ? 'Tiếp Tục' : 'Tạm Dừng'}</span>
                                </button>
                            )}

                            <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-amber-400 font-bold text-xs">
                                <Trophy size={14} />
                                <span className="font-mono text-xs font-black text-slate-100">{bestScore}</span>
                            </div>

                            <button
                                type="button"
                                onClick={initGame}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 font-black text-xs text-white rounded-xl shadow transition flex items-center gap-1"
                            >
                                <RotateCcw size={14} />
                                <span>Chơi Lại</span>
                            </button>
                        </div>
                    </div>

                    {/* Game Over Banner */}
                    {isGameOver && (
                        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-4 rounded-2xl text-white shadow-2xl flex items-center justify-between gap-4 border border-amber-400 animate-fadeIn shrink-0">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 font-black text-base sm:text-lg">
                                    <Award size={22} className="text-yellow-300" />
                                    <span>HẾT GIỜ! Tổng Điểm Của Bạn: <b className="font-mono text-yellow-300 text-xl">{score}</b></span>
                                </div>
                                <p className="text-xs text-white/90 font-semibold">
                                    🔥 Chuỗi Combo Cao Nhất: <b>{maxCombo}x</b> | Kỷ Lục Hiện Tại: <b>{bestScore} điểm</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={initGame}
                                className="px-4 py-2 bg-white text-slate-950 hover:bg-amber-50 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 shrink-0 hover:scale-105"
                            >
                                <Sparkles size={16} className="text-amber-600" />
                                <span>Đập Tiếp 🚀</span>
                            </button>
                        </div>
                    )}

                    {/* The Mole Garden Grid */}
                    <div className="relative flex-1 min-h-0 flex flex-col justify-center">

                        {/* Pause Overlay */}
                        {isPaused && (
                            <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center space-y-4 animate-fadeIn border border-slate-700/80 p-4">
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                                    <Pause size={36} />
                                </div>
                                <div className="text-center px-4">
                                    <h3 className="text-xl font-black text-white tracking-wide">TRÒ CHƠI ĐANG TẠM DỪNG</h3>
                                    <p className="text-xs text-slate-400 mt-1">Các biểu tượng may mắn đã tạm dừng xuất hiện.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPaused(false)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Play size={18} fill="currentColor" />
                                    <span>TIẾP TỤC CHƠI</span>
                                </button>
                            </div>
                        )}

                        {/* Holes Grid Container */}
                        <div className={`grid ${gridCount === 9 ? 'grid-cols-3 gap-3 sm:gap-4' : 'grid-cols-4 gap-2.5 sm:gap-3'} flex-1 min-h-0 p-3 bg-emerald-950/40 rounded-3xl border border-emerald-800/50 shadow-inner flex items-center`}>
                            {Array.from({ length: gridCount }).map((_, idx) => {
                                const currentItemType = activeItems[idx];
                                const isWhacked = whackedHoles[idx];
                                const itemConfig = currentItemType ? ITEMS[currentItemType] : null;

                                return (
                                    <div
                                        key={idx}
                                        className="relative h-full min-h-[90px] w-full rounded-2xl bg-slate-950/80 border-2 border-emerald-900/60 overflow-hidden flex items-end justify-center shadow-inner group cursor-pointer"
                                    >
                                        {/* Hole Mound Background */}
                                        <div className="absolute inset-x-2 bottom-0 h-1/3 bg-gradient-to-t from-amber-950 via-amber-900 to-amber-950/40 rounded-t-full border-t border-amber-700/50 shadow-md" />

                                        {/* Mole Pop Up Button */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleWhack(idx, e)}
                                            disabled={isGameOver || isPaused}
                                            className="w-full h-full relative flex items-end justify-center pb-2 focus:outline-none"
                                        >
                                            {itemConfig && (
                                                <div
                                                    className={`transition-all duration-300 transform flex flex-col items-center select-none ${
                                                        isWhacked
                                                            ? 'scale-125 rotate-12 opacity-80'
                                                            : 'scale-100 hover:scale-110 animate-pop-bounce'
                                                    }`}
                                                >
                                                    {/* Floating Badge Label */}
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-900/90 border ${itemConfig.borderColor} text-white shadow mb-0.5 whitespace-nowrap`}>
                                                        {itemConfig.type === 'bomb' ? '💣 -25' : `+${itemConfig.points}`}
                                                    </span>

                                                    {/* Emoji Character */}
                                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b ${itemConfig.bgGradient} border-2 ${itemConfig.borderColor} flex items-center justify-center text-3xl sm:text-4xl shadow-xl`}>
                                                        {isWhacked ? (itemConfig.type === 'bomb' ? '💥' : '😵') : itemConfig.emoji}
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Floating Scores popping up on click */}
                    {floatingTexts.map((t) => (
                        <div
                            key={t.id}
                            className={`fixed pointer-events-none font-black text-sm sm:text-base ${t.color} animate-pop-bounce z-50 drop-shadow-md`}
                            style={{ left: t.x - 20, top: t.y - 30 }}
                        >
                            {t.text}
                        </div>
                    ))}

                    {/* Striking Hammer Animated Visual Effect */}
                    {hammerPos.active && (
                        <div
                            className="fixed pointer-events-none text-4xl animate-bounce z-50 transition-transform duration-75 select-none"
                            style={{ left: hammerPos.x - 20, top: hammerPos.y - 30 }}
                        >
                            🔨
                        </div>
                    )}

                </div>

                {/* Footer Bar */}
                <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-center text-[11px] text-slate-400 font-bold flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-1 text-emerald-400">
                        <Sparkles size={12} />
                        <span>Game Thu Thập Biểu Tượng May Mắn - Tăng Phản Xạ & Xả Stress</span>
                    </span>
                    <span>Kỷ Lục: <b className="text-amber-400 font-mono">{bestScore} pts</b></span>
                </div>

            </div>
        </div>
    );
};

export default WhackAMoleModal;
