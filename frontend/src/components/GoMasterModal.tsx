import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Volume2, VolumeX, X, Trophy, RotateCcw, Bot, User, HelpCircle,
    Award, Flag, FastForward, Undo2, Lightbulb, PieChart, ShieldAlert
} from 'lucide-react';

export type BoardSize = 9 | 13 | 19;
export type GoColor = 'B' | 'W'; // 'B': Black, 'W': White
export type IntersectionValue = GoColor | null;

export interface Point {
    r: number;
    c: number;
}

export interface TerritoryResult {
    blackTerritory: Point[];
    whiteTerritory: Point[];
    neutralTerritory: Point[];
    blackCaptures: number;
    whiteCaptures: number;
    komi: number;
    blackTotalScore: number;
    whiteTotalScore: number;
    winner: 'B' | 'W' | 'DRAW';
    scoreDiff: number;
}

// Sound Synthesizer for Go Game
const playGoSound = (type: 'move' | 'capture' | 'pass' | 'win' | 'illegal', isMuted: boolean) => {
    if (isMuted) return;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (type === 'move') {
            // Wood-clack sound for placing stone
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'capture') {
            // Crisp pop sound for capturing stones
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'pass') {
            // Soft chime sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554.37, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'win') {
            // Fanfare sequence
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                gain.gain.setValueAtTime(0.2, now + idx * 0.09);
                gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.09 + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.25);
            });
        } else if (type === 'illegal') {
            // Buzz warning sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } catch {
        // Fallback for audio disabled browsers
    }
};

// Helper: Get adjacent points on grid
const getNeighbors = (r: number, c: number, size: number): Point[] => {
    const neighbors: Point[] = [];
    if (r > 0) neighbors.push({ r: r - 1, c });
    if (r < size - 1) neighbors.push({ r: r + 1, c });
    if (c > 0) neighbors.push({ r, c: c - 1 });
    if (c < size - 1) neighbors.push({ r, c: c + 1 });
    return neighbors;
};

// Find group of connected stones of same color and calculate liberties count
const getGroupAndLiberties = (
    board: IntersectionValue[][],
    startR: number,
    startC: number,
    size: number
) => {
    const color = board[startR][startC];
    if (!color) return { groupPoints: [], liberties: new Set<string>() };

    const visited = new Set<string>();
    const groupPoints: Point[] = [];
    const liberties = new Set<string>();
    const queue: Point[] = [{ r: startR, c: startC }];

    const startKey = `${startR},${startC}`;
    visited.add(startKey);

    while (queue.length > 0) {
        const curr = queue.shift()!;
        groupPoints.push(curr);

        for (const n of getNeighbors(curr.r, curr.c, size)) {
            const nVal = board[n.r][n.c];
            const nKey = `${n.r},${n.c}`;
            if (nVal === null) {
                liberties.add(nKey);
            } else if (nVal === color && !visited.has(nKey)) {
                visited.add(nKey);
                queue.push(n);
            }
        }
    }

    return { groupPoints, liberties };
};

// Serialize board matrix to string key for Ko detection
const serializeBoard = (board: IntersectionValue[][]): string => {
    return board.map(row => row.map(cell => cell || '.').join('')).join('');
};

// Calculate territory & score when game ends or for preview
export const calculateTerritory = (
    board: IntersectionValue[][],
    size: number,
    blackCaptures: number,
    whiteCaptures: number,
    komi: number = 6.5
): TerritoryResult => {
    const visited = new Set<string>();
    const blackTerritory: Point[] = [];
    const whiteTerritory: Point[] = [];
    const neutralTerritory: Point[] = [];

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const key = `${r},${c}`;
            if (board[r][c] !== null || visited.has(key)) continue;

            // Flood fill empty region
            const region: Point[] = [];
            const queue: Point[] = [{ r, c }];
            visited.add(key);

            const borderColors = new Set<GoColor>();

            while (queue.length > 0) {
                const curr = queue.shift()!;
                region.push(curr);

                for (const n of getNeighbors(curr.r, curr.c, size)) {
                    const nVal = board[n.r][n.c];
                    const nKey = `${n.r},${n.c}`;
                    if (nVal !== null) {
                        borderColors.add(nVal);
                    } else if (!visited.has(nKey)) {
                        visited.add(nKey);
                        queue.push(n);
                    }
                }
            }

            if (borderColors.has('B') && !borderColors.has('W')) {
                blackTerritory.push(...region);
            } else if (borderColors.has('W') && !borderColors.has('B')) {
                whiteTerritory.push(...region);
            } else {
                neutralTerritory.push(...region);
            }
        }
    }

    const blackTotalScore = blackTerritory.length + blackCaptures;
    const whiteTotalScore = whiteTerritory.length + whiteCaptures + komi;
    const scoreDiff = Math.abs(blackTotalScore - whiteTotalScore);

    let winner: 'B' | 'W' | 'DRAW' = 'DRAW';
    if (blackTotalScore > whiteTotalScore) winner = 'B';
    else if (whiteTotalScore > blackTotalScore) winner = 'W';

    return {
        blackTerritory,
        whiteTerritory,
        neutralTerritory,
        blackCaptures,
        whiteCaptures,
        komi,
        blackTotalScore,
        whiteTotalScore,
        winner,
        scoreDiff
    };
};

export const GoMasterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    // Board config
    const [boardSize, setBoardSize] = useState<BoardSize>(9); // Default 9x9 for smooth play
    const [board, setBoard] = useState<IntersectionValue[][]>(() =>
        Array(9).fill(null).map(() => Array(9).fill(null))
    );

    const [turn, setTurn] = useState<GoColor>('B'); // Black moves first in Go
    const [blackCaptures, setBlackCaptures] = useState<number>(0);
    const [whiteCaptures, setWhiteCaptures] = useState<number>(0);
    const [lastMove, setLastMove] = useState<Point | null>(null);
    const [passCount, setPassCount] = useState<number>(0);
    const [history, setHistory] = useState<{
        board: IntersectionValue[][];
        turn: GoColor;
        blackCaptures: number;
        whiteCaptures: number;
        lastMove: Point | null;
        passCount: number;
    }[]>([]);

    const [boardStateHistoryKeys, setBoardStateHistoryKeys] = useState<string[]>([]);

    // Settings & Game Modes
    const [isVsAI, setIsVsAI] = useState<boolean>(true);
    const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [isAITinking, setIsAITinking] = useState<boolean>(false);

    const [komi, setKomi] = useState<number>(6.5);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [gameResult, setGameResult] = useState<TerritoryResult | null>(null);
    const [resignWinner, setResignWinner] = useState<GoColor | null>(null);

    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [showGuide, setShowGuide] = useState<boolean>(false);
    const [showTerritoryEstimate, setShowTerritoryEstimate] = useState<boolean>(false);
    const [suggestedMove, setSuggestedMove] = useState<Point | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [userWins, setUserWins] = useState<number>(() => {
        try {
            return parseInt(localStorage.getItem('go_user_wins') || '0', 10);
        } catch {
            return 0;
        }
    });

    const isRestoredRef = useRef<boolean>(false);

    // Show temporary toast warning
    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 2200);
    };

    // Calculate Star Points (Hoshi / Dấu hoa) for visual aesthetic
    const starPoints = useMemo<Point[]>(() => {
        if (boardSize === 9) {
            return [
                { r: 2, c: 2 }, { r: 2, c: 6 },
                { r: 4, c: 4 },
                { r: 6, c: 2 }, { r: 6, c: 6 }
            ];
        } else if (boardSize === 13) {
            return [
                { r: 3, c: 3 }, { r: 3, c: 9 },
                { r: 6, c: 6 },
                { r: 9, c: 3 }, { r: 9, c: 9 }
            ];
        } else {
            return [
                { r: 3, c: 3 }, { r: 3, c: 9 }, { r: 3, c: 15 },
                { r: 9, c: 3 }, { r: 9, c: 9 }, { r: 9, c: 15 },
                { r: 15, c: 3 }, { r: 15, c: 9 }, { r: 15, c: 15 }
            ];
        }
    }, [boardSize]);

    // Reset Game Board
    const initGame = useCallback((newSize?: BoardSize) => {
        const size = newSize || boardSize;
        setBoardSize(size);
        setBoard(Array(size).fill(null).map(() => Array(size).fill(null)));
        setTurn('B');
        setBlackCaptures(0);
        setWhiteCaptures(0);
        setLastMove(null);
        setPassCount(0);
        setHistory([]);
        setBoardStateHistoryKeys([serializeBoard(Array(size).fill(null).map(() => Array(size).fill(null)))]);
        setIsGameOver(false);
        setGameResult(null);
        setResignWinner(null);
        setIsAITinking(false);
        setSuggestedMove(null);
        try {
            localStorage.removeItem('go_saved_game');
        } catch {
            // ignore
        }
    }, [boardSize]);

    // Core Go Move Executor
    const executeMove = useCallback((r: number, c: number, playerColor?: GoColor): boolean => {
        if (isGameOver) return false;
        
        // Prevent player from placing moves during AI turn or thinking state
        if (isVsAI && turn === 'W' && !playerColor) return false;
        if (isAITinking && !playerColor) return false;

        const color = playerColor || turn;

        if (board[r][c] !== null) {
            if (!playerColor) triggerToast("Vị trí đã có quân cờ!");
            playGoSound('illegal', isMuted);
            return false;
        }

        // Clone board matrix
        const nextBoard = board.map(row => [...row]);
        nextBoard[r][c] = color;
        const oppColor: GoColor = color === 'B' ? 'W' : 'B';

        // Check captured opponent groups (Multi-group atomic capture)
        let capturedCount = 0;
        const checkedOpponentKeys = new Set<string>();
        const groupsToCapture: Point[][] = [];

        for (const n of getNeighbors(r, c, boardSize)) {
            const nKey = `${n.r},${n.c}`;
            if (nextBoard[n.r][n.c] === oppColor && !checkedOpponentKeys.has(nKey)) {
                const { groupPoints, liberties } = getGroupAndLiberties(nextBoard, n.r, n.c, boardSize);
                for (const pt of groupPoints) {
                    checkedOpponentKeys.add(`${pt.r},${pt.c}`);
                }
                if (liberties.size === 0) {
                    groupsToCapture.push(groupPoints);
                }
            }
        }

        // Convert all captured stones to capturer's color
        for (const group of groupsToCapture) {
            for (const pt of group) {
                nextBoard[pt.r][pt.c] = color;
                capturedCount++;
            }
        }

        // Check if placed stone has liberties after captures (Suicide Rule check)
        const { liberties: ownLiberties } = getGroupAndLiberties(nextBoard, r, c, boardSize);
        if (ownLiberties.size === 0) {
            if (!playerColor) triggerToast("Nước đi Tự Sát! Không được đặt quân ở đây.");
            playGoSound('illegal', isMuted);
            return false;
        }

        // Ko Rule check (Repetition of exact board state)
        const nextStateKey = serializeBoard(nextBoard);
        if (boardStateHistoryKeys.length > 0 && boardStateHistoryKeys[boardStateHistoryKeys.length - 1] === nextStateKey) {
            if (!playerColor) triggerToast("Vi phạm quy tắc Ko! Không thể lặp lại trạng thái ngay.");
            playGoSound('illegal', isMuted);
            return false;
        }

        // Push current state into undo history
        setHistory(prev => [
            ...prev,
            {
                board: board.map(row => [...row]),
                turn,
                blackCaptures,
                whiteCaptures,
                lastMove,
                passCount
            }
        ]);

        // Update Board state
        setBoard(nextBoard);
        setBoardStateHistoryKeys(prev => [...prev, nextStateKey]);
        setLastMove({ r, c });
        setPassCount(0);
        setSuggestedMove(null);

        if (capturedCount > 0) {
            playGoSound('capture', isMuted);
            if (color === 'B') setBlackCaptures(prev => prev + capturedCount);
            else setWhiteCaptures(prev => prev + capturedCount);
            triggerToast(`${color === 'B' ? '⚫ Quân Đen' : '⚪ Quân Trắng'} đã bắt & thu phục ${capturedCount} quân đối phương!`);
        } else {
            playGoSound('move', isMuted);
        }

        // Switch turn
        setTurn(oppColor);
        return true;
    }, [board, boardSize, isGameOver, turn, blackCaptures, whiteCaptures, lastMove, passCount, boardStateHistoryKeys, isMuted, isVsAI, isAITinking]);

    // Pass turn action
    const handlePass = useCallback(() => {
        if (isGameOver) return;
        playGoSound('pass', isMuted);

        setHistory(prev => [
            ...prev,
            {
                board: board.map(row => [...row]),
                turn,
                blackCaptures,
                whiteCaptures,
                lastMove,
                passCount
            }
        ]);

        const newPassCount = passCount + 1;
        setPassCount(newPassCount);

        if (newPassCount >= 2) {
            // Both players passed consecutively -> End Game & Calculate Territory
            const result = calculateTerritory(board, boardSize, blackCaptures, whiteCaptures, komi);
            setGameResult(result);
            setIsGameOver(true);
            playGoSound('win', isMuted);

            if (result.winner === 'B' && isVsAI) {
                setUserWins(prev => {
                    const updated = prev + 1;
                    try { localStorage.setItem('go_user_wins', updated.toString()); } catch { /* ignore */ }
                    return updated;
                });
            }
        } else {
            triggerToast(`${turn === 'B' ? '⚫ Quân Đen' : '⚪ Quân Trắng'} đã bỏ lượt.`);
            setTurn(prev => (prev === 'B' ? 'W' : 'B'));
        }
    }, [board, boardSize, isGameOver, turn, blackCaptures, whiteCaptures, komi, lastMove, passCount, isVsAI, isMuted]);

    // Resign action
    const handleResign = useCallback(() => {
        if (isGameOver) return;
        const winner = turn === 'B' ? 'W' : 'B';
        setResignWinner(winner);
        setIsGameOver(true);
        playGoSound('win', isMuted);

        if (winner === 'B' && isVsAI) {
            setUserWins(prev => {
                const updated = prev + 1;
                try { localStorage.setItem('go_user_wins', updated.toString()); } catch { /* ignore */ }
                return updated;
            });
        }
    }, [isGameOver, turn, isVsAI, isMuted]);

    // Undo action
    const handleUndo = useCallback(() => {
        if (history.length === 0 || isGameOver) return;
        const targetStep = isVsAI && history.length >= 2 ? history.length - 2 : history.length - 1;
        const previousState = history[targetStep];

        setBoard(previousState.board);
        setTurn(previousState.turn);
        setBlackCaptures(previousState.blackCaptures);
        setWhiteCaptures(previousState.whiteCaptures);
        setLastMove(previousState.lastMove);
        setPassCount(previousState.passCount);

        setHistory(prev => prev.slice(0, targetStep));
        setBoardStateHistoryKeys(prev => prev.slice(0, targetStep + 1));
        setSuggestedMove(null);
        setIsAITinking(false);
    }, [history, isGameOver, isVsAI]);

    // Go AI Decision Engine (Intelligent Go Bot)
    const evaluateAIMove = useCallback((): Point | 'PASS' => {
        const candidateMoves: { pt: Point; score: number }[] = [];
        const myColor = turn;
        const oppColor: GoColor = myColor === 'B' ? 'W' : 'B';

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] !== null) continue;

                // Test move legality
                const testBoard = board.map(row => [...row]);
                testBoard[r][c] = myColor;

                // Check captures
                let captures = 0;
                const checkedOpponentKeys = new Set<string>();
                for (const n of getNeighbors(r, c, boardSize)) {
                    const nKey = `${n.r},${n.c}`;
                    if (testBoard[n.r][n.c] === oppColor && !checkedOpponentKeys.has(nKey)) {
                        const { groupPoints, liberties } = getGroupAndLiberties(testBoard, n.r, n.c, boardSize);
                        for (const pt of groupPoints) checkedOpponentKeys.add(`${pt.r},${pt.c}`);
                        if (liberties.size === 0) {
                            captures += groupPoints.length;
                            for (const pt of groupPoints) testBoard[pt.r][pt.c] = myColor;
                        }
                    }
                }

                // Check own liberties
                const { liberties: ownLiberties } = getGroupAndLiberties(testBoard, r, c, boardSize);
                if (ownLiberties.size === 0) continue; // Suicide illegal

                // Ko check
                const testKey = serializeBoard(testBoard);
                if (boardStateHistoryKeys.length > 0 && boardStateHistoryKeys[boardStateHistoryKeys.length - 1] === testKey) continue;

                // Scoring heuristics
                let score = 0;

                // 1. Instant capture bonus (eating opponent stones!)
                score += captures * 100;

                // 2. Save own group in Atari: if AI has adjacent group with 1 liberty, connecting or saving it
                for (const n of getNeighbors(r, c, boardSize)) {
                    if (board[n.r][n.c] === myColor) {
                        const { liberties: myLib } = getGroupAndLiberties(board, n.r, n.c, boardSize);
                        if (myLib.size === 1) {
                            score += 80;
                        }
                    }
                }

                // 3. Atari threat bonus: does this move put an opponent group into Atari?
                for (const n of getNeighbors(r, c, boardSize)) {
                    if (board[n.r][n.c] === oppColor) {
                        const { liberties: oppLib } = getGroupAndLiberties(board, n.r, n.c, boardSize);
                        if (oppLib.size === 2) {
                            score += 35;
                        } else if (oppLib.size === 1) {
                            score += 50;
                        }
                    }
                }

                // 4. Own liberties safety
                if (ownLiberties.size === 1) score -= 40; // Avoid self-Atari unless capturing
                else score += Math.min(ownLiberties.size, 4) * 5;

                // 5. Star points (Hoshi) opening strategy
                const isStar = starPoints.some(sp => sp.r === r && sp.c === c);
                if (isStar) score += 20;

                // 6. Shape & Influence
                let friendlyNeighbors = 0;
                let enemyNeighbors = 0;
                for (const n of getNeighbors(r, c, boardSize)) {
                    if (board[n.r][n.c] === myColor) friendlyNeighbors++;
                    if (board[n.r][n.c] === oppColor) enemyNeighbors++;
                }
                score += friendlyNeighbors * 6 + enemyNeighbors * 4;

                // Difficulty adjustments
                if (aiDifficulty === 'easy') {
                    score += Math.random() * 50;
                } else if (aiDifficulty === 'medium') {
                    score += Math.random() * 20;
                } else {
                    score += Math.random() * 5;
                }

                candidateMoves.push({ pt: { r, c }, score });
            }
        }

        if (candidateMoves.length === 0) return 'PASS';

        candidateMoves.sort((a, b) => b.score - a.score);

        const totalStonesOnBoard = board.reduce((acc, row) => acc + row.filter(cell => cell !== null).length, 0);
        if (candidateMoves[0].score < -30 && totalStonesOnBoard > boardSize * boardSize * 0.75) {
            return 'PASS';
        }

        return candidateMoves[0].pt;
    }, [turn, boardSize, board, boardStateHistoryKeys, starPoints, aiDifficulty]);

    // Trigger Hint feature
    const handleGetHint = () => {
        if (isGameOver || isAITinking) return;
        const bestMove = evaluateAIMove();
        if (bestMove === 'PASS') {
            triggerToast("Gợi ý: Nên Bỏ lượt (Pass)!");
        } else {
            setSuggestedMove(bestMove);
            triggerToast(`Gợi ý: Đặt quân tại hàng ${bestMove.r + 1}, cột ${String.fromCharCode(65 + bestMove.c)}`);
        }
    };

    // AI Turn Effect
    useEffect(() => {
        if (!isOpen || isGameOver || !isVsAI || turn !== 'W') return;

        setIsAITinking(true);
        const timer = setTimeout(() => {
            const aiMove = evaluateAIMove();
            setIsAITinking(false);
            if (aiMove === 'PASS') {
                handlePass();
            } else {
                executeMove(aiMove.r, aiMove.c, 'W');
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [isOpen, turn, isVsAI, isGameOver, evaluateAIMove, executeMove, handlePass]);

    // Restore saved game on mount/open
    useEffect(() => {
        if (!isOpen) return;
        try {
            const saved = localStorage.getItem('go_saved_game');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.board && Array.isArray(parsed.board)) {
                    setBoardSize(parsed.boardSize || 9);
                    setBoard(parsed.board);
                    setTurn(parsed.turn || 'B');
                    setBlackCaptures(parsed.blackCaptures || 0);
                    setWhiteCaptures(parsed.whiteCaptures || 0);
                    setLastMove(parsed.lastMove || null);
                    setPassCount(parsed.passCount || 0);
                    setIsGameOver(!!parsed.isGameOver);
                    setGameResult(parsed.gameResult || null);
                    setResignWinner(parsed.resignWinner || null);
                }
            }
        } catch {
            // ignore
        }
        isRestoredRef.current = true;
    }, [isOpen]);

    // Save game state
    useEffect(() => {
        if (!isOpen || !isRestoredRef.current) return;
        try {
            const stateToSave = {
                boardSize,
                board,
                turn,
                blackCaptures,
                whiteCaptures,
                lastMove,
                passCount,
                isGameOver,
                gameResult,
                resignWinner
            };
            localStorage.setItem('go_saved_game', JSON.stringify(stateToSave));
        } catch {
            // ignore
        }
    }, [isOpen, boardSize, board, turn, blackCaptures, whiteCaptures, lastMove, passCount, isGameOver, gameResult, resignWinner]);

    // Territory Live Estimate
    const liveTerritory = useMemo(() => {
        if (!showTerritoryEstimate && !isGameOver) return null;
        return calculateTerritory(board, boardSize, blackCaptures, whiteCaptures, komi);
    }, [board, boardSize, blackCaptures, whiteCaptures, komi, showTerritoryEstimate, isGameOver]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
            <div className="relative w-full max-w-2xl bg-amber-950/90 border-4 border-amber-600/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] text-amber-50">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-orange-950 p-3.5 text-amber-100 flex items-center justify-between shadow-lg border-b border-amber-600/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-700/30 border border-amber-500/50 flex items-center justify-center text-2xl shadow-inner">
                            ⚪⚫
                        </div>
                        <div>
                            <h2 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 text-amber-200">
                                Tuyệt Đỉnh Cờ Vây (Go Master)
                            </h2>
                            <p className="text-[11px] text-amber-400/80 font-semibold">Đấu Trí Chiếm Đất & Bắt Quân</p>
                        </div>
                    </div>

                    {/* Controls Header */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowGuide(!showGuide)}
                            className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 transition text-amber-300 border border-amber-400/30"
                            title="Hướng dẫn luật cờ Vây"
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
                            className="p-1.5 rounded-full bg-rose-500/30 hover:bg-rose-600 transition text-rose-200 border border-rose-400/30"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Score & Settings Bar */}
                <div className="p-3 bg-amber-950 border-b border-amber-800/80 flex flex-wrap items-center justify-between text-xs font-bold gap-2">
                    {/* Game Mode Selector */}
                    <div className="flex items-center gap-1 bg-amber-900/60 p-1 rounded-xl border border-amber-700/60">
                        <button
                            type="button"
                            disabled={isAITinking}
                            onClick={() => { setIsVsAI(true); initGame(); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${isVsAI ? 'bg-amber-600 text-white shadow' : 'text-amber-300 hover:bg-amber-800/60'
                                }`}
                        >
                            <Bot size={13} />
                            <span>Đấu AI</span>
                        </button>
                        <button
                            type="button"
                            disabled={isAITinking}
                            onClick={() => { setIsVsAI(false); initGame(); }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${!isVsAI ? 'bg-amber-600 text-white shadow' : 'text-amber-300 hover:bg-amber-800/60'
                                }`}
                        >
                            <User size={13} />
                            <span>2 Người</span>
                        </button>
                    </div>

                    {/* Board Size Selector */}
                    <div className="flex items-center gap-1 bg-amber-900/60 p-1 rounded-xl border border-amber-700/60">
                        {([9, 13, 19] as BoardSize[]).map((sz) => (
                            <button
                                key={sz}
                                type="button"
                                disabled={isAITinking}
                                onClick={() => initGame(sz)}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-black transition ${boardSize === sz
                                    ? 'bg-orange-500 text-white shadow'
                                    : 'text-amber-400 hover:bg-amber-800/40'
                                    }`}
                            >
                                {sz}x{sz}
                            </button>
                        ))}
                    </div>

                    {/* AI Difficulty Selector */}
                    {isVsAI && (
                        <select
                            value={aiDifficulty}
                            onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                            className="bg-amber-900/80 border border-amber-700 text-amber-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                        >
                            <option value="easy">Cấp Dễ</option>
                            <option value="medium">Cấp Vừa</option>
                            <option value="hard">Cao Thủ AI</option>
                        </select>
                    )}

                    {/* Komi Settings */}
                    <div className="flex items-center gap-1 text-amber-300 text-[11px]">
                        <span>Komi:</span>
                        <select
                            value={komi}
                            onChange={(e) => setKomi(parseFloat(e.target.value))}
                            className="bg-amber-900/80 border border-amber-700 text-amber-200 rounded px-1 py-0.5 outline-none font-bold"
                        >
                            <option value={0.5}>0.5</option>
                            <option value={6.5}>6.5</option>
                        </select>
                    </div>

                    {/* High Score */}
                    <div className="flex items-center gap-1 text-amber-400">
                        <Trophy size={14} />
                        <span>Thắng AI: <span className="font-black">{userWins}</span></span>
                    </div>
                </div>

                {/* Main Interactive Gameplay Area */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col items-center justify-between gap-3 overflow-y-auto relative">

                    {/* Toast Notification Floating Alert */}
                    {toastMessage && (
                        <div className="absolute top-2 z-40 bg-rose-600 text-white font-extrabold text-xs px-4 py-2 rounded-full shadow-xl border-2 border-rose-300 animate-bounce flex items-center gap-1.5">
                            <ShieldAlert size={16} />
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {/* Guide Overlay Modal */}
                    {showGuide && (
                        <div className="absolute inset-3 z-40 bg-amber-950/95 border-2 border-amber-500 rounded-2xl p-4 overflow-y-auto animate-fadeIn flex flex-col justify-between text-xs space-y-3">
                            <div>
                                <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5 mb-2">
                                    ⚪⚫ Hướng Dẫn Luật Chơi Cờ Vây (Go / Baduk)
                                </h3>
                                <div className="space-y-2 text-amber-100 leading-relaxed">
                                    <p>**1. Đặt quân:** Quân cờ được đặt vào **giao điểm** của các đường kẻ (không phải ô vuông).</p>
                                    <p>**2. Khí & Bắt quân:** Mỗi nhóm quân có các ô trống liền kề gọi là **Khí**. Khi tất cả Khí bị chặn hết, nhóm quân bị **bắt** và loại khỏi bàn cờ!</p>
                                    <p>**3. Cấm Tự Sát:** Không được đặt quân vào giao điểm không có Khí ngoại trừ trường hợp nước đi đó lập tức bắt quân đối phương.</p>
                                    <p>**4. Quy tắc Ko (Cấm lặp lại):** Không được lặp lại ngay lập tức trạng thái bàn cờ của nước trước.</p>
                                    <p>**5. Tính Điểm:** Kết thúc trận (khi 2 bên Pass liên tiếp), ai có **Tổng Lãnh Thổ (Đất) + Số Quân Bắt + Komi** lớn hơn sẽ Thắng!</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowGuide(false)}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl transition"
                            >
                                Đã Hiểu! Đấu Cờ Vây 🚀
                            </button>
                        </div>
                    )}

                    {/* Status & Player Info Bar */}
                    <div className="w-full flex items-center justify-between text-xs font-extrabold px-1">
                        {/* Black Player Card */}
                        <div className={`flex items-center gap-2 p-2 px-3 rounded-2xl border transition-all ${turn === 'B' ? 'bg-neutral-900 border-amber-500 text-amber-200 shadow-md scale-105' : 'bg-amber-900/40 border-amber-800 text-amber-400'
                            }`}>
                            <div className="w-5 h-5 rounded-full bg-black border border-neutral-600 shadow flex items-center justify-center text-[10px] text-white">⚫</div>
                            <div>
                                <div>Quân Đen {isVsAI ? '(Bạn)' : ''}</div>
                                <div className="text-[10px] text-amber-400 font-semibold">Bắt: {blackCaptures} quân</div>
                            </div>
                        </div>

                        {/* Turn Status Indicator */}
                        <div className="text-center font-black">
                            {isAITinking ? (
                                <span className="animate-pulse text-amber-400 flex items-center gap-1">
                                    <Bot size={14} className="animate-spin" /> Máy AI Đang Suy Nghĩ...
                                </span>
                            ) : (
                                <span>Lượt đi: <span className={turn === 'B' ? 'text-amber-200 font-black' : 'text-slate-100 font-black'}>
                                    {turn === 'B' ? '⚫ QUÂN ĐEN' : '⚪ QUÂN TRẮNG'}
                                </span></span>
                            )}
                        </div>

                        {/* White Player Card */}
                        <div className={`flex items-center gap-2 p-2 px-3 rounded-2xl border transition-all ${turn === 'W' ? 'bg-slate-800 border-amber-400 text-amber-100 shadow-md scale-105' : 'bg-amber-900/40 border-amber-800 text-amber-400'
                            }`}>
                            <div className="w-5 h-5 rounded-full bg-white border border-slate-300 shadow flex items-center justify-center text-[10px] text-black">⚪</div>
                            <div>
                                <div>Quân Trắng ({isVsAI ? 'Máy AI' : 'P2'})</div>
                                <div className="text-[10px] text-amber-400 font-semibold">Bắt: {whiteCaptures} quân (+{komi})</div>
                            </div>
                        </div>
                    </div>

                    {/* Realistic Wood Go Board Container */}
                    <div className="relative p-3 sm:p-5 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border-4 border-amber-900 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col items-center">

                        {/* Coordinate Headers */}
                        <div className="w-full flex justify-between px-2 text-[10px] sm:text-xs font-black text-amber-950 opacity-70 mb-1">
                            {Array.from({ length: boardSize }).map((_, idx) => (
                                <span key={idx} className="w-6 sm:w-8 text-center">{String.fromCharCode(65 + idx)}</span>
                            ))}
                        </div>

                        {/* The Grid Board */}
                        <div
                            className="relative grid bg-[#eec882] border-2 border-amber-900/80 rounded-lg p-1.5 shadow-inner"
                            style={{
                                gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                                width: boardSize === 9 ? '280px' : boardSize === 13 ? '320px' : '360px',
                                height: boardSize === 9 ? '280px' : boardSize === 13 ? '320px' : '360px'
                            }}
                        >
                            {Array.from({ length: boardSize }).map((_, r) =>
                                Array.from({ length: boardSize }).map((_, c) => {
                                    const val = board[r][c];
                                    const isLast = lastMove?.r === r && lastMove?.c === c;
                                    const isStar = starPoints.some(sp => sp.r === r && sp.c === c);
                                    const isSuggested = suggestedMove?.r === r && suggestedMove?.c === c;

                                    // Check territory overlay
                                    const isBlackTerritory = liveTerritory?.blackTerritory.some(pt => pt.r === r && pt.c === c);
                                    const isWhiteTerritory = liveTerritory?.whiteTerritory.some(pt => pt.r === r && pt.c === c);

                                    return (
                                        <div
                                            key={`${r}-${c}`}
                                            className="relative flex items-center justify-center cursor-pointer group"
                                            onClick={() => executeMove(r, c)}
                                        >
                                            {/* Intersection Grid Lines */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                {/* Horizontal Line */}
                                                <div
                                                    className="absolute bg-amber-950/80 h-[1.5px]"
                                                    style={{
                                                        left: c === 0 ? '50%' : '0%',
                                                        right: c === boardSize - 1 ? '50%' : '0%',
                                                        top: '50%'
                                                    }}
                                                />
                                                {/* Vertical Line */}
                                                <div
                                                    className="absolute bg-amber-950/80 w-[1.5px]"
                                                    style={{
                                                        top: r === 0 ? '50%' : '0%',
                                                        bottom: r === boardSize - 1 ? '50%' : '0%',
                                                        left: '50%'
                                                    }}
                                                />
                                            </div>

                                            {/* Star Point (Hoshi) Dot */}
                                            {isStar && (
                                                <div className="absolute w-2 h-2 rounded-full bg-amber-950 pointer-events-none z-0" />
                                            )}

                                            {/* Territory Highlight Dot */}
                                            {isBlackTerritory && val === null && (
                                                <div className="absolute w-3 h-3 rounded-sm bg-black/80 border border-amber-300 pointer-events-none z-10 animate-pulse" />
                                            )}
                                            {isWhiteTerritory && val === null && (
                                                <div className="absolute w-3 h-3 rounded-sm bg-white/90 border border-amber-900 pointer-events-none z-10 animate-pulse" />
                                            )}

                                            {/* Ghost Stone Preview on Hover */}
                                            {val === null && !isGameOver && (
                                                <div
                                                    className={`w-[82%] h-[82%] rounded-full opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none z-10 ${turn === 'B' ? 'bg-black' : 'bg-white'
                                                        }`}
                                                />
                                            )}

                                            {/* Hint Glow Indicator */}
                                            {isSuggested && val === null && (
                                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500 bg-emerald-400/30 animate-ping z-20" />
                                            )}

                                            {/* Black Stone (3D Rendered) */}
                                            {val === 'B' && (
                                                <div className="relative w-[88%] h-[88%] rounded-full bg-gradient-to-br from-neutral-700 via-neutral-900 to-black shadow-[0_4px_8px_rgba(0,0,0,0.6)] z-20 flex items-center justify-center transform transition-transform duration-100 scale-100">
                                                    <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] rounded-full bg-white/20 blur-[0.5px]" />
                                                    {isLast && (
                                                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                                                    )}
                                                </div>
                                            )}

                                            {/* White Stone (3D Rendered) */}
                                            {val === 'W' && (
                                                <div className="relative w-[88%] h-[88%] rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-300 border border-slate-300 shadow-[0_4px_8px_rgba(0,0,0,0.4)] z-20 flex items-center justify-center transform transition-transform duration-100 scale-100">
                                                    <div className="absolute top-[12%] left-[18%] w-[35%] h-[25%] rounded-full bg-white blur-[0.5px]" />
                                                    {isLast && (
                                                        <div className="w-2 h-2 rounded-full bg-rose-600 shadow-[0_0_8px_#e11d48] animate-pulse" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Game Over Result Overlay */}
                        {isGameOver && (
                            <div className="absolute inset-0 bg-amber-950/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-4 text-center z-30 animate-fadeIn">
                                {resignWinner ? (
                                    <>
                                        <Award size={48} className="text-amber-400 mb-2 animate-bounce" />
                                        <h3 className="text-lg font-black text-amber-100 mb-1">
                                            {resignWinner === 'B' ? '⚫ QUÂN ĐEN THẮNG (Đối phương đầu hàng)!' : '⚪ QUÂN TRẮNG THẮNG (Đối phương đầu hàng)!'}
                                        </h3>
                                    </>
                                ) : gameResult ? (
                                    <>
                                        <Award size={48} className="text-amber-400 mb-2 animate-bounce" />
                                        <h3 className="text-lg font-black text-amber-100 mb-1">
                                            {gameResult.winner === 'B'
                                                ? '⚫ QUÂN ĐEN THẮNG CUỘC!'
                                                : gameResult.winner === 'W'
                                                    ? '⚪ QUÂN TRẮNG THẮNG CUỘC!'
                                                    : 'HÒA CỜ!'}
                                        </h3>
                                        <div className="bg-amber-900/80 p-3 rounded-2xl border border-amber-700/60 my-2 text-xs font-bold text-amber-200 space-y-1 w-full max-w-xs">
                                            <div className="flex justify-between">
                                                <span>⚫ Điểm Quân Đen (Đất + Bắt):</span>
                                                <span className="text-amber-300 font-black">{gameResult.blackTotalScore} điểm</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>⚪ Điểm Quân Trắng (+{gameResult.komi}):</span>
                                                <span className="text-amber-300 font-black">{gameResult.whiteTotalScore} điểm</span>
                                            </div>
                                            <div className="text-[11px] text-amber-400 pt-1 border-t border-amber-800">
                                                Chênh lệch: {gameResult.scoreDiff} điểm
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={() => initGame()}
                                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-2 mt-2"
                                >
                                    <RotateCcw size={16} />
                                    <span>Ván Cờ Vây Mới</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Bar (Pass, Undo, Hint, Territory Estimate, Resign) */}
                    <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        <button
                            type="button"
                            disabled={isGameOver || history.length === 0}
                            onClick={handleUndo}
                            className="py-2 px-3 bg-amber-900/60 hover:bg-amber-800 border border-amber-700/80 text-amber-200 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                            <Undo2 size={15} />
                            <span>Hoàn Tác</span>
                        </button>

                        <button
                            type="button"
                            disabled={isGameOver}
                            onClick={handleGetHint}
                            className="py-2 px-3 bg-amber-900/60 hover:bg-amber-800 border border-amber-700/80 text-amber-200 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                            <Lightbulb size={15} className="text-amber-400" />
                            <span>Gợi Ý</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowTerritoryEstimate(!showTerritoryEstimate)}
                            className={`py-2 px-3 border font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 ${showTerritoryEstimate
                                ? 'bg-orange-600 border-orange-400 text-white'
                                : 'bg-amber-900/60 hover:bg-amber-800 border-amber-700/80 text-amber-200'
                                }`}
                        >
                            <PieChart size={15} />
                            <span>{showTerritoryEstimate ? 'Ẩn Đất' : 'Xem Đất'}</span>
                        </button>

                        <button
                            type="button"
                            disabled={isGameOver}
                            onClick={handlePass}
                            className="py-2 px-3 bg-cyan-700 hover:bg-cyan-600 border border-cyan-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                            <FastForward size={15} />
                            <span>Bỏ Lượt (Pass)</span>
                        </button>

                        <button
                            type="button"
                            disabled={isGameOver}
                            onClick={handleResign}
                            className="col-span-2 sm:col-span-1 py-2 px-3 bg-rose-700 hover:bg-rose-600 border border-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                            <Flag size={15} />
                            <span>Đầu Hàng</span>
                        </button>
                    </div>

                </div>

                {/* Footer Tip */}
                <div className="p-3 bg-amber-950 border-t border-amber-900 text-center text-[11px] text-amber-400/80 font-medium">
                    💡 Click vào giao điểm đường kẻ để đặt quân cờ. Bao vây hết Khí của đối phương để bắt quân!
                </div>

            </div>
        </div>
    );
};

export default GoMasterModal;
