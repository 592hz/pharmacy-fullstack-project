import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, X, Trophy, RotateCcw, HelpCircle, Zap, Sparkles, RefreshCw } from 'lucide-react';

interface PillTangramModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Block Shape definition: 2D array of boolean (1 = cell, 0 = empty)
export interface BlockShape {
    id: string;
    matrix: number[][];
    color: string; // Tailwind gradient or hex color
    name: string;
}

const BLOCK_PALETTE = [
    { color: 'from-pink-500 to-rose-600', border: 'border-rose-300', glow: 'shadow-rose-500/40' },
    { color: 'from-amber-400 to-orange-500', border: 'border-amber-200', glow: 'shadow-amber-500/40' },
    { color: 'from-emerald-400 to-teal-600', border: 'border-emerald-200', glow: 'shadow-emerald-500/40' },
    { color: 'from-cyan-400 to-blue-600', border: 'border-cyan-200', glow: 'shadow-cyan-500/40' },
    { color: 'from-indigo-500 to-purple-600', border: 'border-indigo-200', glow: 'shadow-indigo-500/40' },
    { color: 'from-fuchsia-500 to-pink-600', border: 'border-fuchsia-200', glow: 'shadow-fuchsia-500/40' },
];

// List of Polyomino shapes (Pill blisters)
const PRESET_SHAPES: { matrix: number[][]; name: string }[] = [
    { name: 'Viên đơn', matrix: [[1]] },
    { name: 'Vỉ đôi ngang', matrix: [[1, 1]] },
    { name: 'Vỉ đôi dọc', matrix: [[1], [1]] },
    { name: 'Vỉ ba ngang', matrix: [[1, 1, 1]] },
    { name: 'Vỉ ba dọc', matrix: [[1], [1], [1]] },
    { name: 'Vỉ vuông 2x2', matrix: [[1, 1], [1, 1]] },
    { name: 'Vỉ góc L nhỏ', matrix: [[1, 0], [1, 1]] },
    { name: 'Vỉ góc L ngược', matrix: [[0, 1], [1, 1]] },
    { name: 'Vỉ chữ T', matrix: [[1, 1, 1], [0, 1, 0]] },
    { name: 'Vỉ chữ L 3x2', matrix: [[1, 0], [1, 0], [1, 1]] },
    { name: 'Vỉ Z ngẫu nhiên', matrix: [[1, 1, 0], [0, 1, 1]] },
    { name: 'Vỉ thanh 4', matrix: [[1, 1, 1, 1]] },
];

const GRID_SIZE = 8; // 8x8 Pill Box Grid
const LOCAL_STORAGE_BEST_SCORE = 'pill_tangram_best_score';

// Web Audio sound synthesizer for sound effects
const playSoundEffect = (type: 'place' | 'clear' | 'win' | 'lose' | 'rotate', isMuted: boolean) => {
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
        if (type === 'place') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'rotate') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === 'clear') {
            osc.type = 'triangle';
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.type = 'triangle';
                subOsc.frequency.setValueAtTime(freq, now + idx * 0.06);
                subGain.gain.setValueAtTime(0.3, now + idx * 0.06);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.start(now + idx * 0.06);
                subOsc.stop(now + idx * 0.06 + 0.2);
            });
        } else if (type === 'lose') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(70, now + 0.4);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch {
        // Fallback silently if web audio context is blocked
    }
};

// Rotate a 2D matrix 90 degrees clockwise
const rotateMatrix = (matrix: number[][]): number[][] => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotated[c][rows - 1 - r] = matrix[r][c];
        }
    }
    return rotated;
};

export const PillTangramModal: React.FC<PillTangramModalProps> = ({ isOpen, onClose }) => {
    // Grid State: 8x8 matrix storing cell colors or null if empty
    const [grid, setGrid] = useState<(string | null)[][]>(
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
    );

    // Available pieces tray (3 items)
    const [availablePieces, setAvailablePieces] = useState<(BlockShape | null)[]>([null, null, null]);
    const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);

    // Hover preview cell coords on grid
    const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null);

    // Score & Game Over state
    const [score, setScore] = useState<number>(0);
    const [bestScore, setBestScore] = useState<number>(0);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [showHelp, setShowHelp] = useState<boolean>(false);

    // Load Best Score
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_BEST_SCORE);
            if (saved) setBestScore(parseInt(saved, 10));
        } catch {
            // Default
        }
    }, []);

    // Save Best Score
    const updateScore = useCallback((pts: number) => {
        setScore((prev) => {
            const newScore = prev + pts;
            setBestScore((currentBest) => {
                if (newScore > currentBest) {
                    try {
                        localStorage.setItem(LOCAL_STORAGE_BEST_SCORE, newScore.toString());
                    } catch {
                        // Ignore
                    }
                    return newScore;
                }
                return currentBest;
            });
            return newScore;
        });
    }, []);

    // Generate a random piece
    const generatePiece = useCallback((): BlockShape => {
        const shapePreset = PRESET_SHAPES[Math.floor(Math.random() * PRESET_SHAPES.length)];
        const palette = BLOCK_PALETTE[Math.floor(Math.random() * BLOCK_PALETTE.length)];
        return {
            id: Math.random().toString(36).substr(2, 9),
            matrix: shapePreset.matrix,
            color: palette.color,
            name: shapePreset.name
        };
    }, []);

    // Check if a piece matrix can fit at (startRow, startCol) on the current grid
    const canPlacePiece = useCallback((
        matrix: number[][],
        startRow: number,
        startCol: number,
        currentGrid: (string | null)[][]
    ): boolean => {
        const rows = matrix.length;
        const cols = matrix[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (matrix[r][c] === 1) {
                    const targetR = startRow + r;
                    const targetC = startCol + c;

                    // Out of bounds
                    if (targetR < 0 || targetR >= GRID_SIZE || targetC < 0 || targetC >= GRID_SIZE) {
                        return false;
                    }
                    // Already occupied
                    if (currentGrid[targetR][targetC] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }, []);

    // Check if ANY available piece can be placed anywhere on the grid
    const checkCanMoveAnywhere = useCallback((
        pieces: (BlockShape | null)[],
        currentGrid: (string | null)[][]
    ): boolean => {
        const activePieces = pieces.filter(Boolean) as BlockShape[];
        if (activePieces.length === 0) return true; // Will spawn new pieces

        for (const piece of activePieces) {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (canPlacePiece(piece.matrix, r, c, currentGrid)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }, [canPlacePiece]);

    // Initialize Game
    const initGame = useCallback(() => {
        const emptyGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
        setGrid(emptyGrid);
        setScore(0);
        setIsGameOver(false);
        setSelectedPieceIndex(null);
        setHoverPos(null);

        const newPieces = [generatePiece(), generatePiece(), generatePiece()];
        setAvailablePieces(newPieces);
    }, [generatePiece]);

    // Auto initialize on modal open
    useEffect(() => {
        if (isOpen) {
            initGame();
        }
    }, [isOpen, initGame]);

    // Rotate selected piece in tray
    const handleRotatePiece = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (availablePieces[idx] === null) return;
        playSoundEffect('rotate', isMuted);

        const piece = availablePieces[idx]!;
        const rotatedMatrix = rotateMatrix(piece.matrix);

        const updatedPiece: BlockShape = {
            ...piece,
            matrix: rotatedMatrix
        };

        const updatedTray = [...availablePieces];
        updatedTray[idx] = updatedPiece;
        setAvailablePieces(updatedTray);

        // Check if rotated piece triggered game over
        if (!checkCanMoveAnywhere(updatedTray, grid)) {
            setIsGameOver(true);
            playSoundEffect('lose', isMuted);
        }
    };

    // Handle placing piece onto grid at (startRow, startCol)
    const handlePlacePiece = (startRow: number, startCol: number) => {
        if (selectedPieceIndex === null || isGameOver) return;
        const piece = availablePieces[selectedPieceIndex];
        if (!piece) return;

        if (!canPlacePiece(piece.matrix, startRow, startCol, grid)) {
            return; // Cannot place here
        }

        playSoundEffect('place', isMuted);

        // 1. Fill cells on grid
        const newGrid = grid.map((row) => [...row]);
        let cellsPlaced = 0;
        const rows = piece.matrix.length;
        const cols = piece.matrix[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (piece.matrix[r][c] === 1) {
                    newGrid[startRow + r][startCol + c] = piece.color;
                    cellsPlaced++;
                }
            }
        }

        // Award placement points
        updateScore(cellsPlaced * 10);

        // 2. Check full rows & columns to clear
        const rowsToClear: number[] = [];
        const colsToClear: number[] = [];

        // Check rows
        for (let r = 0; r < GRID_SIZE; r++) {
            if (newGrid[r].every((cell) => cell !== null)) {
                rowsToClear.push(r);
            }
        }
        // Check cols
        for (let c = 0; c < GRID_SIZE; c++) {
            let isFull = true;
            for (let r = 0; r < GRID_SIZE; r++) {
                if (newGrid[r][c] === null) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) colsToClear.push(c);
        }

        // Clear full lines
        if (rowsToClear.length > 0 || colsToClear.length > 0) {
            playSoundEffect('clear', isMuted);
            const totalLinesCleared = rowsToClear.length + colsToClear.length;
            updateScore(totalLinesCleared * 100 + (totalLinesCleared > 1 ? 150 : 0));

            // Clear cells
            rowsToClear.forEach((r) => {
                for (let c = 0; c < GRID_SIZE; c++) newGrid[r][c] = null;
            });
            colsToClear.forEach((c) => {
                for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = null;
            });
        }

        setGrid(newGrid);

        // 3. Remove piece from tray
        const newTray = [...availablePieces];
        newTray[selectedPieceIndex] = null;

        // Check if tray is empty -> spawn 3 new pieces
        const remainingPieces = newTray.filter(Boolean);
        if (remainingPieces.length === 0) {
            const nextTray = [generatePiece(), generatePiece(), generatePiece()];
            setAvailablePieces(nextTray);

            // Check game over on new tray
            if (!checkCanMoveAnywhere(nextTray, newGrid)) {
                setIsGameOver(true);
                playSoundEffect('lose', isMuted);
            }
        } else {
            setAvailablePieces(newTray);

            // Check game over on remaining pieces
            if (!checkCanMoveAnywhere(newTray, newGrid)) {
                setIsGameOver(true);
                playSoundEffect('lose', isMuted);
            }
        }

        setSelectedPieceIndex(null);
        setHoverPos(null);
    };

    if (!isOpen) return null;

    // Check if hover cell is valid placement preview
    const selectedPiece = selectedPieceIndex !== null ? availablePieces[selectedPieceIndex] : null;
    const isValidHover = selectedPiece && hoverPos
        ? canPlacePiece(selectedPiece.matrix, hoverPos.row, hoverPos.col, grid)
        : false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 flex items-center justify-between shadow-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner font-black">
                            💊
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                                Xếp Vỉ Thuốc Vào Hộp (Pill Tangram)
                            </h2>
                            <p className="text-[11px] text-white/90 font-semibold">
                                Xếp kín hàng & cột trong khay 8x8 để tích điểm số kỷ lục!
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowHelp(!showHelp)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                            title="Hướng dẫn chơi"
                        >
                            <HelpCircle size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                            title={isMuted ? 'Mở âm thanh' : 'Tắt âm thanh'}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition backdrop-blur-md"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Game Content Area */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3 overflow-y-auto">

                    {/* Instruction Help Box */}
                    {showHelp && (
                        <div className="bg-emerald-950/90 border border-emerald-500/40 p-3 rounded-2xl text-xs text-emerald-200 space-y-1 animate-fadeIn shrink-0">
                            <h4 className="font-extrabold text-emerald-100 flex items-center gap-1.5 text-sm">
                                💡 Hướng dẫn chơi Pill Tangram:
                            </h4>
                            <p>• Nhấp chọn vỉ thuốc ở khay dưới, nhấp nút 🔄 để xoay vỉ thuốc nếu muốn.</p>
                            <p>• Nhấp vào khay 8x8 để đặt vỉ thuốc vào vị trí trống.</p>
                            <p>• Khi lấp đầy 1 Hàng hoặc 1 Cột ➡️ Hàng/Cột đó sẽ tự động tan biến và cộng điểm thưởng!</p>
                        </div>
                    )}

                    {/* Dashboard Bar: Score & Best Score */}
                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-4">
                            {/* Current Score */}
                            <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-700">
                                <Sparkles size={16} className="text-amber-400 animate-spin-slow" />
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm số:</div>
                                    <div className="font-mono text-lg sm:text-xl font-black text-amber-400 tracking-wide">
                                        {score}
                                    </div>
                                </div>
                            </div>

                            {/* Best Score */}
                            <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-700">
                                <Trophy size={16} className="text-emerald-400" />
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Kỷ lục:</div>
                                    <div className="font-mono text-lg sm:text-xl font-black text-emerald-400 tracking-wide">
                                        {bestScore}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={initGame}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 font-black text-xs text-white rounded-xl shadow transition flex items-center gap-1.5"
                        >
                            <RotateCcw size={14} />
                            <span>Chơi Lại</span>
                        </button>
                    </div>

                    {/* Game Over Banner */}
                    {isGameOver && (
                        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-3.5 rounded-2xl text-white shadow-xl flex items-center justify-between gap-3 border border-rose-400 animate-fadeIn shrink-0">
                            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                                <span className="text-xl">💀</span>
                                <span>KHÔNG CÒN VỊ TRÍ ĐẶT VỈ THUỐC! Điểm số: <b className="font-mono text-white text-base">{score}</b></span>
                            </div>
                            <button
                                type="button"
                                onClick={initGame}
                                className="px-4 py-2 bg-white text-rose-950 hover:bg-rose-50 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
                            >
                                <Zap size={15} className="text-rose-600" />
                                <span>Thử Lại 🚀</span>
                            </button>
                        </div>
                    )}

                    {/* Central 8x8 Pill Box Grid */}
                    <div className="flex items-center justify-center p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl shrink-0">
                        <div className="grid grid-cols-8 gap-1 sm:gap-1.5 max-w-md w-full aspect-square p-2 bg-slate-900 rounded-xl border border-slate-700/60 shadow-inner">
                            {grid.map((row, rIdx) =>
                                row.map((cellColor, cIdx) => {
                                    // Calculate if this cell is part of hover preview
                                    let isPreviewCell = false;
                                    if (selectedPiece && hoverPos) {
                                        const pr = rIdx - hoverPos.row;
                                        const pc = cIdx - hoverPos.col;
                                        if (
                                            pr >= 0 &&
                                            pr < selectedPiece.matrix.length &&
                                            pc >= 0 &&
                                            pc < selectedPiece.matrix[0].length
                                        ) {
                                            if (selectedPiece.matrix[pr][pc] === 1) {
                                                isPreviewCell = true;
                                            }
                                        }
                                    }

                                    return (
                                        <div
                                            key={`${rIdx}-${cIdx}`}
                                            onClick={() => handlePlacePiece(rIdx, cIdx)}
                                            onMouseEnter={() => setHoverPos({ row: rIdx, col: cIdx })}
                                            className={`aspect-square rounded-lg border flex items-center justify-center transition-all duration-100 cursor-pointer relative ${cellColor
                                                    ? `bg-gradient-to-br ${cellColor} border-white/40 shadow-md scale-100`
                                                    : isPreviewCell
                                                        ? isValidHover
                                                            ? 'bg-emerald-500/40 border-emerald-400 shadow-emerald-500/50 shadow-md scale-95'
                                                            : 'bg-rose-500/40 border-rose-400 shadow-rose-500/50 shadow-md scale-95'
                                                        : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            {cellColor && (
                                                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-white/30 border border-white/50 shadow-inner flex items-center justify-center">
                                                    <div className="w-1 h-1 rounded-full bg-white/80" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Bottom Pill Blister Tray (3 Piece Slots) */}
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 shrink-0">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                            {selectedPieceIndex !== null
                                ? '👇 Nhấp vào ô vuông trên khay 8x8 để đặt vỉ thuốc!'
                                : '👇 Nhấp chọn vỉ thuốc bên dưới để chuẩn bị xếp vào khay:'}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {availablePieces.map((piece, idx) => {
                                const isSelected = selectedPieceIndex === idx;

                                return (
                                    <div
                                        key={piece ? piece.id : `empty-${idx}`}
                                        onClick={() => {
                                            if (piece) setSelectedPieceIndex(isSelected ? null : idx);
                                        }}
                                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 min-h-[110px] transition-all duration-150 relative group ${!piece
                                                ? 'bg-slate-900/30 border-slate-800 opacity-30 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-slate-800 border-amber-400 shadow-amber-500/30 shadow-lg scale-105 cursor-pointer ring-2 ring-amber-400/50'
                                                    : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60 cursor-pointer'
                                            }`}
                                    >
                                        {piece ? (
                                            <>
                                                {/* Rotate button overlay */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRotatePiece(idx, e)}
                                                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg transition border border-slate-700 shadow z-10"
                                                    title="Xoay vỉ thuốc 90°"
                                                >
                                                    <RefreshCw size={13} />
                                                </button>

                                                {/* Piece Preview Matrix */}
                                                <div
                                                    className="grid gap-1"
                                                    style={{
                                                        gridTemplateColumns: `repeat(${piece.matrix[0].length}, minmax(0, 1fr))`
                                                    }}
                                                >
                                                    {piece.matrix.map((r, rIdx) =>
                                                        r.map((cell, cIdx) => (
                                                            <div
                                                                key={`${rIdx}-${cIdx}`}
                                                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border flex items-center justify-center transition ${cell === 1
                                                                        ? `bg-gradient-to-br ${piece.color} border-white/40 shadow-sm`
                                                                        : 'opacity-0'
                                                                    }`}
                                                            >
                                                                {cell === 1 && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                <span className="text-[10px] font-bold text-slate-400 mt-1">
                                                    {piece.name}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-600">Đã xếp</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer Bar */}
                <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 text-center text-[11px] text-slate-400 font-bold flex items-center justify-between shrink-0">
                    <span>💊 Game Xếp Vỉ Thuốc Tangram (Khay 8x8)</span>
                    <span>Tạo Chuỗi Ăn Điểm Nhân Đôi ✨</span>
                </div>

            </div>
        </div>
    );
};

export default PillTangramModal;
