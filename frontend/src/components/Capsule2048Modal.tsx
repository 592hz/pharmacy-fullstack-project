import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, X, Trophy, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Undo2, Award } from 'lucide-react';

const TILE_INFO: Record<number, { name: string; icon: string; bg: string; text: string }> = {
    2: { name: 'Capsule C', icon: '💊', bg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300', text: 'text-rose-700 dark:text-rose-300' },
    4: { name: 'Vitamin C+', icon: '🍊', bg: 'bg-orange-100 dark:bg-orange-950/60 border-orange-300', text: 'text-orange-700 dark:text-orange-300' },
    8: { name: 'Vitamin B', icon: '🍌', bg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300', text: 'text-amber-700 dark:text-amber-300' },
    16: { name: 'Collagen', icon: '🌸', bg: 'bg-pink-100 dark:bg-pink-950/60 border-pink-300', text: 'text-pink-700 dark:text-pink-300' },
    32: { name: 'Omega 3', icon: '🐟', bg: 'bg-cyan-100 dark:bg-cyan-950/60 border-cyan-300', text: 'text-cyan-700 dark:text-cyan-300' },
    64: { name: 'Bio Herb', icon: '🌿', bg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300', text: 'text-emerald-700 dark:text-emerald-300' },
    128: { name: 'Biotin', icon: '💜', bg: 'bg-purple-100 dark:bg-purple-950/60 border-purple-300', text: 'text-purple-700 dark:text-purple-300' },
    256: { name: 'Multivitamin', icon: '⚡', bg: 'bg-yellow-200 dark:bg-yellow-900/60 border-yellow-400', text: 'text-yellow-800 dark:text-yellow-200' },
    512: { name: 'Royal Jelly', icon: '🌟', bg: 'bg-amber-300 dark:bg-amber-800/80 border-amber-500', text: 'text-amber-950 dark:text-amber-100' },
    1024: { name: 'Diamond Pill', icon: '💎', bg: 'bg-teal-300 dark:bg-teal-800/80 border-teal-500', text: 'text-teal-950 dark:text-teal-100' },
    2048: { name: 'Vua Dược Phẩm', icon: '👑', bg: 'bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 text-white border-yellow-400', text: 'text-white' },
};

// Sound synthesizer for 2048
const play2048Sound = (type: 'move' | 'merge' | 'win' | 'over', isMuted: boolean) => {
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

        if (type === 'move') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.05);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'merge') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.08);
            gain.gain.setValueAtTime(0.18, now);
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
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.setValueAtTime(160, now + 0.15);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch {
        // audio muted fallback
    }
};

export const Capsule2048Modal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const [grid, setGrid] = useState<number[][]>([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]);
    const [score, setScore] = useState<number>(0);
    const [highScore, setHighScore] = useState<number>(() => {
        try {
            return parseInt(localStorage.getItem('capsule_2048_highscore') || '0', 10);
        } catch {
            return 0;
        }
    });
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [isWon, setIsWon] = useState<boolean>(false);
    const [previousState, setPreviousState] = useState<{ grid: number[][]; score: number } | null>(null);

    // Add random tile (2 or 4) to empty spot
    const addRandomTile = useCallback((currentGrid: number[][]): number[][] => {
        const emptyCells: { r: number; c: number }[] = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentGrid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        if (emptyCells.length === 0) return currentGrid;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const newValue = Math.random() < 0.85 ? 2 : 4;

        const newGrid = currentGrid.map((row) => [...row]);
        newGrid[randomCell.r][randomCell.c] = newValue;
        return newGrid;
    }, []);

    // Initialize board
    const initGame = useCallback(() => {
        let newGrid = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        newGrid = addRandomTile(newGrid);
        newGrid = addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setIsGameOver(false);
        setIsWon(false);
        setPreviousState(null);
    }, [addRandomTile]);

    useEffect(() => {
        if (isOpen) {
            initGame();
        }
    }, [isOpen, initGame]);

    // Check game over
    const checkGameOver = (currentGrid: number[][]): boolean => {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentGrid[r][c] === 0) return false;
                if (c < 3 && currentGrid[r][c] === currentGrid[r][c + 1]) return false;
                if (r < 3 && currentGrid[r][c] === currentGrid[r + 1][c]) return false;
            }
        }
        return true;
    };

    // Move Logic
    const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (isGameOver) return;

        let hasMoved = false;
        let gainedScore = 0;

        // Clone current grid
        const newGrid = grid.map((r) => [...r]);

        // Helper to slide array left
        const slide = (row: number[]): { newRow: number[]; gained: number } => {
            const nonZeros = row.filter((val) => val !== 0);
            const result: number[] = [];
            let scoreGain = 0;

            for (let i = 0; i < nonZeros.length; i++) {
                if (i < nonZeros.length - 1 && nonZeros[i] === nonZeros[i + 1]) {
                    const mergedVal = nonZeros[i] * 2;
                    result.push(mergedVal);
                    scoreGain += mergedVal;
                    if (mergedVal === 2048) setIsWon(true);
                    i++; // skip next tile
                } else {
                    result.push(nonZeros[i]);
                }
            }

            while (result.length < 4) {
                result.push(0);
            }

            return { newRow: result, gained: scoreGain };
        };

        // Execute sliding based on direction
        if (direction === 'LEFT') {
            for (let r = 0; r < 4; r++) {
                const { newRow, gained } = slide(newGrid[r]);
                if (newRow.join(',') !== newGrid[r].join(',')) hasMoved = true;
                newGrid[r] = newRow;
                gainedScore += gained;
            }
        } else if (direction === 'RIGHT') {
            for (let r = 0; r < 4; r++) {
                const reversed = [...newGrid[r]].reverse();
                const { newRow, gained } = slide(reversed);
                const restored = newRow.reverse();
                if (restored.join(',') !== newGrid[r].join(',')) hasMoved = true;
                newGrid[r] = restored;
                gainedScore += gained;
            }
        } else if (direction === 'UP') {
            for (let c = 0; c < 4; c++) {
                const col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
                const { newRow, gained } = slide(col);
                if (newRow.join(',') !== col.join(',')) hasMoved = true;
                for (let r = 0; r < 4; r++) {
                    newGrid[r][c] = newRow[r];
                }
                gainedScore += gained;
            }
        } else if (direction === 'DOWN') {
            for (let c = 0; c < 4; c++) {
                const col = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
                const { newRow, gained } = slide(col);
                const restored = newRow.reverse();
                if (restored.join(',') !== [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]].join(',')) {
                    hasMoved = true;
                }
                for (let r = 0; r < 4; r++) {
                    newGrid[r][c] = restored[r];
                }
                gainedScore += gained;
            }
        }

        if (hasMoved) {
            // Save state for Undo
            setPreviousState({ grid: grid.map((r) => [...r]), score });

            const updatedGrid = addRandomTile(newGrid);
            setGrid(updatedGrid);

            const newScore = score + gainedScore;
            setScore(newScore);

            if (newScore > highScore) {
                setHighScore(newScore);
                try {
                    localStorage.setItem('capsule_2048_highscore', newScore.toString());
                } catch {
                    // ignore storage errors
                }
            }

            if (gainedScore > 0) {
                play2048Sound('merge', isMuted);
            } else {
                play2048Sound('move', isMuted);
            }

            if (checkGameOver(updatedGrid)) {
                setIsGameOver(true);
                play2048Sound('over', isMuted);
            }
        }
    }, [grid, score, highScore, isGameOver, isMuted, addRandomTile]);

    // Handle Keyboard Input
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'KeyW'].includes(e.code)) {
                e.preventDefault();
                move('UP');
            } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
                e.preventDefault();
                move('DOWN');
            } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
                e.preventDefault();
                move('LEFT');
            } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
                e.preventDefault();
                move('RIGHT');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, move]);

    // Undo action
    const handleUndo = () => {
        if (previousState) {
            setGrid(previousState.grid);
            setScore(previousState.score);
            setPreviousState(null);
            setIsGameOver(false);
            play2048Sound('move', isMuted);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none">
            <div className="relative w-full max-w-lg bg-pink-50/95 dark:bg-neutral-900 border-4 border-pink-300 dark:border-pink-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 p-3.5 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/40">
                            💊
                        </div>
                        <div>
                            <h2 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 drop-shadow-sm">
                                Ghép Viên Thuốc 2048
                            </h2>
                            <p className="text-[11px] opacity-90 font-medium">Capsule Merge • Relaxing Puzzle Game</p>
                        </div>
                    </div>

                    {/* Stats */}
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
                <div className="p-3 bg-pink-100/70 dark:bg-neutral-850 border-b border-pink-200 dark:border-neutral-800 flex items-center justify-between text-xs font-extrabold">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                        <Award size={15} className="text-amber-500" />
                        <span>Kỷ Lục Cao Nhất: <span className="font-black text-amber-600">{highScore}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!previousState}
                            onClick={handleUndo}
                            className={`p-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${previousState
                                ? 'bg-white dark:bg-neutral-700 text-rose-700 dark:text-rose-300 border-pink-300 shadow-sm hover:scale-105'
                                : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                        >
                            <Undo2 size={14} />
                            <span>Hoàn tác</span>
                        </button>

                        <button
                            type="button"
                            onClick={initGame}
                            className="p-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs transition shadow flex items-center gap-1"
                        >
                            <RotateCcw size={14} />
                            <span>Chơi lại</span>
                        </button>
                    </div>
                </div>

                {/* 2048 4x4 Grid Board */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center gap-4 overflow-y-auto">

                    <div className="relative p-3 bg-pink-200/60 dark:bg-neutral-800 border-4 border-pink-300 dark:border-neutral-700 rounded-3xl shadow-inner max-w-xs sm:max-w-sm w-full aspect-square grid grid-cols-4 gap-2.5">

                        {/* Cells */}
                        {grid.map((row, r) =>
                            row.map((val, c) => {
                                const info = TILE_INFO[val];
                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        className={`rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 font-black shadow-sm ${val === 0
                                            ? 'bg-white/40 dark:bg-neutral-900/40 border-pink-200/50 dark:border-neutral-700'
                                            : `${info?.bg || 'bg-rose-400 text-white'} animate-pop-bounce`
                                            }`}
                                    >
                                        {val > 0 && (
                                            <>
                                                <span className="text-2xl sm:text-3xl drop-shadow-sm">{info?.icon || '💊'}</span>
                                                <span className={`text-[10px] sm:text-xs font-black ${info?.text || 'text-white'}`}>
                                                    {val}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {/* Game Over Overlay */}
                        {isGameOver && (
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 text-white text-center animate-fadeIn z-20">
                                <span className="text-4xl mb-2">😿</span>
                                <h3 className="text-xl font-black mb-1">Hết Nước Đi Gòi!</h3>
                                <p className="text-xs opacity-90 mb-4">Điểm số lượt này: {score}</p>
                                <button
                                    type="button"
                                    onClick={initGame}
                                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs rounded-xl shadow-lg hover:scale-105 transition"
                                >
                                    Thử Lại Lượt Mới 🚀
                                </button>
                            </div>
                        )}

                        {/* Victory Overlay */}
                        {isWon && !isGameOver && (
                            <div className="absolute inset-0 bg-amber-500/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 text-white text-center animate-fadeIn z-20">
                                <span className="text-5xl mb-2 animate-bounce">👑</span>
                                <h3 className="text-2xl font-black mb-1">TẠO THÀNH CÔNG VUA DƯỢC PHẨM 2048!</h3>
                                <p className="text-xs opacity-90 mb-4">Bạn là bậc thầy ghép viên thuốc!</p>
                                <button
                                    type="button"
                                    onClick={() => setIsWon(false)}
                                    className="px-5 py-2.5 bg-white text-amber-900 font-black text-xs rounded-xl shadow-lg hover:scale-105 transition"
                                >
                                    Tiếp Tục Chơi Lấy Điểm Cao ✨
                                </button>
                            </div>
                        )}
                    </div>

                    {/* On-screen Directional Touch Controls */}
                    <div className="flex flex-col items-center gap-1 mt-1">
                        <button
                            type="button"
                            onClick={() => move('UP')}
                            className="p-3 bg-white dark:bg-neutral-800 hover:bg-pink-100 text-pink-600 rounded-2xl border border-pink-200 dark:border-neutral-700 shadow-md active:scale-95 transition"
                            title="Lên (Phím W / Mũi tên lên)"
                        >
                            <ArrowUp size={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => move('LEFT')}
                                className="p-3 bg-white dark:bg-neutral-800 hover:bg-pink-100 text-pink-600 rounded-2xl border border-pink-200 dark:border-neutral-700 shadow-md active:scale-95 transition"
                                title="Trái (Phím A / Mũi tên trái)"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => move('DOWN')}
                                className="p-3 bg-white dark:bg-neutral-800 hover:bg-pink-100 text-pink-600 rounded-2xl border border-pink-200 dark:border-neutral-700 shadow-md active:scale-95 transition"
                                title="Xuống (Phím S / Mũi tên xuống)"
                            >
                                <ArrowDown size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => move('RIGHT')}
                                className="p-3 bg-white dark:bg-neutral-800 hover:bg-pink-100 text-pink-600 rounded-2xl border border-pink-200 dark:border-neutral-700 shadow-md active:scale-95 transition"
                                title="Phải (Phím D / Mũi tên phải)"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-3 bg-pink-100/80 dark:bg-neutral-850 border-t border-pink-200 dark:border-neutral-800 text-center text-[11px] text-rose-800 dark:text-rose-400 font-bold">
                    💡 Dùng phím mũi tên ⬆️ ⬇️ ⬅️ ➡️ hoặc các nút bấm trên màn hình để di chuyển!
                </div>

            </div>
        </div>
    );
};

export default Capsule2048Modal;
