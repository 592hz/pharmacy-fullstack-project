import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, X, Trophy, Heart, CheckCircle2, AlertCircle, Sprout, Droplets, FlaskConical } from 'lucide-react';

interface HerbSeed {
    id: string;
    name: string;
    icon: string;
    growthTime: number; // in seconds
    color: string;
    cost: number;
}

const HERB_SEEDS: HerbSeed[] = [
    { id: 'ginseng', name: 'Nhân Sâm Tươi', icon: '🥕', growthTime: 4, color: '#F7D070', cost: 10 },
    { id: 'chamomile', name: 'Hoa Cúc La Mã', icon: '🌼', growthTime: 3, color: '#FFF176', cost: 5 },
    { id: 'mint', name: 'Bạc Hà Mát Lạnh', icon: '🌿', growthTime: 2.5, color: '#81C784', cost: 5 },
    { id: 'lotus', name: 'Hoa Sen Tuyết', icon: '🪷', growthTime: 5, color: '#F48FB1', cost: 15 },
    { id: 'cordyceps', name: 'Đông Trùng Hạ Thảo', icon: '🍄', growthTime: 6, color: '#FFB74D', cost: 20 },
];

interface GardenPlot {
    id: number;
    seed: HerbSeed | null;
    progress: number; // 0 to 100
    isRipe: boolean;
    needsWater: boolean;
}

interface RemedyRecipe {
    id: string;
    name: string;
    icon: string;
    color: string;
    ingredients: { seedId: string; count: number }[];
    price: number;
    description: string;
}

const REMEDIES: RemedyRecipe[] = [
    {
        id: 'sleep_tea',
        name: 'Trà Cúc Bạc Hà Dễ Ngủ',
        icon: '🍵',
        color: '#E8F5E9',
        ingredients: [{ seedId: 'chamomile', count: 1 }, { seedId: 'mint', count: 1 }],
        price: 45,
        description: 'Thư thái thần kinh, xua tan căng thẳng mệt mỏi.'
    },
    {
        id: 'energy_tonic',
        name: 'Cao Nhân Sâm Bổ Năng Lượng',
        icon: '🧪',
        color: '#FFF8E1',
        ingredients: [{ seedId: 'ginseng', count: 2 }],
        price: 60,
        description: 'Tăng cường thể lực, phục hồi năng lượng tức thì.'
    },
    {
        id: 'snow_lotus_elixir',
        name: 'Siro Sen Tuyết Dưỡng Nhan',
        icon: '🧋',
        color: '#FCE4EC',
        ingredients: [{ seedId: 'lotus', count: 1 }, { seedId: 'chamomile', count: 1 }],
        price: 75,
        description: 'Thanh lọc cơ thể, sáng da và nhẹ nhàng.'
    },
    {
        id: 'immuno_boost',
        name: 'Bào Chế Đông Trùng Thang',
        icon: '🏺',
        color: '#FFF3E0',
        ingredients: [{ seedId: 'cordyceps', count: 1 }, { seedId: 'ginseng', count: 1 }],
        price: 95,
        description: 'Tăng cường miễn dịch, nâng cao sức đề kháng.'
    }
];

interface AnimalPatient {
    id: number;
    name: string;
    avatar: string;
    favoriteColor: string;
    requestedRemedy: RemedyRecipe;
    patience: number;
    dialog: string;
    isHappy?: boolean;
}

const PATIENTS = [
    { name: 'Thỏ Bông Búp Bê', avatar: '🐰', color: '#FFB7B2', dialog: 'Khịt khịt~ Cho mình trà thảo mộc thư giãn nha!' },
    { name: 'Cáo Nhỏ Lông Cam', avatar: '🦊', color: '#FFDAC1', dialog: 'Khè~ Hôm nay làm việc hơi đuối, cần cao năng lượng!' },
    { name: 'Gấu Nâu Tròn Tròn', avatar: '🐻', color: '#E2F0CB', dialog: 'Ồ zê~ Cho mình ly siro thảo dược ngon ngọt nhất!' },
    { name: 'Mèo Tuyết Mắt Xanh', avatar: '🐱', color: '#B5EAD7', dialog: 'Meow~ Cho mình bài thuốc dưỡng nhan sen tuyết nha!' },
    { name: 'Sóc Nhỏ Lém Lỉnh', avatar: '🐿️', color: '#C7CEEA', dialog: 'Chít chít~ Cần thuốc bổ Đông Trùng để trèo cây khỏe nè!' },
];

// Audio Web Audio API synthesizer
const playHerbSound = (type: 'plant' | 'water' | 'harvest' | 'brew' | 'serve' | 'error', isMuted: boolean) => {
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

        if (type === 'plant') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'water') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(800, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'harvest') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.08);
            osc.frequency.setValueAtTime(783, now + 0.16);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'brew') {
            osc.type = 'sine';
            [400, 550, 700, 850, 1000].forEach((freq, i) => {
                osc.frequency.setValueAtTime(freq, now + i * 0.05);
            });
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'serve') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.08);
            osc.frequency.setValueAtTime(783.99, now + 0.16);
            osc.frequency.setValueAtTime(1046.50, now + 0.24);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.setValueAtTime(150, now + 0.1);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch {
        // Silently ignore audio restrictions
    }
};

export const HerbGardenModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const [coins, setCoins] = useState<number>(150);
    const [score, setScore] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'garden' | 'apothecary' | 'recipe'>('garden');

    // Garden plots (6 plots)
    const [plots, setPlots] = useState<GardenPlot[]>([
        { id: 1, seed: null, progress: 0, isRipe: false, needsWater: false },
        { id: 2, seed: null, progress: 0, isRipe: false, needsWater: false },
        { id: 3, seed: null, progress: 0, isRipe: false, needsWater: false },
        { id: 4, seed: null, progress: 0, isRipe: false, needsWater: false },
        { id: 5, seed: null, progress: 0, isRipe: false, needsWater: false },
        { id: 6, seed: null, progress: 0, isRipe: false, needsWater: false },
    ]);

    // Inventory of harvested herbs: { seedId: count }
    const [inventory, setInventory] = useState<Record<string, number>>({
        ginseng: 2,
        chamomile: 2,
        mint: 2,
        lotus: 1,
        cordyceps: 0,
    });

    // Currently selected seed to plant
    const [selectedSeed, setSelectedSeed] = useState<HerbSeed>(HERB_SEEDS[0]);

    // Patient order
    const [patient, setPatient] = useState<AnimalPatient | null>(null);
    const [brewedRemedy, setBrewedRemedy] = useState<RemedyRecipe | null>(null);

    // Feedback Toast inside Game
    const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Spawn patient
    const spawnPatient = useRef(() => { });
    spawnPatient.current = () => {
        const p = PATIENTS[Math.floor(Math.random() * PATIENTS.length)];
        const r = REMEDIES[Math.floor(Math.random() * REMEDIES.length)];

        setPatient({
            id: Date.now(),
            name: p.name,
            avatar: p.avatar,
            favoriteColor: p.color,
            requestedRemedy: r,
            patience: 100,
            dialog: p.dialog
        });
        setBrewedRemedy(null);
    };

    useEffect(() => {
        if (isOpen && !patient) {
            spawnPatient.current();
        }
    }, [isOpen, patient]);

    // Patient patience timer
    useEffect(() => {
        if (!isOpen || !patient || patient.isHappy) return;

        const timer = setInterval(() => {
            setPatient((prev) => {
                if (!prev) return null;
                const newPatience = prev.patience - 1;
                if (newPatience <= 0) {
                    playHerbSound('error', isMuted);
                    setFeedbackMsg({ text: 'Bệnh nhân chờ lâu quá đã rời đi! 😿', type: 'error' });
                    setTimeout(() => {
                        spawnPatient.current();
                        setFeedbackMsg(null);
                    }, 1500);
                    return null;
                }
                return { ...prev, patience: newPatience };
            });
        }, 500);

        return () => clearInterval(timer);
    }, [isOpen, patient, isMuted]);

    // Garden growth loop timer
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setPlots((prevPlots) =>
                prevPlots.map((plot) => {
                    if (!plot.seed || plot.isRipe) return plot;

                    // If needs water, growth halts until watered
                    if (plot.needsWater) return plot;

                    // Increment progress
                    const increment = (100 / plot.seed.growthTime) * 0.2;
                    const newProg = plot.progress + increment;

                    // 30% chance to request water midway
                    const shouldNeedWater = newProg > 40 && newProg < 70 && Math.random() < 0.08;

                    if (newProg >= 100) {
                        return { ...plot, progress: 100, isRipe: true, needsWater: false };
                    }

                    return { ...plot, progress: newProg, needsWater: shouldNeedWater ? true : plot.needsWater };
                })
            );
        }, 200);

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    // Plant seed in plot
    const handlePlant = (plotId: number) => {
        const plot = plots.find((p) => p.id === plotId);
        if (!plot) return;

        if (plot.seed && !plot.isRipe) return; // already growing

        if (plot.isRipe) {
            // Harvest
            playHerbSound('harvest', isMuted);
            setInventory((prev) => ({
                ...prev,
                [plot.seed!.id]: (prev[plot.seed!.id] || 0) + 1
            }));
            setScore((s) => s + 20);
            setFeedbackMsg({ text: `🌿 Thu hoạch thành công: +1 ${plot.seed?.name || 'Thảo dược'}!`, type: 'success' });
            setTimeout(() => setFeedbackMsg(null), 1200);

            // Clear plot
            setPlots((prev) => prev.map((p) => p.id === plotId ? { ...p, seed: null, progress: 0, isRipe: false, needsWater: false } : p));
            return;
        }

        // Check coins
        if (coins < selectedSeed.cost) {
            playHerbSound('error', isMuted);
            setFeedbackMsg({ text: 'Bạn không đủ xu để mua hạt giống này! 🪙', type: 'error' });
            setTimeout(() => setFeedbackMsg(null), 1500);
            return;
        }

        // Plant
        playHerbSound('plant', isMuted);
        setCoins((c) => c - selectedSeed.cost);
        setPlots((prev) => prev.map((p) => p.id === plotId ? { ...p, seed: selectedSeed, progress: 0, isRipe: false, needsWater: false } : p));
    };

    // Water plot
    const handleWaterPlot = (plotId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        playHerbSound('water', isMuted);
        setPlots((prev) => prev.map((p) => p.id === plotId ? { ...p, needsWater: false } : p));
        setFeedbackMsg({ text: '💧 Đã tưới nước! Thảo dược phát triển tiếp tục!', type: 'info' });
        setTimeout(() => setFeedbackMsg(null), 1200);
    };

    // Brew Remedy
    const handleBrewRemedy = (recipe: RemedyRecipe) => {
        // Check if player has enough ingredients
        const canBrew = recipe.ingredients.every(
            (ing) => (inventory[ing.seedId] || 0) >= ing.count
        );

        if (!canBrew) {
            playHerbSound('error', isMuted);
            setFeedbackMsg({ text: 'Chưa đủ thảo dược để bào chế món này! Hãy trồng thêm nhé 🌿', type: 'error' });
            setTimeout(() => setFeedbackMsg(null), 1800);
            return;
        }

        // Deduct ingredients
        playHerbSound('brew', isMuted);
        setInventory((prev) => {
            const next = { ...prev };
            recipe.ingredients.forEach((ing) => {
                next[ing.seedId] = (next[ing.seedId] || 0) - ing.count;
            });
            return next;
        });

        setBrewedRemedy(recipe);
        setFeedbackMsg({ text: `🧪 Bào chế thành công: ${recipe.name}!`, type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 1500);
    };

    // Serve Patient
    const handleServePatient = () => {
        if (!patient || !brewedRemedy) return;

        if (brewedRemedy.id === patient.requestedRemedy.id) {
            // SUCCESS
            playHerbSound('serve', isMuted);
            const rewardCoins = patient.requestedRemedy.price + 20;
            const rewardScore = 120;

            setCoins((c) => c + rewardCoins);
            setScore((s) => s + rewardScore);

            if (score + rewardScore >= level * 400) {
                setLevel((l) => l + 1);
                setFeedbackMsg({ text: `🎉 Lên Cấp Thầy Thuốc Lv.${level + 1}!`, type: 'success' });
            } else {
                setFeedbackMsg({ text: `💖 Bệnh nhân hài lòng! Nhận +${rewardCoins} 🪙`, type: 'success' });
            }

            setPatient((prev) => prev ? { ...prev, isHappy: true, dialog: 'Cảm ơn Thầy Thuốc nha! Thuốc hiệu nghiệm quá meow! 💖' } : null);

            setTimeout(() => {
                setFeedbackMsg(null);
                spawnPatient.current();
            }, 1600);
        } else {
            playHerbSound('error', isMuted);
            setFeedbackMsg({ text: 'Bài thuốc này không khớp với yêu cầu của bệnh nhân! 😿', type: 'error' });
            setTimeout(() => setFeedbackMsg(null), 1800);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-emerald-50/95 dark:bg-neutral-900 border-4 border-emerald-300 dark:border-emerald-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header Bar */}
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 p-3.5 text-white flex items-center justify-between shadow-md select-none">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner border border-white/40">
                            🌿
                        </div>
                        <div>
                            <h2 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-1.5 drop-shadow-sm">
                                Nông Trại & Tiệm Thuốc Đông Y
                                <span className="bg-white/30 text-xs px-2 py-0.5 rounded-full border border-white/30 font-bold">
                                    Lv.{level}
                                </span>
                            </h2>
                            <p className="text-[11px] opacity-90 font-medium">Cute Herbal Apothecary & Garden Mini Game</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border border-white/30 shadow-sm">
                            <span>🪙</span>
                            <span>{coins}</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border border-white/30 shadow-sm">
                            <Trophy size={14} className="text-yellow-200" />
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

                {/* Tabs */}
                <div className="flex border-b border-emerald-200 dark:border-neutral-800 bg-emerald-100/60 dark:bg-neutral-850 px-4 pt-2 gap-2 text-xs font-bold select-none">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('garden'); playHerbSound('plant', isMuted); }}
                        className={`px-4 py-2 rounded-t-xl transition flex items-center gap-1.5 ${activeTab === 'garden'
                            ? 'bg-emerald-50 dark:bg-neutral-900 text-emerald-900 dark:text-emerald-300 border-t-2 border-emerald-500 font-extrabold shadow-sm'
                            : 'text-emerald-700/70 dark:text-neutral-400 hover:text-emerald-900'
                            }`}
                    >
                        <Sprout size={15} />
                        <span>Vườn Dược Liệu</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('apothecary'); playHerbSound('plant', isMuted); }}
                        className={`px-4 py-2 rounded-t-xl transition flex items-center gap-1.5 ${activeTab === 'apothecary'
                            ? 'bg-emerald-50 dark:bg-neutral-900 text-emerald-900 dark:text-emerald-300 border-t-2 border-emerald-500 font-extrabold shadow-sm'
                            : 'text-emerald-700/70 dark:text-neutral-400 hover:text-emerald-900'
                            }`}
                    >
                        <FlaskConical size={15} />
                        <span>Bàn Bào Chế Thuốc</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('recipe'); playHerbSound('plant', isMuted); }}
                        className={`px-4 py-2 rounded-t-xl transition flex items-center gap-1.5 ${activeTab === 'recipe'
                            ? 'bg-emerald-50 dark:bg-neutral-900 text-emerald-900 dark:text-emerald-300 border-t-2 border-emerald-500 font-extrabold shadow-sm'
                            : 'text-emerald-700/70 dark:text-neutral-400 hover:text-emerald-900'
                            }`}
                    >
                        <Sparkles size={15} />
                        <span>Danh Mục Bài Thuốc</span>
                    </button>
                </div>

                {/* Body Area */}
                <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">

                    {/* Feedback Banner */}
                    {feedbackMsg && (
                        <div className={`p-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 border shadow-sm animate-pop-bounce ${feedbackMsg.type === 'success'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                            : feedbackMsg.type === 'error'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300'
                                : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-300'
                            }`}>
                            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span>{feedbackMsg.text}</span>
                        </div>
                    )}

                    {/* Tab 1: Garden */}
                    {activeTab === 'garden' && (
                        <div className="flex flex-col gap-4">
                            {/* Seed Selection Bar */}
                            <div className="bg-white/80 dark:bg-neutral-800 p-3 rounded-2xl border border-emerald-200 dark:border-neutral-700">
                                <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                                    <Sprout size={15} />
                                    <span>Chọn Hạt Giống Muốn Trồng:</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {HERB_SEEDS.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                playHerbSound('plant', isMuted);
                                                setSelectedSeed(s);
                                            }}
                                            className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${selectedSeed.id === s.id
                                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.03]'
                                                : 'bg-emerald-50/70 dark:bg-neutral-700 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-neutral-600 hover:bg-emerald-100'
                                                }`}
                                        >
                                            <span className="text-2xl">{s.icon}</span>
                                            <span className="text-[11px] font-extrabold line-clamp-1">{s.name}</span>
                                            <span className="text-[10px] opacity-90">{s.cost} 🪙</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 6 Garden Plots Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {plots.map((plot) => (
                                    <div
                                        key={plot.id}
                                        onClick={() => handlePlant(plot.id)}
                                        className={`relative h-32 rounded-2xl border-3 transition-all cursor-pointer p-3 flex flex-col items-center justify-between select-none shadow-md ${plot.isRipe
                                            ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-400 animate-pulse'
                                            : plot.seed
                                                ? 'bg-emerald-100/80 dark:bg-neutral-800 border-emerald-300'
                                                : 'bg-amber-200/40 dark:bg-neutral-800/50 border-dashed border-amber-300 dark:border-neutral-700 hover:bg-amber-200/60'
                                            }`}
                                    >
                                        {/* Plot Number */}
                                        <span className="absolute top-2 left-2 text-[10px] font-black text-emerald-700/60 dark:text-emerald-400">
                                            Ô #{plot.id}
                                        </span>

                                        {/* Plot Content */}
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            {plot.seed ? (
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-4xl transition-transform ${plot.isRipe ? 'scale-125 animate-bounce' : 'scale-90'}`}>
                                                        {plot.isRipe ? plot.seed.icon : plot.progress > 50 ? plot.seed.icon : '🌱'}
                                                    </span>
                                                    <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
                                                        {plot.isRipe ? 'Đã chín! Chạm để gặt' : plot.seed.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-amber-800/60 dark:text-neutral-400">
                                                    <Sprout size={24} />
                                                    <span className="text-[11px] font-bold mt-1">Trồng Hạt {selectedSeed.icon}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Growth Bar */}
                                        {plot.seed && !plot.isRipe && (
                                            <div className="w-full bg-emerald-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden border border-emerald-300">
                                                <div
                                                    className="bg-emerald-500 h-full transition-all duration-200"
                                                    style={{ width: `${plot.progress}%` }}
                                                />
                                            </div>
                                        )}

                                        {/* Water Needed Action */}
                                        {plot.needsWater && !plot.isRipe && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleWaterPlot(plot.id, e)}
                                                className="absolute -top-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce flex items-center gap-1 text-[10px] font-black"
                                            >
                                                <Droplets size={14} />
                                                <span>Tưới!</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Inventory Stock display */}
                            <div className="bg-white/80 dark:bg-neutral-800 p-3 rounded-2xl border border-emerald-200 dark:border-neutral-700 flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                                    Kho Dược Liệu Thu Hoạch:
                                </span>
                                <div className="flex flex-wrap gap-2 text-xs font-extrabold">
                                    {HERB_SEEDS.map((s) => (
                                        <span key={s.id} className="bg-emerald-100 dark:bg-neutral-700 text-emerald-900 dark:text-emerald-200 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                                            <span>{s.icon}</span>
                                            <span>x{inventory[s.id] || 0}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Apothecary / Patient Orders */}
                    {activeTab === 'apothecary' && (
                        <div className="flex flex-col gap-4">
                            {/* Patient Request Card */}
                            {patient && (
                                <div className="bg-white/90 dark:bg-neutral-800 p-4 rounded-2xl border-2 border-emerald-300 dark:border-neutral-700 shadow-md flex flex-col sm:flex-row items-center gap-4">
                                    {/* Patient Icon & Name */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shadow-md border-2 border-white animate-bounce"
                                            style={{ backgroundColor: patient.favoriteColor }}
                                        >
                                            {patient.avatar}
                                        </div>
                                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 mt-1">
                                            {patient.name}
                                        </span>
                                    </div>

                                    {/* Order Details */}
                                    <div className="flex-1 w-full bg-emerald-50 dark:bg-neutral-900/80 p-3 rounded-2xl border border-emerald-200 dark:border-neutral-700">
                                        <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1">
                                            <Heart size={13} className="text-rose-500 fill-rose-500" />
                                            <span>"{patient.dialog}"</span>
                                        </div>
                                        <div className="mt-2 text-xs font-extrabold flex items-center gap-2">
                                            <span className="text-emerald-600 dark:text-emerald-400">Yêu cầu bài thuốc:</span>
                                            <span className="bg-emerald-200 dark:bg-neutral-700 text-emerald-900 dark:text-emerald-200 px-3 py-1 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                                                <span>{patient.requestedRemedy.icon}</span>
                                                <span>{patient.requestedRemedy.name}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Brew Remedies Grid */}
                            <div className="bg-white/80 dark:bg-neutral-800 p-3 rounded-2xl border border-emerald-200 dark:border-neutral-700 flex flex-col gap-3">
                                <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                    <FlaskConical size={16} />
                                    <span>Chọn Bài Thuốc Bào Chế:</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {REMEDIES.map((rem) => {
                                        const hasEnough = rem.ingredients.every((ing) => (inventory[ing.seedId] || 0) >= ing.count);
                                        return (
                                            <div
                                                key={rem.id}
                                                className="p-3 rounded-2xl border border-emerald-200 dark:border-neutral-700 bg-emerald-50/60 dark:bg-neutral-750 flex flex-col justify-between gap-2"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                                            <span className="text-xl">{rem.icon}</span>
                                                            <span>{rem.name}</span>
                                                        </span>
                                                        <span className="text-xs font-black text-amber-600 bg-amber-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                                                            +{rem.price} 🪙
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                                                        {rem.description}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold">
                                                        <span>Cần:</span>
                                                        {rem.ingredients.map((ing) => {
                                                            const seed = HERB_SEEDS.find((s) => s.id === ing.seedId);
                                                            const currentCount = inventory[ing.seedId] || 0;
                                                            return (
                                                                <span
                                                                    key={ing.seedId}
                                                                    className={`px-2 py-0.5 rounded-md border ${currentCount >= ing.count
                                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                                        : 'bg-rose-100 text-rose-800 border-rose-300'
                                                                        }`}
                                                                >
                                                                    {seed?.icon} x{ing.count} ({currentCount})
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={!hasEnough}
                                                    onClick={() => handleBrewRemedy(rem)}
                                                    className={`w-full py-2 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 shadow ${hasEnough
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                                                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <FlaskConical size={14} />
                                                    <span>{hasEnough ? 'Bào Chế Thuốc 🧪' : 'Thiếu Dược Liệu'}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Serve Action Tray */}
                            {brewedRemedy && (
                                <div className="bg-amber-100/80 dark:bg-neutral-800 p-3.5 rounded-2xl border-2 border-amber-300 dark:border-neutral-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{brewedRemedy.icon}</span>
                                        <div>
                                            <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                                                Thuốc Đã Bào Chế: {brewedRemedy.name}
                                            </span>
                                            <p className="text-[11px] text-amber-800/80 dark:text-neutral-400 font-bold">
                                                Sẵn sàng để phục vụ cho bệnh nhân!
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleServePatient}
                                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg hover:scale-105 transition"
                                    >
                                        Bắt Mạch & Phục Vụ 🐾
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Recipe Book */}
                    {activeTab === 'recipe' && (
                        <div className="bg-white/80 dark:bg-neutral-800 p-4 rounded-2xl border border-emerald-200 dark:border-neutral-700 flex flex-col gap-4">
                            <h3 className="font-black text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                                <Sparkles size={16} />
                                <span>Thảo Dược Thư Giãn & Công Dụng Y Học</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-emerald-50 dark:bg-neutral-700/60 rounded-xl border border-emerald-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-emerald-700 dark:text-emerald-300 mb-1">🥕 Nhân Sâm Tươi (Ginseng)</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">Bổ khí huyết, định thần, tăng cường sinh lực và trí nhớ.</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-neutral-700/60 rounded-xl border border-emerald-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-amber-700 dark:text-amber-300 mb-1">🌼 Hoa Cúc La Mã (Chamomile)</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">An thần, dễ ngủ, làm dịu dạ dày và giảm căng thẳng.</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-neutral-700/60 rounded-xl border border-emerald-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-teal-700 dark:text-teal-300 mb-1">🌿 Bạc Hà Mát Lạnh (Mint)</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">Giải cảm, thông mũi, sảng khoái tinh thần tức thì.</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-neutral-700/60 rounded-xl border border-emerald-200 dark:border-neutral-600">
                                    <div className="font-extrabold text-pink-700 dark:text-pink-300 mb-1">🪷 Hoa Sen Tuyết (Snow Lotus)</div>
                                    <p className="text-gray-600 dark:text-gray-300 text-[11px]">Thanh nhiệt, giải độc, dưỡng nhan tươi trẻ.</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Bar */}
                <div className="p-3 bg-emerald-100/80 dark:bg-neutral-850 border-t border-emerald-200 dark:border-neutral-800 text-center text-[11px] text-emerald-800 dark:text-emerald-400 font-bold select-none">
                    🌱 Nông trại thảo mộc xoa dịu tâm hồn - Chúc Mỹ  luôn dồi dào sức khỏe! 🌸
                </div>

            </div>
        </div>
    );
};

export default HerbGardenModal;
