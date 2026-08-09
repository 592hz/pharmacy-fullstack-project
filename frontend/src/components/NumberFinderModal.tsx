import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, X, Trophy, RotateCcw, HelpCircle, Zap, Timer, Award, CheckCircle2 } from 'lucide-react';

interface NumberFinderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type MaxNumberMode = 25 | 50 | 100;

const LOCAL_STORAGE_BEST_TIMES = 'schulte_number_finder_best_times';

const GRID_SIZE_LABEL: Record<MaxNumberMode, string> = {
    25: '30 giây',
    50: '1 phút 15s',
    100: '3 phút'
};

const TIME_LIMITS_MS: Record<MaxNumberMode, number> = {
    25: 30 * 1000,
    50: 75 * 1000,
    100: 180 * 1000
};

// Web Audio sound synthesizer for sound effects
const playSoundEffect = (type: 'correct' | 'wrong' | 'win' | 'lose', isMuted: boolean) => {
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
        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(140, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'lose') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.4);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'win') {
            osc.type = 'triangle';
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.type = 'triangle';
                subOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
                subGain.gain.setValueAtTime(0.25, now + idx * 0.1);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.start(now + idx * 0.1);
                subOsc.stop(now + idx * 0.1 + 0.25);
            });
        }
    } catch {
        // Fallback silently if web audio context is blocked
    }
};

export const NumberFinderModal: React.FC<NumberFinderModalProps> = ({ isOpen, onClose }) => {
    const [maxNumber, setMaxNumber] = useState<MaxNumberMode>(100);
    const [numbers, setNumbers] = useState<number[]>([]);
    const [currentTarget, setCurrentTarget] = useState<number>(1);
    const [foundNumbers, setFoundNumbers] = useState<Set<number>>(new Set());
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [gameOverReason, setGameOverReason] = useState<'mistakes' | 'timeout' | null>(null);
    const [wrongCount, setWrongCount] = useState<number>(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [showHelp, setShowHelp] = useState<boolean>(false);
    const [wrongClickId, setWrongClickId] = useState<number | null>(null);

    // Timer states
    const [elapsedMs, setElapsedMs] = useState<number>(0);
    const [bestTimes, setBestTimes] = useState<Record<MaxNumberMode, number | null>>({
        25: null,
        50: null,
        100: null
    });

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load best times from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_BEST_TIMES);
            if (saved) {
                setBestTimes(JSON.parse(saved));
            }
        } catch {
            // Fallback default
        }
    }, []);

    // Save best time
    const saveBestTime = useCallback((mode: MaxNumberMode, timeInMs: number) => {
        setBestTimes((prev) => {
            const currentBest = prev[mode];
            if (currentBest === null || timeInMs < currentBest) {
                const updated = { ...prev, [mode]: timeInMs };
                try {
                    localStorage.setItem(LOCAL_STORAGE_BEST_TIMES, JSON.stringify(updated));
                } catch {
                    // Ignore storage errors
                }
                return updated;
            }
            return prev;
        });
    }, []);

    // Initialize board
    const initGame = useCallback((mode: MaxNumberMode = maxNumber) => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;

        const arr = Array.from({ length: mode }, (_, i) => i + 1);
        // Fisher-Yates Shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        setNumbers(arr);
        setCurrentTarget(1);
        setFoundNumbers(new Set());
        setWrongCount(0);
        setIsGameStarted(false);
        setIsCompleted(false);
        setIsGameOver(false);
        setGameOverReason(null);
        setElapsedMs(0);
    }, [maxNumber]);

    // Handle mode switch
    const changeMode = (mode: MaxNumberMode) => {
        setMaxNumber(mode);
        initGame(mode);
    };

    // Auto initialize on open
    useEffect(() => {
        if (isOpen) {
            initGame(maxNumber);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [isOpen, maxNumber, initGame]);

    // Time Limit for current mode
    const currentLimitMs = TIME_LIMITS_MS[maxNumber];
    const remainingMs = Math.max(0, currentLimitMs - elapsedMs);

    // Stopwatch & Countdown Timer handler
    useEffect(() => {
        if (isGameStarted && !isCompleted && !isGameOver) {
            const startTime = Date.now() - elapsedMs;
            timerRef.current = setInterval(() => {
                const newElapsed = Date.now() - startTime;
                if (newElapsed >= currentLimitMs) {
                    setElapsedMs(currentLimitMs);
                    setIsGameOver(true);
                    setGameOverReason('timeout');
                    playSoundEffect('lose', isMuted);
                    if (timerRef.current) clearInterval(timerRef.current);
                } else {
                    setElapsedMs(newElapsed);
                }
            }, 30);

            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [isGameStarted, isCompleted, isGameOver, elapsedMs, currentLimitMs, isMuted]);

    // Number Click Handler
    const handleNumberClick = (num: number) => {
        if (isCompleted || isGameOver) return;

        // Auto start timer on first click
        if (!isGameStarted) {
            setIsGameStarted(true);
        }

        if (num === currentTarget) {
            playSoundEffect('correct', isMuted);
            const newFound = new Set(foundNumbers);
            newFound.add(num);
            setFoundNumbers(newFound);

            if (num === maxNumber) {
                // Game Completed!
                setIsCompleted(true);
                playSoundEffect('win', isMuted);
                const finalTime = elapsedMs;
                saveBestTime(maxNumber, finalTime);
            } else {
                setCurrentTarget((prev) => prev + 1);
            }
        } else {
            // Wrong click logic (Max 2 mistakes allowed!)
            const newWrongCount = wrongCount + 1;
            setWrongCount(newWrongCount);
            setWrongClickId(num);

            if (newWrongCount > 2) {
                // Over 2 mistakes => GAME OVER / THUA!
                setIsGameOver(true);
                setGameOverReason('mistakes');
                playSoundEffect('lose', isMuted);
            } else {
                playSoundEffect('wrong', isMuted);
                setElapsedMs((prev) => prev + 1000); // 1-second penalty (reduces remaining countdown time)
            }

            setTimeout(() => setWrongClickId(null), 400);
        }
    };

    if (!isOpen) return null;

    // Helper format timer (e.g. 01:23.45)
    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const hundredths = Math.floor((ms % 1000) / 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
    };

    // Calculate grid layout based on mode
    const getGridCols = () => {
        if (maxNumber === 25) return 'grid-cols-5 gap-2 sm:gap-3';
        if (maxNumber === 50) return 'grid-cols-10 gap-1 sm:gap-2';
        return 'grid-cols-10 gap-1 sm:gap-1.5'; // 10x10 grid for 100 numbers
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-3 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[94vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between shadow-md shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner font-black">
                            🔢
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
                                Thử Thách Tìm Số Tốc Độ (Schulte Table)
                            </h2>
                            <p className="text-[10px] sm:text-xs text-white/80 font-semibold">
                                Mức 1..{maxNumber}: Giới hạn <b>{GRID_SIZE_LABEL[maxNumber]}</b> - Sai quá 2 lần là THUA!
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
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

                {/* Main Content Area (Compact Single Screen) */}
                <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between space-y-2 min-h-0 overflow-hidden">

                    {/* Instruction Alert Popup */}
                    {showHelp && (
                        <div className="bg-amber-950/90 border border-amber-500/40 p-2.5 rounded-xl text-xs text-amber-200 space-y-1 animate-fadeIn shrink-0">
                            <h4 className="font-extrabold text-amber-100 flex items-center gap-1.5 text-xs">
                                💡 Luật chơi Schulte Chuyên Nghiệp:
                            </h4>
                            <p>• Nhấp chọn các số theo thứ tự tăng dần từ <b>1 đến {maxNumber}</b>.</p>
                            <p>• <b>Thời gian có hạn:</b> Mức 25 (30s), Mức 50 (75s), Mức 100 (3 phút)!</p>
                            <p>• Chỉ được phép chọn sai tối đa <b>2 lần</b>. Lần sai thứ 3 hoặc hết giờ sẽ bị <b>THUA (Game Over)</b>!</p>
                        </div>
                    )}

                    {/* Mode Selector & Control Panel */}
                    <div className="bg-slate-800/80 p-2 sm:p-2.5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
                        {/* Mode buttons */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 hidden sm:inline">Cấp độ:</span>
                            {([25, 50, 100] as MaxNumberMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => changeMode(mode)}
                                    className={`px-2.5 py-1 rounded-lg font-black text-xs transition border flex items-center gap-1 ${maxNumber === mode
                                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                                            : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700'
                                        }`}
                                >
                                    <span>1..{mode}</span>
                                    <span className="text-[9px] opacity-75">({GRID_SIZE_LABEL[mode]})</span>
                                </button>
                            ))}
                        </div>

                        {/* Mistakes counter & Countdown Timer Display */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Mistakes counter */}
                            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-700">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Lỗi sai:</span>
                                <span className={`font-mono text-xs sm:text-sm font-black px-2 py-0.5 rounded-md ${wrongCount > 2
                                        ? 'bg-rose-600 text-white'
                                        : wrongCount === 2
                                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                                            : 'bg-slate-800 text-emerald-400'
                                    }`}>
                                    {wrongCount} / 2 ❌
                                </span>
                            </div>

                            {/* Remaining Countdown Timer */}
                            <div className={`flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border ${remainingMs <= 10000 && isGameStarted
                                    ? 'border-rose-500/80 animate-pulse'
                                    : 'border-slate-700'
                                }`}>
                                <Timer size={16} className={remainingMs <= 10000 && isGameStarted ? 'text-rose-400 animate-spin' : 'text-cyan-400 animate-spin-slow'} />
                                <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">Còn lại:</span>
                                <span className={`font-mono text-sm sm:text-base font-black tracking-wider ${remainingMs <= 10000 && isGameStarted
                                        ? 'text-rose-400'
                                        : 'text-cyan-300'
                                    }`}>
                                    {formatTime(remainingMs)}
                                </span>
                            </div>
                        </div>

                        {/* Reset & High Score */}
                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-bold text-amber-400">
                                <Trophy size={13} className="text-amber-400" />
                                <span className="text-slate-100 font-mono font-black text-xs">
                                    {bestTimes[maxNumber] !== null ? formatTime(bestTimes[maxNumber]!) : '--:--'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => initGame(maxNumber)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 font-black text-xs text-white rounded-lg shadow transition flex items-center gap-1"
                            >
                                <RotateCcw size={13} />
                                <span>Làm Mới</span>
                            </button>
                        </div>
                    </div>

                    {/* Completion Victory Banner */}
                    {isCompleted && (
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-3 rounded-xl text-white shadow-xl flex items-center justify-between gap-3 border border-emerald-400 animate-fadeIn shrink-0">
                            <div className="flex items-center gap-2 text-yellow-300 font-black text-xs sm:text-sm">
                                <Award size={18} />
                                <span>HOÀN THÀNH MỨC {maxNumber} TRONG: <b className="font-mono text-white">{formatTime(elapsedMs)}</b></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => initGame(maxNumber)}
                                className="px-3 py-1 bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs rounded-lg shadow transition flex items-center gap-1"
                            >
                                <Zap size={14} className="text-emerald-600" />
                                <span>Chơi Tiếp 🚀</span>
                            </button>
                        </div>
                    )}

                    {/* Game Over Defeat Banner */}
                    {isGameOver && (
                        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-3 rounded-xl text-white shadow-xl flex items-center justify-between gap-3 border border-rose-400 animate-fadeIn shrink-0">
                            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                                <span className="text-lg">💀</span>
                                <span>
                                    {gameOverReason === 'timeout'
                                        ? `HẾT GIỜ! Bạn chưa tìm xong bảng 1..${maxNumber} trong thời gian cho phép (${GRID_SIZE_LABEL[maxNumber]}).`
                                        : `BẠN ĐÃ THUA! Chọn sai ${wrongCount} lần (quá 2 lần cho phép).`}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => initGame(maxNumber)}
                                className="px-3 py-1 bg-white text-rose-950 hover:bg-rose-50 font-black text-xs rounded-lg shadow transition flex items-center gap-1 shrink-0"
                            >
                                <RotateCcw size={14} className="text-rose-600" />
                                <span>Thử Lại 🔄</span>
                            </button>
                        </div>
                    )}

                    {/* The 1..N Number Grid (Pure Self Search - No Guidance) */}
                    <div className={`grid ${getGridCols()} flex-1 min-h-0 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl`}>
                        {numbers.map((num) => {
                            const isFound = foundNumbers.has(num);
                            const isWrong = wrongClickId === num;

                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleNumberClick(num)}
                                    disabled={isFound || isCompleted || isGameOver}
                                    className={`h-full min-h-0 w-full rounded-lg font-black text-xs sm:text-sm lg:text-base transition-all duration-100 flex items-center justify-center select-none shadow-sm ${isFound
                                            ? 'bg-slate-900/40 text-slate-700 border border-slate-850 cursor-not-allowed scale-95 opacity-30'
                                            : isWrong
                                                ? 'bg-rose-600 text-white border-2 border-rose-400 animate-shake scale-105'
                                                : isGameOver
                                                    ? 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-amber-400/50 hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    {isFound ? (
                                        <CheckCircle2 size={14} className="text-slate-600" />
                                    ) : (
                                        <span>{num}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                </div>

                {/* Footer Bar */}
                <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-center text-[11px] text-slate-400 font-bold flex items-center justify-between shrink-0">
                    <span>⚡ Bảng Schulte: Chọn Sai Quá 2 Lần Là Thua</span>
                    <span>Tiến độ: {foundNumbers.size} / {maxNumber}</span>
                </div>

            </div>
        </div>
    );
};

export default NumberFinderModal;
