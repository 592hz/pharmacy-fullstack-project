import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, X, Trophy, RotateCcw, Heart, CheckCircle2, AlertCircle, Coffee } from 'lucide-react';

interface CatCustomer {
    id: number;
    name: string;
    avatar: string; // SVG or Emoji
    favoriteColor: string;
    order: {
        drink: string;       // e.g. 'Trà Sữa Cổ Điển'
        drinkIcon: string;
        topping?: string;    // e.g. 'Trân Châu'
        toppingIcon?: string;
        bakery?: string;     // e.g. 'Bánh Donut'
        bakeryIcon?: string;
    };
    patience: number; // 100 down to 0
    maxPatience: number;
    dialog: string;
    isHappy?: boolean;
    isSad?: boolean;
}

interface ItemOption {
    id: string;
    name: string;
    icon: string;
    category: 'drink' | 'topping' | 'bakery';
    color: string;
    price?: number;
}

const DRINKS: ItemOption[] = [
    { id: 'boba_classic', name: 'Trà Sữa Cổ Điển', icon: '🧋', category: 'drink', color: '#E8D3B9' },
    { id: 'strawberry_tea', name: 'Trà Dâu Tươi', icon: '🍓', category: 'drink', color: '#FFB3C1' },
    { id: 'matcha_latte', name: 'Matcha Latte', icon: '🍵', category: 'drink', color: '#C8E6C9' },
    { id: 'peach_tea', name: 'Trà Đào Cam Sả', icon: '🍑', category: 'drink', color: '#FFE0B2' },
];

const TOPPINGS: ItemOption[] = [
    { id: 'pearls', name: 'Trân Châu Đen', icon: '🧋', category: 'topping', color: '#4A3B32' },
    { id: 'pudding', name: 'Pudding Trứng', icon: '🍮', category: 'topping', color: '#FFF59D' },
    { id: 'mochi', name: 'Mochi Dẻo', icon: '🍡', category: 'topping', color: '#F8BBD0' },
    { id: 'cheese', name: 'Kem Cheese Béo', icon: '🧀', category: 'topping', color: '#FFF9C4' },
];

const BAKERIES: ItemOption[] = [
    { id: 'donut', name: 'Bánh Donut', icon: '🍩', category: 'bakery', color: '#F48FB1' },
    { id: 'croissant', name: 'Croissant Bơ', icon: '🥐', category: 'bakery', color: '#FFE082' },
    { id: 'strawberry_cake', name: 'Bánh Kem Dâu', icon: '🍰', category: 'bakery', color: '#FFCDD2' },
    { id: 'cupcake', name: 'Cupcake Cầu Vồng', icon: '🧁', category: 'bakery', color: '#E1BEE7' },
];

const CAT_NAMES = [
    { name: 'Mèo Mập Mimi', avatar: '🐱', color: '#FFB7B2', dialog: 'Meow~ Cho mình một ly thật ngọt nha!' },
    { name: 'Mèo Cam Béo', avatar: '🐈', color: '#FFDAC1', dialog: 'Meow! Hôm nay đi làm mệt quá, cần tí trà sữa...' },
    { name: 'Mèo Mochi', avatar: '😸', color: '#E2F0CB', dialog: 'Purr~ Thêm topping mochi được hông ạ?' },
    { name: 'Mèo Xiêm Kiki', avatar: '😻', color: '#B5EAD7', dialog: 'Nyah! Cho mình 1 suất bánh trà xinh xắn nha!' },
    { name: 'Mèo Hoàng Gia', avatar: '👑', color: '#C7CEEA', dialog: 'Meow meow~ Ta muốn thử món ngon nhất tiệm!' },
];

// Audio synthesizer using Web Audio API for cute retro sounds
const playCuteSound = (type: 'pop' | 'serve' | 'error' | 'win' | 'click', isMuted: boolean) => {
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

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'serve') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(180, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'win') {
            osc.type = 'sine';
            [523, 659, 783, 1046, 1318].forEach((freq, idx) => {
                const startTime = now + idx * 0.07;
                osc.frequency.setValueAtTime(freq, startTime);
            });
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        }
    } catch {
        // Fallback silently if audio context is blocked
    }
};

export const CatBobaBakeryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const [coins, setCoins] = useState<number>(120);
    const [score, setScore] = useState<number>(0);
    const [combo, setCombo] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);
    const [isMuted, setIsMuted] = useState<boolean>(false);

    // Current Customer Order
    const [customer, setCustomer] = useState<CatCustomer | null>(null);

    // User Mix Tray
    const [selectedDrink, setSelectedDrink] = useState<ItemOption | null>(null);
    const [selectedTopping, setSelectedTopping] = useState<ItemOption | null>(null);
    const [selectedBakery, setSelectedBakery] = useState<ItemOption | null>(null);

    // Feedback Toast inside Game
    const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

    // Shop Upgrade States
    const [activeTab, setActiveTab] = useState<'counter' | 'shop' | 'recipe'>('counter');

    // Generate New Customer
    const spawnCustomer = useRef(() => { });
    spawnCustomer.current = () => {
        const catProfile = CAT_NAMES[Math.floor(Math.random() * CAT_NAMES.length)];

        const randomDrink = DRINKS[Math.floor(Math.random() * DRINKS.length)];
        const needsTopping = Math.random() > 0.3;
        const needsBakery = Math.random() > 0.4;

        const randomTopping = needsTopping ? TOPPINGS[Math.floor(Math.random() * TOPPINGS.length)] : undefined;
        const randomBakery = needsBakery ? BAKERIES[Math.floor(Math.random() * BAKERIES.length)] : undefined;

        setCustomer({
            id: Date.now(),
            name: catProfile.name,
            avatar: catProfile.avatar,
            favoriteColor: catProfile.color,
            order: {
                drink: randomDrink.name,
                drinkIcon: randomDrink.icon,
                topping: randomTopping?.name,
                toppingIcon: randomTopping?.icon,
                bakery: randomBakery?.name,
                bakeryIcon: randomBakery?.icon
            },
            patience: 100,
            maxPatience: 100,
            dialog: catProfile.dialog
        });

        // Reset tray
        setSelectedDrink(null);
        setSelectedTopping(null);
        setSelectedBakery(null);
    };

    // Initialize Game on Open
    useEffect(() => {
        if (isOpen && !customer) {
            spawnCustomer.current();
        }
    }, [isOpen, customer]);

    // Customer Patience Timer
    useEffect(() => {
        if (!isOpen || !customer || customer.isHappy || customer.isSad) return;

        const timer = setInterval(() => {
            setCustomer((prev) => {
                if (!prev) return null;
                const newPatience = prev.patience - 1.5;
                if (newPatience <= 0) {
                    playCuteSound('error', isMuted);
                    setCombo(0);
                    setFeedbackMsg({ text: 'Mèo con chờ lâu quá đã rời đi gòi! 😿', type: 'error' });
                    setTimeout(() => {
                        spawnCustomer.current();
                        setFeedbackMsg(null);
                    }, 1500);
                    return { ...prev, patience: 0, isSad: true, dialog: 'Nyah... Lâu quá gòi mệt quá meow~ 😿' };
                }
                return { ...prev, patience: newPatience };
            });
        }, 400);

        return () => clearInterval(timer);
    }, [isOpen, customer, isMuted]);

    if (!isOpen) return null;

    // Serve Tray Logic
    const handleServe = () => {
        if (!customer) return;

        if (!selectedDrink) {
            playCuteSound('error', isMuted);
            setFeedbackMsg({ text: 'Bạn chưa pha ly nước nào cả! 🧋', type: 'info' });
            setTimeout(() => setFeedbackMsg(null), 1500);
            return;
        }

        const isDrinkMatch = selectedDrink.name === customer.order.drink;
        const isToppingMatch = (selectedTopping?.name || undefined) === customer.order.topping;
        const isBakeryMatch = (selectedBakery?.name || undefined) === customer.order.bakery;

        if (isDrinkMatch && isToppingMatch && isBakeryMatch) {
            // SUCCESS!
            playCuteSound('serve', isMuted);

            const newCombo = combo + 1;
            setCombo(newCombo);

            const bonusCoins = 30 + newCombo * 10;
            const bonusScore = 100 * newCombo;

            setCoins((c) => c + bonusCoins);
            setScore((s) => s + bonusScore);

            if (score + bonusScore >= level * 500) {
                setLevel((l) => l + 1);
                playCuteSound('win', isMuted);
                setFeedbackMsg({ text: `🎉 Lên Cấp ${level + 1}! Tiệm Trà ngày càng đông khách!`, type: 'success' });
            } else {
                setFeedbackMsg({ text: `😻 Meow! Phục vụ xuất sắc! +${bonusCoins} 🪙 (Combo x${newCombo})`, type: 'success' });
            }

            // Create floating hearts
            const newHearts = Array.from({ length: 6 }, (_, i) => ({
                id: Date.now() + i,
                x: Math.random() * 80 + 10,
                y: Math.random() * 40 + 30
            }));
            setFloatingHearts(newHearts);

            setCustomer((prev) => prev ? { ...prev, isHappy: true, dialog: 'Meoww~ Ngon tuyệt vời luôn! Cảm ơn bạn nha! 💖' } : null);

            setTimeout(() => {
                setFloatingHearts([]);
                setFeedbackMsg(null);
                spawnCustomer.current();
            }, 1600);

        } else {
            // ERROR!
            playCuteSound('error', isMuted);
            setCombo(0);
            setFeedbackMsg({ text: 'Món này chưa đúng ý bé Mèo gòi! Kiểm tra lại Order nha! 😿', type: 'error' });
            setTimeout(() => setFeedbackMsg(null), 2000);
        }
    };

    const handleClearTray = () => {
        playCuteSound('click', isMuted);
        setSelectedDrink(null);
        setSelectedTopping(null);
        setSelectedBakery(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-amber-50/95 dark:bg-neutral-900 border-4 border-amber-300 dark:border-amber-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Top Header Bar */}
                <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 p-3.5 text-white flex items-center justify-between shadow-md select-none">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/40">
                            🐱
                        </div>
                        <div>
                            <h2 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 drop-shadow-sm">
                                Tiệm Trà Mèo & Bánh Ngọt
                                <span className="bg-white/30 text-xs px-2 py-0.5 rounded-full border border-white/30 font-bold">
                                    Lv.{level}
                                </span>
                            </h2>
                            <p className="text-[11px] opacity-90 font-medium">Cat & Boba Bakery • Relaxing Mini Game</p>
                        </div>
                    </div>

                    {/* Stats Badges */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border border-white/30 shadow-sm">
                            <span>🪙</span>
                            <span>{coins}</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border border-white/30 shadow-sm">
                            <Trophy size={14} className="text-yellow-200" />
                            <span>{score}</span>
                        </div>
                        {combo > 1 && (
                            <div className="bg-amber-300 text-amber-900 px-2.5 py-1 rounded-full text-xs font-black animate-bounce shadow">
                                🔥 x{combo}
                            </div>
                        )}

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

                {/* Tab Navigation */}
                <div className="flex border-b border-amber-200 dark:border-neutral-800 bg-amber-100/60 dark:bg-neutral-850 px-4 pt-2 gap-2 text-xs font-bold select-none">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('counter'); playCuteSound('click', isMuted); }}
                        className={`px-4 py-2 rounded-t-xl transition flex items-center gap-1.5 ${activeTab === 'counter'
                            ? 'bg-amber-50 dark:bg-neutral-900 text-amber-900 dark:text-amber-300 border-t-2 border-amber-500 font-extrabold shadow-sm'
                            : 'text-amber-700/70 dark:text-neutral-400 hover:text-amber-900'
                            }`}
                    >
                        <Coffee size={15} />
                        <span>Bàn Pha Chế</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('recipe'); playCuteSound('click', isMuted); }}
                        className={`px-4 py-2 rounded-t-xl transition flex items-center gap-1.5 ${activeTab === 'recipe'
                            ? 'bg-amber-50 dark:bg-neutral-900 text-amber-900 dark:text-amber-300 border-t-2 border-amber-500 font-extrabold shadow-sm'
                            : 'text-amber-700/70 dark:text-neutral-400 hover:text-amber-900'
                            }`}
                    >
                        <Sparkles size={15} />
                        <span>Sổ Công Thức</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">

                    {activeTab === 'counter' && (
                        <>
                            {/* Customer Area */}
                            {customer && (
                                <div className="relative bg-white/80 dark:bg-neutral-800/90 border-2 border-amber-200 dark:border-neutral-700 rounded-2xl p-3.5 shadow-md flex flex-col sm:flex-row items-center gap-4 transition-all">

                                    {/* Patience Bar */}
                                    <div className="absolute top-2 right-3 w-32 sm:w-40 bg-amber-100 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden border border-amber-300 dark:border-neutral-600">
                                        <div
                                            className={`h-full transition-all duration-300 ${customer.patience > 50 ? 'bg-emerald-400' : customer.patience > 25 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                                                }`}
                                            style={{ width: `${customer.patience}%` }}
                                        />
                                    </div>

                                    {/* Cat Avatar */}
                                    <div className="relative flex flex-col items-center select-none">
                                        <div
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-lg border-2 border-white transition-transform duration-300 animate-bounce"
                                            style={{ backgroundColor: customer.favoriteColor }}
                                        >
                                            {customer.avatar}
                                        </div>
                                        <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 mt-1 bg-amber-100 dark:bg-neutral-700 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-neutral-600">
                                            {customer.name}
                                        </span>
                                    </div>

                                    {/* Order Bubble */}
                                    <div className="flex-1 w-full bg-amber-50 dark:bg-neutral-900/80 p-3 rounded-2xl border border-amber-200 dark:border-neutral-700 relative shadow-inner">
                                        <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1">
                                            <Heart size={13} className="text-rose-500 fill-rose-500" />
                                            <span>{customer.dialog}</span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-gray-700 dark:text-gray-200 mt-2">
                                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Order:</span>

                                            {/* Drink Requirement */}
                                            <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                                                <span>{customer.order.drinkIcon}</span>
                                                <span>{customer.order.drink}</span>
                                            </span>

                                            {/* Topping Requirement */}
                                            {customer.order.topping && (
                                                <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                                    <span>{customer.order.toppingIcon}</span>
                                                    <span>{customer.order.topping}</span>
                                                </span>
                                            )}

                                            {/* Bakery Requirement */}
                                            {customer.order.bakery && (
                                                <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                                    <span>{customer.order.bakeryIcon}</span>
                                                    <span>{customer.order.bakery}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Floating Heart Animations */}
                            {floatingHearts.map((h) => (
                                <div
                                    key={h.id}
                                    className="absolute text-2xl animate-float-heart pointer-events-none z-30"
                                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                                >
                                    💖
                                </div>
                            ))}

                            {/* Feedback Alert Toast */}
                            {feedbackMsg && (
                                <div className={`p-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 border shadow-sm animate-pop-bounce ${feedbackMsg.type === 'success'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                                    : feedbackMsg.type === 'error'
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300'
                                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
                                    }`}>
                                    {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    <span>{feedbackMsg.text}</span>
                                </div>
                            )}

                            {/* Mixing Tray (Khay Phục Vụ Hiện Tại) */}
                            <div className="bg-amber-100/70 dark:bg-neutral-800/80 border-2 border-dashed border-amber-300 dark:border-neutral-700 rounded-2xl p-3.5 flex items-center justify-between shadow-inner select-none">
                                <div>
                                    <div className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">
                                        Khay Đồ Uống Hiện Tại của Bạn:
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
                                        {selectedDrink ? (
                                            <span className="bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-300 dark:border-neutral-600 shadow-sm flex items-center gap-1.5 animate-fadeIn">
                                                <span>{selectedDrink.icon}</span>
                                                <span>{selectedDrink.name}</span>
                                            </span>
                                        ) : (
                                            <span className="text-xs text-amber-700/60 dark:text-neutral-500 font-bold italic">
                                                Chưa chọn đồ uống base...
                                            </span>
                                        )}

                                        {selectedTopping && (
                                            <span className="bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-300 dark:border-neutral-600 shadow-sm flex items-center gap-1.5 animate-fadeIn">
                                                <span>{selectedTopping.icon}</span>
                                                <span>+ {selectedTopping.name}</span>
                                            </span>
                                        )}

                                        {selectedBakery && (
                                            <span className="bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-300 dark:border-neutral-600 shadow-sm flex items-center gap-1.5 animate-fadeIn">
                                                <span>{selectedBakery.icon}</span>
                                                <span>+ {selectedBakery.name}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClearTray}
                                        className="p-2 bg-white dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:text-rose-600 rounded-xl border border-amber-200 dark:border-neutral-600 transition shadow-sm font-bold text-xs flex items-center gap-1"
                                        title="Làm lại khay pha chế"
                                    >
                                        <RotateCcw size={15} />
                                        <span className="hidden sm:inline">Làm lại</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleServe}
                                        className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/30"
                                    >
                                        <span>Phục Vụ Mèo 🐾</span>
                                    </button>
                                </div>
                            </div>

                            {/* Ingredient Selection Grids */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                                {/* Step 1: Base Drinks */}
                                <div className="bg-white/70 dark:bg-neutral-800/70 p-3 rounded-2xl border border-amber-200 dark:border-neutral-700 flex flex-col gap-2">
                                    <div className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <span>1. Chọn Cốt Trà 🧋</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {DRINKS.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    playCuteSound('click', isMuted);
                                                    setSelectedDrink(item);
                                                }}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 text-left ${selectedDrink?.id === item.id
                                                    ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-[1.02]'
                                                    : 'bg-white dark:bg-neutral-700/80 text-gray-700 dark:text-gray-200 border-amber-200/80 dark:border-neutral-600 hover:bg-rose-50 dark:hover:bg-neutral-700'
                                                    }`}
                                            >
                                                <span className="text-xl">{item.icon}</span>
                                                <span className="line-clamp-1">{item.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 2: Toppings */}
                                <div className="bg-white/70 dark:bg-neutral-800/70 p-3 rounded-2xl border border-amber-200 dark:border-neutral-700 flex flex-col gap-2">
                                    <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <span>2. Thêm Topping 🍮</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {TOPPINGS.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    playCuteSound('click', isMuted);
                                                    setSelectedTopping(selectedTopping?.id === item.id ? null : item);
                                                }}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 text-left ${selectedTopping?.id === item.id
                                                    ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.02]'
                                                    : 'bg-white dark:bg-neutral-700/80 text-gray-700 dark:text-gray-200 border-amber-200/80 dark:border-neutral-600 hover:bg-amber-50 dark:hover:bg-neutral-700'
                                                    }`}
                                            >
                                                <span className="text-xl">{item.icon}</span>
                                                <span className="line-clamp-1">{item.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 3: Bakeries */}
                                <div className="bg-white/70 dark:bg-neutral-800/70 p-3 rounded-2xl border border-amber-200 dark:border-neutral-700 flex flex-col gap-2">
                                    <div className="text-xs font-black text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                        <span>3. Chọn Bánh Ngọt 🍰</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {BAKERIES.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    playCuteSound('click', isMuted);
                                                    setSelectedBakery(selectedBakery?.id === item.id ? null : item);
                                                }}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 text-left ${selectedBakery?.id === item.id
                                                    ? 'bg-purple-500 text-white border-purple-600 shadow-md scale-[1.02]'
                                                    : 'bg-white dark:bg-neutral-700/80 text-gray-700 dark:text-gray-200 border-amber-200/80 dark:border-neutral-600 hover:bg-purple-50 dark:hover:bg-neutral-700'
                                                    }`}
                                            >
                                                <span className="text-xl">{item.icon}</span>
                                                <span className="line-clamp-1">{item.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </>
                    )}

                    {/* Recipe Book Tab */}
                    {activeTab === 'recipe' && (
                        <div className="bg-white/80 dark:bg-neutral-800 p-4 rounded-2xl border border-amber-200 dark:border-neutral-700 flex flex-col gap-4">
                            <h3 className="font-black text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                <Sparkles size={16} />
                                <span>Sổ Công Thức Pha Chế Yêu Thích Của Mèo</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-amber-50 dark:bg-neutral-700/60 rounded-xl border border-amber-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-rose-600 dark:text-rose-300 mb-1">🧋 Trà Sữa Mèo Mập (Combo Quốc Dân)</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">Trà Sữa Cổ Điển + Trân Châu Đen + Bánh Donut</p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-neutral-700/60 rounded-xl border border-amber-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-emerald-600 dark:text-emerald-300 mb-1">🍵 Matcha Thỏ Bông</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">Matcha Latte + Mochi Dẻo + Cupcake Cầu Vồng</p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-neutral-700/60 rounded-xl border border-amber-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-pink-600 dark:text-pink-300 mb-1">🍓 Trà Dâu Ngọt Ngào</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">Trà Dâu Tươi + Kem Cheese + Bánh Kem Dâu</p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-neutral-700/60 rounded-xl border border-amber-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-amber-600 dark:text-amber-300 mb-1">🍑 Trà Đào Hoàng Gia</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">Trà Đào Cam Sả + Pudding Trứng + Croissant Bơ</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Bar */}
                <div className="p-3 bg-amber-100/80 dark:bg-neutral-850 border-t border-amber-200 dark:border-neutral-800 text-center text-[11px] text-amber-800 dark:text-amber-400 font-bold select-none">
                    ✨ Chúc Mỹ  có những phút giây thư giãn thật ngọt ngào sau giờ làm việc! 🐾
                </div>

            </div>
        </div>
    );
};

export default CatBobaBakeryModal;
