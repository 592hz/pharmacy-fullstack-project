import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, Sparkles, ChevronRight, Eye, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PillMemoryCardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── CARD DEFINITION ───
interface MemoryCard {
    id: number;
    symbol: string;
    name: string;
    category: string;
    color: string;
    ring: string;
    badgeBg: string;
    isFlipped: boolean;
    isMatched: boolean;
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

    playFlip() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playMatch() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(0.18, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.2);
        });
    }

    playMismatch() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playHint() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.3);
    }

    playWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.2, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });
    }
}

const sfx = new SoundFX();

// ─── CARD POOL DATA WITH DISTINCT VISUAL THEMES & CATEGORIES ───
const CARD_ITEMS = [
    { symbol: '💊', name: 'Viên Cảm Cúm', category: 'THUỐC BỔ', color: 'from-rose-600 via-pink-600 to-red-600', ring: 'ring-rose-400', badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/50' },
    { symbol: '🧪', name: 'Serum Dưỡng', category: 'DƯỢC MỸ PHẨM', color: 'from-cyan-600 via-blue-600 to-indigo-600', ring: 'ring-cyan-400', badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' },
    { symbol: '🌿', name: 'Nhân Sâm Quý', category: 'THẢO DƯỢC', color: 'from-emerald-600 via-teal-600 to-green-700', ring: 'ring-emerald-400', badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' },
    { symbol: '🌸', name: 'Cúc La Mã', category: 'DƯỢC LIỆU', color: 'from-fuchsia-600 via-purple-600 to-pink-600', ring: 'ring-fuchsia-400', badgeBg: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50' },
    { symbol: '🩺', name: 'Ống Nghe Y Tế', category: 'DỤNG CỤ', color: 'from-blue-600 via-sky-600 to-cyan-600', ring: 'ring-sky-400', badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-500/50' },
    { symbol: '🧰', name: 'Hộp Sơ Cứu', category: 'THIẾT BỊ', color: 'from-red-600 via-orange-600 to-amber-600', ring: 'ring-red-400', badgeBg: 'bg-red-950/80 text-red-300 border-red-500/50' },
    { symbol: '🍯', name: 'Mật Ong Rừng', category: 'BỒI BỔ', color: 'from-amber-500 via-yellow-500 to-orange-600', ring: 'ring-amber-300', badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50' },
    { symbol: '🍃', name: 'Hà Thủ Ô', category: 'ĐÔNG Y', color: 'from-lime-600 via-emerald-600 to-teal-700', ring: 'ring-lime-400', badgeBg: 'bg-lime-950/80 text-lime-300 border-lime-500/50' },
    { symbol: '🍇', name: 'Kỷ Tử Đỏ', category: 'THẢO DƯỢC', color: 'from-purple-600 via-violet-600 to-indigo-700', ring: 'ring-purple-400', badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/50' },
    { symbol: '💉', name: 'Xi-lanh Bổ', category: 'Y TẾ CHUYÊN', color: 'from-teal-600 via-cyan-600 to-sky-700', ring: 'ring-teal-400', badgeBg: 'bg-teal-950/80 text-teal-300 border-teal-500/50' },
    { symbol: '🧬', name: 'Chuỗi DNA', category: 'VI SINH', color: 'from-violet-600 via-fuchsia-600 to-pink-700', ring: 'ring-violet-400', badgeBg: 'bg-violet-950/80 text-violet-300 border-violet-500/50' },
    { symbol: '☀️', name: 'Vitamin C', category: 'VITAMIN', color: 'from-orange-500 via-amber-500 to-yellow-600', ring: 'ring-orange-400', badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-500/50' },
];

// ─── LEVEL CONFIGURATIONS ───
interface LevelConfig {
    id: number;
    title: string;
    subtitle: string;
    pairsCount: number; // 6, 8, 10, 12
    cols: number;       // grid cols
    timeLimit: number;
    hintsAllowed: number;
}

const LEVELS: LevelConfig[] = [
    { id: 1, title: 'Màn 1: Tập Trí Nhớ 🧠', subtitle: 'Khay 3x4 (6 cặp hình)', pairsCount: 6, cols: 4, timeLimit: 60, hintsAllowed: 2 },
    { id: 2, title: 'Màn 2: Thử Thách Dược Sĩ 💊', subtitle: 'Khay 4x4 (8 cặp hình)', pairsCount: 8, cols: 4, timeLimit: 50, hintsAllowed: 2 },
    { id: 3, title: 'Màn 3: Siêu Trí Nhớ 🌟', subtitle: 'Khay 4x5 (10 cặp hình)', pairsCount: 10, cols: 5, timeLimit: 45, hintsAllowed: 1 },
    { id: 4, title: 'Màn 4: Tuyệt Đỉnh Thần Đồng 🏆', subtitle: 'Khay 4x6 (12 cặp hình)', pairsCount: 12, cols: 6, timeLimit: 40, hintsAllowed: 1 },
];

export const PillMemoryCardModal: React.FC<PillMemoryCardModalProps> = ({ isOpen, onClose }) => {
    const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [score, setScore] = useState<number>(0);
    const [combo, setCombo] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [hintsLeft, setHintsLeft] = useState<number>(2);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'WIN' | 'GAMEOVER'>('IDLE');
    const [soundMuted, setSoundMuted] = useState<boolean>(false);
    const [isLockBoard, setIsLockBoard] = useState<boolean>(false);
    const [matchedPairsCount, setMatchedPairsCount] = useState<number>(0);

    const levelConfig = LEVELS[currentLevelIdx];

    // High Score from localStorage
    const [highScore, setHighScore] = useState<number>(() => {
        return Number(localStorage.getItem('PILL_MEMORY_HIGH_SCORE') || 0);
    });

    // Initialize Game Board
    const initBoard = useCallback((lvlIdx: number) => {
        const config = LEVELS[lvlIdx];
        const selectedItems = CARD_ITEMS.slice(0, config.pairsCount);
        
        // Duplicate & Shuffle Cards
        const cardDeck: MemoryCard[] = [];
        selectedItems.forEach((item, idx) => {
            cardDeck.push({
                id: idx * 2,
                symbol: item.symbol,
                name: item.name,
                category: item.category,
                color: item.color,
                ring: item.ring,
                badgeBg: item.badgeBg,
                isFlipped: false,
                isMatched: false,
            });
            cardDeck.push({
                id: idx * 2 + 1,
                symbol: item.symbol,
                name: item.name,
                category: item.category,
                color: item.color,
                ring: item.ring,
                badgeBg: item.badgeBg,
                isFlipped: false,
                isMatched: false,
            });
        });

        // Shuffle deck
        cardDeck.sort(() => Math.random() - 0.5);

        setCards(cardDeck);
        setFlippedIndices([]);
        setMatchedPairsCount(0);
        setTimeLeft(config.timeLimit);
        setHintsLeft(config.hintsAllowed);
        setCombo(0);
        setIsLockBoard(false);
    }, []);

    const startGame = (lvlIdx: number = 0) => {
        setCurrentLevelIdx(lvlIdx);
        setScore(0);
        initBoard(lvlIdx);
        setGameState('PLAYING');
    };

    const nextLevel = () => {
        if (currentLevelIdx < LEVELS.length - 1) {
            const nxt = currentLevelIdx + 1;
            setCurrentLevelIdx(nxt);
            initBoard(nxt);
            setGameState('PLAYING');
            toast.success(`🎉 Tiến lên ${LEVELS[nxt].title}!`);
        } else {
            toast.success('🏆 CHÚC MỪNG! Bạn đã chinh phục toàn bộ đỉnh cao Trí Nhớ!');
            setGameState('WIN');
        }
    };

    // Countdown Timer
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setGameState('GAMEOVER');
                    sfx.playMismatch();
                    toast.error('⏰ Hết giờ! Rèn luyện trí nhớ và thử lại nào!');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Handle Card Click
    const handleCardClick = (index: number) => {
        if (gameState !== 'PLAYING' || isLockBoard) return;
        if (cards[index].isFlipped || cards[index].isMatched) return;
        if (flippedIndices.includes(index)) return;

        sfx.playFlip();

        // Flip clicked card
        const updatedCards = [...cards];
        updatedCards[index].isFlipped = true;
        setCards(updatedCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        // Check if 2 cards are flipped
        if (newFlipped.length === 2) {
            setIsLockBoard(true);
            const [firstIdx, secondIdx] = newFlipped;
            const firstCard = updatedCards[firstIdx];
            const secondCard = updatedCards[secondIdx];

            if (firstCard.symbol === secondCard.symbol) {
                // MATCH!
                sfx.playMatch();
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((c, i) =>
                            i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
                        )
                    );
                    setFlippedIndices([]);
                    setIsLockBoard(false);

                    setCombo((cb) => {
                        const nextCombo = cb + 1;
                        const multiplier = Math.min(nextCombo, 5);
                        const gainedScore = 100 * multiplier;

                        setScore((s) => {
                            const newScore = s + gainedScore;
                            setHighScore((h) => {
                                if (newScore > h) {
                                    localStorage.setItem('PILL_MEMORY_HIGH_SCORE', String(newScore));
                                    return newScore;
                                }
                                return h;
                            });
                            return newScore;
                        });

                        toast.success(`✨ Ghép cặp [${firstCard.name}] (+${gainedScore}đ) ${multiplier > 1 ? `x${multiplier} Combo!` : ''}`);
                        return nextCombo;
                    });

                    // Bonus Time +3s
                    setTimeLeft((t) => Math.min(t + 3, levelConfig.timeLimit + 10));

                    setMatchedPairsCount((m) => {
                        const nextM = m + 1;
                        if (nextM >= levelConfig.pairsCount) {
                            sfx.playWin();
                            setGameState('WIN');
                        }
                        return nextM;
                    });
                }, 400);

            } else {
                // MISMATCH
                sfx.playMismatch();
                setCombo(0);
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((c, i) =>
                            i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
                        )
                    );
                    setFlippedIndices([]);
                    setIsLockBoard(false);
                }, 900);
            }
        }
    };

    // Hint Power-up: Peek All Cards for 1.5 Seconds
    const useHint = () => {
        if (hintsLeft <= 0 || gameState !== 'PLAYING' || isLockBoard) return;

        setHintsLeft((h) => h - 1);
        setIsLockBoard(true);
        sfx.playHint();

        // Reveal all non-matched cards temporarily
        setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));

        toast.info('👁️ Mắt Thần kích hoạt! Hãy nhớ kỹ các thẻ!');

        setTimeout(() => {
            setCards((prev) =>
                prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: false }))
            );
            setFlippedIndices([]);
            setIsLockBoard(false);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none">
            <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

                {/* Modal Header */}
                <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
                            🃏
                        </div>
                        <div>
                            <h2 className="font-black text-base sm:text-lg leading-tight flex items-center gap-2">
                                <span>Lật Hình Tìm Cặp Thuốc</span>
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
                                const nextM = !soundMuted;
                                setSoundMuted(nextM);
                                sfx.muted = nextM;
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

                {/* Dashboard Status Bar */}
                <div className="bg-neutral-800 border-b border-neutral-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-amber-400">
                            <Trophy size={16} />
                            <span>Điểm: <strong className="text-white text-sm">{score}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-emerald-400">
                            <Sparkles size={16} />
                            <span>Đã lật: <strong className="text-white text-sm">{matchedPairsCount}/{levelConfig.pairsCount} cặp</strong></span>
                        </div>

                        {combo > 1 && (
                            <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black animate-bounce shadow">
                                COMBO x{Math.min(combo, 5)} 🔥
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs border ${
                            timeLeft <= 10 ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-neutral-700 text-cyan-400 border-neutral-600'
                        }`}>
                            <span>⏱️ Thời gian: {timeLeft}s</span>
                        </div>

                        <div className="text-neutral-400 font-mono text-[11px]">
                            🏆 Kỷ lục: <span className="text-amber-400 font-bold">{highScore}</span>
                        </div>
                    </div>
                </div>

                {/* Main Card Grid Play Area */}
                <div className="relative flex-1 bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center overflow-y-auto min-h-[380px]">

                    {/* Card Grid Layout */}
                    <div
                        className="grid gap-3 w-full max-w-xl mx-auto justify-center"
                        style={{
                            gridTemplateColumns: `repeat(${levelConfig.cols}, minmax(0, 1fr))`
                        }}
                    >
                        {cards.map((card, idx) => {
                            const isFlipped = card.isFlipped || card.isMatched;
                            return (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardClick(idx)}
                                    className={`group relative h-28 sm:h-32 rounded-2xl cursor-pointer select-none transition-all duration-300 active:scale-95 ${
                                        card.isMatched ? 'opacity-50 scale-95 pointer-events-none' : 'hover:scale-105'
                                    }`}
                                    style={{ perspective: '1000px' }}
                                >
                                    <div
                                        className="w-full h-full rounded-2xl shadow-xl transition-transform duration-500 relative"
                                        style={{
                                            transformStyle: 'preserve-3d',
                                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                        }}
                                    >
                                        {/* CARD BACK (FACING DOWN - VISIBLE WHEN NOT FLIPPED) */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-950 border-2 border-cyan-500/40 rounded-2xl flex flex-col items-center justify-center p-2 shadow-inner"
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                WebkitBackfaceVisibility: 'hidden',
                                                transform: 'rotateY(0deg)'
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-black text-xl shadow-lg">
                                                💊
                                            </div>
                                            <span className="text-[11px] font-black text-cyan-300 mt-2 tracking-wider drop-shadow-sm">
                                                LẬT HÌNH
                                            </span>
                                        </div>

                                        {/* CARD FRONT (FACING UP - VISIBLE WHEN FLIPPED) */}
                                        <div
                                            className={`absolute inset-0 w-full h-full bg-gradient-to-br ${card.color} border-2 border-white/60 rounded-2xl flex flex-col items-center justify-between p-2 text-white shadow-2xl ${card.ring}`}
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                WebkitBackfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)'
                                            }}
                                        >
                                            {/* Category Tag */}
                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${card.badgeBg}`}>
                                                {card.category}
                                            </div>

                                            {/* Main Icon Graphic Container */}
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/25 backdrop-blur-md border border-white/50 flex items-center justify-center text-3xl sm:text-4xl shadow-inner animate-pop-bounce">
                                                {card.symbol}
                                            </div>

                                            {/* Name Tag */}
                                            <div className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/20 w-full text-center">
                                                <span className="text-[11px] font-black tracking-wide text-white drop-shadow truncate block">
                                                    {card.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Start Screen Overlay */}
                    {gameState === 'IDLE' && (
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
                            <div className="text-5xl animate-bounce">🃏💊🌿</div>
                            <div>
                                <h3 className="text-xl font-black text-white">Lật Hình Tìm Cặp Thuốc</h3>
                                <p className="text-xs text-neutral-400 max-w-md mt-1.5">
                                    Rèn luyện trí nhớ nhạy bén! Lật mở các thẻ thuốc & thảo dược, tìm chính xác 2 hình giống nhau trước khi đồng hồ điểm 0!
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 max-w-md my-2">
                                {LEVELS.map((lvl, idx) => (
                                    <button
                                        key={lvl.id}
                                        onClick={() => startGame(idx)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                            idx === currentLevelIdx
                                                ? 'bg-cyan-500 text-neutral-950 shadow-lg font-black'
                                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                        }`}
                                    >
                                        <span>{lvl.title.split(':')[0]}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => startGame(0)}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2"
                            >
                                <Play size={18} />
                                <span>BẮT ĐẦU THỬ THÁCH 🚀</span>
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
                                    <span>Lật Lại Màn Này</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Win Screen Overlay */}
                    {gameState === 'WIN' && (
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-in zoom-in-95">
                            <div className="text-5xl animate-bounce">🏆🌟🧠</div>
                            <div>
                                <h3 className="text-2xl font-black text-amber-400">TRÍ NHỚ TUYỆT ĐỈNH!</h3>
                                <p className="text-xs text-neutral-300 mt-1">
                                    Bạn đã lật chính xác 100% tất cả các cặp hình ở <span className="text-cyan-300 font-bold">{levelConfig.title}</span>!
                                </p>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl p-4 w-full max-w-xs space-y-2 text-xs">
                                <div className="flex justify-between text-neutral-400">
                                    <span>Tổng điểm đạt được:</span>
                                    <span className="text-amber-400 font-extrabold text-sm">{score}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                    <span>Thời gian dư:</span>
                                    <span className="text-cyan-400 font-bold">{timeLeft}s</span>
                                </div>
                                <div className="flex justify-between text-neutral-400 pt-1 border-t border-neutral-800">
                                    <span>Kỷ lục đỉnh cao:</span>
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
                                        Thử Lại Từ Màn 1
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen Overlay */}
                    {gameState === 'GAMEOVER' && (
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-in zoom-in-95">
                            <div className="text-5xl">⏰💔🧠</div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-500">HẾT GIỜ RỒI!</h3>
                                <p className="text-xs text-neutral-300 mt-1">
                                    Trí nhớ cần được rèn luyện mỗi ngày! Hãy lật lại lần nữa nhé!
                                </p>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 w-full max-w-xs space-y-2 text-xs">
                                <div className="flex justify-between text-neutral-400">
                                    <span>Số cặp đã lật:</span>
                                    <span className="text-emerald-400 font-bold">{matchedPairsCount}/{levelConfig.pairsCount}</span>
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

                {/* Footer Control Bar */}
                <div className="bg-neutral-900 border-t border-neutral-800 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {/* Power-up Hint Button */}
                        <button
                            onClick={useHint}
                            disabled={hintsLeft <= 0 || gameState !== 'PLAYING' || isLockBoard}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                                hintsLeft > 0 && gameState === 'PLAYING' && !isLockBoard
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/50 hover:scale-105 shadow-md'
                                    : 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed'
                            }`}
                            title="Lật xem nhanh tất cả lá bài trong 1.5s"
                        >
                            <Eye size={16} />
                            <span>Mắt Thần Gợi Ý ({hintsLeft})</span>
                        </button>
                    </div>

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
                            <span>Lật lại</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PillMemoryCardModal;
