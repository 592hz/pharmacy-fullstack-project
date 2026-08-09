import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, X, Trophy, RotateCcw, Bot, User, HelpCircle, Swords, Award } from 'lucide-react';

type PlayerMark = 'X' | 'O';
type CellValue = PlayerMark | null;

interface Point {
    r: number;
    c: number;
}

const BOARD_SIZE = 12; // 12x12 Grid optimal for modal responsive layout

// Web Audio synthesizer for Caro sound effects
const playCaroSound = (type: 'move' | 'win', isMuted: boolean) => {
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
        if (type === 'win') {
            osc.type = 'sine';
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                osc.frequency.setValueAtTime(f, now + i * 0.08);
            });
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        }
    } catch {
        // audio fallback
    }
};

export const GomokuCaroModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    // Board state 12x12
    const [board, setBoard] = useState<CellValue[][]>(() =>
        Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    );
    const [turn, setTurn] = useState<PlayerMark>('X');
    const [lastMove, setLastMove] = useState<Point | null>(null);
    const [winningLine, setWinningLine] = useState<Point[] | null>(null);

    const [isVsAI, setIsVsAI] = useState<boolean>(true);
    const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [isAITinking, setIsAITinking] = useState<boolean>(false);
    const [blockTwoEndsRule, setBlockTwoEndsRule] = useState<boolean>(true); // Luật chặn 2 đầu

    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<PlayerMark | 'DRAW' | null>(null);

    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [showGuide, setShowGuide] = useState<boolean>(false);

    const [xWins, setXWins] = useState<number>(0);
    const [oWins, setOWins] = useState<number>(0);
    const [userHighWins, setUserHighWins] = useState<number>(() => {
        try {
            return parseInt(localStorage.getItem('caro_user_wins') || '0', 10);
        } catch {
            return 0;
        }
    });

    // Check for 5-in-a-row victory
    const checkWinCondition = useCallback((b: CellValue[][], r: number, c: number, mark: PlayerMark): Point[] | null => {
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Main Diagonal \
            { dr: 1, dc: -1 }  // Anti Diagonal /
        ];

        for (const { dr, dc } of directions) {
            const line: Point[] = [{ r, c }];

            // Forward scan
            let step = 1;
            while (true) {
                const nr = r + dr * step;
                const nc = c + dc * step;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === mark) {
                    line.push({ r: nr, c: nc });
                    step++;
                } else {
                    break;
                }
            }

            // Backward scan
            step = 1;
            while (true) {
                const nr = r - dr * step;
                const nc = c - dc * step;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === mark) {
                    line.push({ r: nr, c: nc });
                    step++;
                } else {
                    break;
                }
            }

            if (line.length >= 5) {
                // If blockTwoEndsRule is active, check if both ends are blocked by opponent
                if (blockTwoEndsRule) {
                    // Find min and max points in direction
                    line.sort((p1, p2) => (p1.r !== p2.r ? p1.r - p2.r : p1.c - p2.c));
                    const head = line[0];
                    const tail = line[line.length - 1];

                    const beforeHeadR = head.r - dr;
                    const beforeHeadC = head.c - dc;
                    const afterTailR = tail.r + dr;
                    const afterTailC = tail.c + dc;

                    const oppMark = mark === 'X' ? 'O' : 'X';

                    const isHeadBlocked =
                        beforeHeadR < 0 || beforeHeadR >= BOARD_SIZE ||
                        beforeHeadC < 0 || beforeHeadC >= BOARD_SIZE ||
                        b[beforeHeadR][beforeHeadC] === oppMark;

                    const isTailBlocked =
                        afterTailR < 0 || afterTailR >= BOARD_SIZE ||
                        afterTailC < 0 || afterTailC >= BOARD_SIZE ||
                        b[afterTailR][afterTailC] === oppMark;

                    if (isHeadBlocked && isTailBlocked) {
                        continue; // Blocked at both ends -> not a win under 2-block rule
                    }
                }
                return line;
            }
        }
        return null;
    }, [blockTwoEndsRule]);

    const isRestoredRef = useRef<boolean>(false);

    // Make a move
    const makeMove = useCallback((r: number, c: number, playerMark?: PlayerMark) => {
        if (board[r][c] !== null || isGameOver) return;

        const currentTurn = playerMark || turn;
        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = currentTurn;

        playCaroSound('move', isMuted);
        setBoard(newBoard);
        setLastMove({ r, c });

        // Check Win
        const winLine = checkWinCondition(newBoard, r, c, currentTurn);
        if (winLine) {
            playCaroSound('win', isMuted);
            setWinningLine(winLine);
            setIsGameOver(true);
            setWinner(currentTurn);

            if (currentTurn === 'X') {
                setXWins((w) => w + 1);
                if (isVsAI) {
                    setUserHighWins((prev) => {
                        const updated = prev + 1;
                        try {
                            localStorage.setItem('caro_user_wins', updated.toString());
                        } catch {
                            // ignore
                        }
                        return updated;
                    });
                }
            } else {
                setOWins((w) => w + 1);
            }
            return;
        }

        // Check Draw
        const isFull = newBoard.every((row) => row.every((cell) => cell !== null));
        if (isFull) {
            setIsGameOver(true);
            setWinner('DRAW');
            return;
        }

        // Switch turn
        setTurn(currentTurn === 'X' ? 'O' : 'X');
    }, [board, isGameOver, turn, checkWinCondition, isVsAI, isMuted]);

    // Helper to evaluate continuous line patterns and open ends
    const evaluatePattern = useCallback((b: CellValue[][], r: number, c: number, mark: PlayerMark) => {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Main Diagonal
            [1, -1]   // Anti Diagonal
        ];

        let totalScore = 0;
        let openThreeCount = 0;
        let openFourCount = 0;

        for (const [dr, dc] of directions) {
            let count = 1;
            let openEnds = 0;

            // Forward scan
            let fr = r + dr;
            let fc = c + dc;
            while (fr >= 0 && fr < BOARD_SIZE && fc >= 0 && fc < BOARD_SIZE && b[fr][fc] === mark) {
                count++;
                fr += dr;
                fc += dc;
            }
            if (fr >= 0 && fr < BOARD_SIZE && fc >= 0 && fc < BOARD_SIZE && b[fr][fc] === null) {
                openEnds++;
            }

            // Backward scan
            let br = r - dr;
            let bc = c - dc;
            while (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE && b[br][bc] === mark) {
                count++;
                br -= dr;
                bc -= dc;
            }
            if (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE && b[br][bc] === null) {
                openEnds++;
            }

            // Score evaluation table
            if (count >= 5) {
                totalScore += 1000000; // 5-in-a-row instant win
            } else if (count === 4) {
                if (openEnds === 2) {
                    totalScore += 250000;
                    openFourCount++;
                } else if (openEnds === 1) {
                    totalScore += 80000;
                }
            } else if (count === 3) {
                if (openEnds === 2) {
                    totalScore += 50000;
                    openThreeCount++;
                } else if (openEnds === 1) {
                    totalScore += 8000;
                }
            } else if (count === 2) {
                if (openEnds === 2) {
                    totalScore += 2500;
                } else if (openEnds === 1) {
                    totalScore += 400;
                }
            }
        }

        // Fork bonuses (Double Open 3 or Double Open 4)
        if (openThreeCount >= 2) totalScore += 150000;
        if (openFourCount >= 2) totalScore += 300000;
        if (openThreeCount >= 1 && openFourCount >= 1) totalScore += 200000;

        return totalScore;
    }, []);

    // AI Heuristic Decision Engine for Gomoku (Grandmaster Level)
    const evaluateAIMove = useCallback((b: CellValue[][]): Point => {
        const candidateMoves: { r: number; c: number; score: number }[] = [];

        // Evaluate all empty cells near existing moves
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (b[r][c] !== null) continue;

                // Check if cell has neighbor within distance 2
                let hasNeighbor = false;
                for (let dr = -2; dr <= 2 && !hasNeighbor; dr++) {
                    for (let dc = -2; dc <= 2 && !hasNeighbor; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] !== null) {
                            hasNeighbor = true;
                        }
                    }
                }

                if (!hasNeighbor) continue;

                // Offense score for AI 'O'
                const aiScore = evaluatePattern(b, r, c, 'O');

                // Defense score for Human 'X'
                const humanScore = evaluatePattern(b, r, c, 'X');

                // Proximity to center
                const centerDist = Math.abs(r - BOARD_SIZE / 2) + Math.abs(c - BOARD_SIZE / 2);
                const positionalScore = 30 - centerDist * 2;

                let score = 0;
                if (aiDifficulty === 'hard') {
                    // Hard AI: Strict defense + ruthless offense
                    score = aiScore * 1.2 + humanScore * 1.5 + positionalScore;
                } else if (aiDifficulty === 'medium') {
                    score = aiScore * 1.0 + humanScore * 1.1 + positionalScore + Math.random() * 20;
                } else {
                    score = aiScore * 0.6 + humanScore * 0.6 + positionalScore + Math.random() * 150;
                }

                candidateMoves.push({ r, c, score });
            }
        }

        if (candidateMoves.length === 0) {
            return { r: Math.floor(BOARD_SIZE / 2), c: Math.floor(BOARD_SIZE / 2) };
        }

        candidateMoves.sort((a, b) => b.score - a.score);
        return candidateMoves[0];
    }, [evaluatePattern, aiDifficulty]);

    // AI Turn Effect
    useEffect(() => {
        if (!isOpen || isGameOver) return;

        if (isVsAI && turn === 'O' && !isAITinking) {
            setIsAITinking(true);
            setTimeout(() => {
                const aiMove = evaluateAIMove(board);
                setIsAITinking(false);
                makeMove(aiMove.r, aiMove.c, 'O');
            }, 50);
        }
    }, [isOpen, turn, isVsAI, board, isGameOver, evaluateAIMove, makeMove]);

    // Reset Game Board
    const initGame = useCallback(() => {
        setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
        setTurn('X');
        setLastMove(null);
        setWinningLine(null);
        setIsGameOver(false);
        setWinner(null);
        setIsAITinking(false);
        try {
            localStorage.removeItem('caro_saved_game');
        } catch {
            // ignore
        }
    }, []);

    // Restore saved game on mount/opening if available
    useEffect(() => {
        if (!isOpen) return;
        try {
            const saved = localStorage.getItem('caro_saved_game');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.board && Array.isArray(parsed.board)) {
                    setBoard(parsed.board);
                    setTurn(parsed.turn || 'X');
                    setLastMove(parsed.lastMove || null);
                    setWinningLine(parsed.winningLine || null);
                    setIsGameOver(!!parsed.isGameOver);
                    setWinner(parsed.winner || null);
                    if (typeof parsed.xWins === 'number') setXWins(parsed.xWins);
                    if (typeof parsed.oWins === 'number') setOWins(parsed.oWins);
                }
            }
        } catch {
            // ignore
        }
        isRestoredRef.current = true;
    }, [isOpen]);

    // Save game state to localStorage AFTER initial restore
    useEffect(() => {
        if (!isOpen || !isRestoredRef.current) return;
        try {
            const stateToSave = {
                board,
                turn,
                lastMove,
                winningLine,
                isGameOver,
                winner,
                xWins,
                oWins
            };
            localStorage.setItem('caro_saved_game', JSON.stringify(stateToSave));
        } catch {
            // ignore
        }
    }, [isOpen, board, turn, lastMove, winningLine, isGameOver, winner, xWins, oWins]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
            <div className="relative w-full max-w-xl bg-slate-900 border-4 border-rose-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] text-slate-100">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-rose-900 via-purple-900 to-indigo-950 p-3.5 text-white flex items-center justify-between shadow-lg border-b border-rose-500/30">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-2xl shadow-inner">
                            ❌⭕
                        </div>
                        <div>
                            <h2 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 text-rose-200">
                                Cờ Ca-rô Gomoku Pro (12x12)
                            </h2>
                            <p className="text-[11px] text-rose-400/80 font-semibold">Tạo Chuỗi 5 Quân Thắng Cuộc</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowGuide(!showGuide)}
                            className="p-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/40 transition text-rose-300 border border-rose-400/30"
                            title="Hướng dẫn luật chơi Cờ Caro"
                        >
                            <HelpCircle size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white border border-white/20"
                            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-rose-500/20 hover:bg-rose-600 transition text-rose-300 border border-rose-400/30"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Score & Settings Bar */}
                <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs font-bold gap-2">
                    {/* Game Mode Selector */}
                    <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                        <button
                            type="button"
                            disabled={isAITinking}
                            onClick={() => { setIsVsAI(true); initGame(); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${isVsAI ? 'bg-rose-500 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <Bot size={13} />
                            <span>Đấu AI</span>
                        </button>
                        <button
                            type="button"
                            disabled={isAITinking}
                            onClick={() => { setIsVsAI(false); initGame(); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${!isVsAI ? 'bg-rose-500 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <User size={13} />
                            <span>2 Người</span>
                        </button>
                    </div>

                    {/* Rule Toggle */}
                    <button
                        type="button"
                        onClick={() => setBlockTwoEndsRule(!blockTwoEndsRule)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition ${blockTwoEndsRule
                            ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                        title="Bật/Tắt luật chặn 2 đầu không thắng"
                    >
                        Luật: {blockTwoEndsRule ? 'Chặn 2 đầu' : 'Tự do'}
                    </button>

                    {/* AI Difficulty Selector */}
                    {isVsAI && (
                        <select
                            value={aiDifficulty}
                            onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                            className="bg-slate-800 border border-slate-700 text-rose-300 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                        >
                            <option value="easy">Cấp Dễ</option>
                            <option value="medium">Cấp Vừa</option>
                            <option value="hard">Cao Thủ AI</option>
                        </select>
                    )}

                    {/* High Score */}
                    <div className="flex items-center gap-1 text-amber-400">
                        <Trophy size={15} />
                        <span>Thắng AI: <span className="font-black">{userHighWins}</span></span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-between gap-4 overflow-y-auto relative">

                    {/* Guide Overlay Modal */}
                    {showGuide && (
                        <div className="absolute inset-4 z-30 bg-slate-900/95 border border-rose-500/40 rounded-2xl p-5 overflow-y-auto animate-fadeIn flex flex-col justify-between text-xs space-y-3">
                            <div>
                                <h3 className="text-sm font-black text-rose-300 flex items-center gap-1.5 mb-2">
                                    ❌⭕ Hướng Dẫn Luật Cờ Ca-rô (Gomoku)
                                </h3>
                                <div className="space-y-2 text-slate-300 leading-relaxed">
                                    <p>**1. Luật cơ bản:** Đánh lần lượt quân **X** và **O** vào ô bàn cờ.</p>
                                    <p>**2. Điều kiện thắng:** Tạo thành đường liền gồm **5 quân liên tiếp** theo hàng ngang, hàng dọc hoặc đường chéo.</p>
                                    <p>**3. Luật chặn 2 đầu:** Nếu đường 5 quân bị đối phương chặn kín cả 2 đầu thì không được tính thắng (nếu bật luật này).</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGuide(false)}
                                className="w-full py-2 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-400 transition"
                            >
                                Đã Hiểu! Vào Trận 🚀
                            </button>
                        </div>
                    )}

                    {/* Status & Player Indicator Header */}
                    <div className="w-full flex items-center justify-between text-xs font-extrabold px-2">
                        {/* Player X Info */}
                        <div className={`flex items-center gap-2 p-2 px-3 rounded-2xl border transition-all ${turn === 'X' ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md scale-105' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                            }`}>
                            <span className="text-base font-black text-rose-500">❌</span>
                            <span>Người chơi X ({xWins})</span>
                        </div>

                        {/* Turn Status Indicator */}
                        <div className="text-center font-black">
                            {isAITinking ? (
                                <span className="animate-pulse text-cyan-400">AI Máy Đang Nghĩ... 🧠</span>
                            ) : (
                                <span>Lượt đi: <span className={turn === 'X' ? 'text-rose-400 font-black' : 'text-cyan-400 font-black'}>{turn === 'X' ? '❌ QUÂN X' : '⭕ QUÂN O'}</span></span>
                            )}
                        </div>

                        {/* Player O Info */}
                        <div className={`flex items-center gap-2 p-2 px-3 rounded-2xl border transition-all ${turn === 'O' ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md scale-105' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                            }`}>
                            <span className="text-base font-black text-cyan-400">⭕</span>
                            <span>{isVsAI ? 'Máy AI' : 'Người chơi'} O ({oWins})</span>
                        </div>
                    </div>

                    {/* 12x12 Caro Board Container */}
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-slate-950 border-2 border-slate-800 rounded-2xl p-2 grid grid-cols-12 grid-rows-12 gap-0.5 shadow-2xl">
                        {Array.from({ length: BOARD_SIZE }).map((_, r) =>
                            Array.from({ length: BOARD_SIZE }).map((_, c) => {
                                const val = board[r][c];
                                const isLast = lastMove?.r === r && lastMove?.c === c;
                                const isWinCell = winningLine?.some((pt) => pt.r === r && pt.c === c);

                                return (
                                    <button
                                        key={`${r}-${c}`}
                                        type="button"
                                        disabled={val !== null || isGameOver || (isVsAI && turn === 'O')}
                                        onClick={() => makeMove(r, c)}
                                        className={`relative rounded-md border flex items-center justify-center transition-all ${isWinCell
                                            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-yellow-300 text-slate-950 scale-110 z-20 shadow-[0_0_15px_rgba(234,179,8,0.9)] animate-pulse'
                                            : isLast
                                                ? 'bg-slate-800 border-rose-500/80 z-10 shadow-sm'
                                                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/90'
                                            }`}
                                    >
                                        {val === 'X' && (
                                            <span className="text-rose-500 font-extrabold text-xs sm:text-sm leading-none select-none drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]">✕</span>
                                        )}
                                        {val === 'O' && (
                                            <span className="text-cyan-400 font-extrabold text-xs sm:text-sm leading-none select-none drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">◯</span>
                                        )}

                                        {/* Last move indicator dot */}
                                        {isLast && !isWinCell && (
                                            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                        )}
                                    </button>
                                );
                            })
                        )}

                        {/* Game Over Result Overlay */}
                        {isGameOver && (
                            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center z-30 animate-fadeIn">
                                {winner === 'DRAW' ? (
                                    <>
                                        <Swords size={44} className="text-slate-400 mb-2" />
                                        <h3 className="text-lg font-black text-white mb-1">Hòa Cơ! Bàn Cờ Đã Kín</h3>
                                    </>
                                ) : (
                                    <>
                                        <Award size={48} className="text-yellow-400 mb-2 animate-bounce" />
                                        <h3 className="text-lg font-black text-white mb-1">
                                            {winner === 'X' ? '❌ QUÂN X THẮNG CUỘC!' : '⭕ QUÂN O THẮNG CUỘC!'}
                                        </h3>
                                    </>
                                )}

                                <button
                                    type="button"
                                    onClick={initGame}
                                    className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-2 mt-3"
                                >
                                    <RotateCcw size={16} />
                                    <span>Ván Ca-rô Mới</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Reset Button */}
                    <div className="w-full flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={initGame}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                        >
                            <RotateCcw size={15} />
                            <span>Ván Mới</span>
                        </button>
                    </div>

                </div>

                {/* Footer Tip */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-400 font-medium">
                    💡 Click vào ô để đánh ❌ hoặc ⭕. Tạo chuỗi 5 quân liên tiếp để chiến thắng!
                </div>

            </div>
        </div>
    );
};

export default GomokuCaroModal;
