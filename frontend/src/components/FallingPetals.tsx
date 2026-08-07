import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Flower2, Users, Gamepad2 } from 'lucide-react';
import CatBobaBakeryModal from '@/components/CatBobaBakeryModal';
import HerbGardenModal from '@/components/HerbGardenModal';
import Capsule2048Modal from '@/components/Capsule2048Modal';
import PillBubbleShooterModal from '@/components/PillBubbleShooterModal';
import PillDropMergeModal from '@/components/PillDropMergeModal';

interface PetalItem {
    id: number;
    left: number;       // % across screen
    size: number;       // font size in px
    duration: number;   // fall duration in seconds
    delay: number;      // animation delay in seconds
    color: string;      // random vibrant/pastel color
    symbol: string;     // flower/petal icon emoji
    rotation: number;   // initial rotation
    drift: number;      // horizontal drift in px
}

interface MascotItem {
    id: number;
    name: string;
    x: number;          // % left position (0..92)
    direction: 1 | -1;  // 1: right, -1: left
    speed: number;      // speed multiplier (% per tick)
    bodyColor: string;
    spikeColor: string;
    badgeText: string;
    msgIndex: number;
    lastCollision: number;
    isShaking?: boolean;
}

interface ExplosionParticle {
    id: number;
    symbol: string;
    tx: number;
    ty: number;
    color: string;
}

interface ExplosionEffect {
    id: number;
    x: number;
    text: string;
    particles: ExplosionParticle[];
}

const PALETTE = [
    '#ff4d6d', '#ff758f', '#ffb3c1', '#f72585', '#7209b7',
    '#3a0ca3', '#4361ee', '#4cc9f0', '#10b981', '#34d399',
    '#f59e0b', '#fbbf24', '#f97316', '#a855f7', '#ec4899'
];

const SYMBOLS = [
    '🍀', '🍀', '🍀', '🍀', // Cỏ 4 lá may mắn
    '🌸', '🌺', '🌼', '🌻', '🏵️', '🍃', '✨', '⭐', '🌟',
    '🧧', '💎', '🌈', '💖', '💕', '🌿', '🎋', '🎏', '🎈', '💐'
];

const ENCOURAGING_MESSAGES = [
    "Mỹ Mỹ ơi hôm nay cố gắng rồi! 💪✨",
    "Chúc Mỹ Mỹ một ngày ngập tràn may mắn! 🍀✨",
    "Mọi điều tuyệt vời đang chờ Mỹ Mỹ phía trước! 🌟💖",
    "Cố lên nhé, Mỹ Mỹ đang làm rất tốt! 🚀🔥",
    "Chúc buôn may bán đắt và thuận lợi nhé! 💰🎉",
    "Nụ cười của Mỹ Mỹ làm bừng sáng cả ngày đấy! 😊✨",
    "Luôn tin tưởng vào bản thân mình nhé! 💖🌈",
    "Một ngày mới tràn đầy năng lượng và niềm vui! ☀️🍀",
    "Vẫn đang làm rất xuất sắc nha MỸ MỸ ơi! 👏⭐",
    "Mỹ Mỹ xinh đẹp chúc một ngày thật ngọt ngào! 🌸💕",
    "Công việc suôn sẻ, khách hàng yêu thương Mỹ Mỹ! 🥰🌿",
    "Năng lượng tích cực lan tỏa cùng Mỹ Mỹ mỗi ngày! ⚡💖",
    "Mỹ Mỹ là bông hoa rạng rỡ nhất hôm nay! 🌺✨",
    "Chúc Mỹ Mỹ tiền vào như nước, niềm vui đong đầy! 💵🎉",
    "Mỗi ngày làm việc là một ngày vui nha Mỹ Mỹ! 🎈😊",
    "Mỹ Mỹ giỏi giang luôn hoàn thành tốt mọi việc! 🎯🌟",
    "Hôm nay Mỹ Mỹ hãy tự thưởng cho mình nụ cười tươi nhé! 😃✨",
    "Vạn sự như ý, may mắn gõ cửa Mỹ Mỹ hôm nay! 🧧🌸",
    "Hãy luôn yêu thương và chăm sóc bản thân nhé Mỹ Mỹ! 💆‍♀️💖",
    "Bình an, hạnh phúc và vạn điều may đến với Mỹ Mỹ! 🍀🕊️",
    "Dù có bận rộn cũng nhớ uống đủ nước nha Mỹ Mỹ! 🥛💧",
    "Mỹ Mỹ thông minh, xinh đẹp và luôn tỏa sáng! ✨💎",
    "Chúc nhà thuốc luôn đông khách và Mỹ Mỹ luôn tươi vui! 🏬💐",
    "Tương lai rực rỡ đang chờ đón Mỹ Mỹ phía trước! 🌈🚀",
    "Nhớ nghỉ ngơi điều độ nha Mỹ Mỹ ơi! ☕🛋️",
    "Mỹ Mỹ chính là niềm tự hào và động lực đấy! 🌟👑",
    "Bão giông dừng sau cánh cửa, Mỹ Mỹ luôn an yên! ☀️🌻",
    "Gửi Mỹ Mỹ ngàn bông hoa và năng lượng tích cực! 💋⚡",
    "Chúc Mỹ Mỹ mỗi giờ trôi qua đều trọn vẹn niềm vui! ⏰💖",
    "Mỹ Mỹ tuyệt vời nhất thế giới luôn nha! 🏆🥰"
];

const INITIAL_MASCOTS: MascotItem[] = [
    {
        id: 1,
        name: "Bé Xanh",
        x: 5,
        direction: 1,
        speed: 0.12,
        bodyColor: "#98D8AA", // Xanh pastel
        spikeColor: "#FFE5AD",
        badgeText: "Xanh 🍀",
        msgIndex: 0,
        lastCollision: 0
    },
    {
        id: 2,
        name: "Bé Tím",
        x: 48,
        direction: -1,
        speed: 0.16,
        bodyColor: "#CDB4DB", // Tím pastel
        spikeColor: "#F3C4FB",
        badgeText: "Tím 🔮",
        msgIndex: 2,
        lastCollision: 0
    }
];

const CuteDinoIcon: React.FC<{
    className?: string;
    bodyColor?: string;
    spikeColor?: string;
    badgeText?: string;
}> = ({
    className = "w-14 h-14",
    bodyColor = "#7BC043",
    spikeColor = "#FFD000",
    badgeText = "Hi!"
}) => (
        <div className="relative">
            <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Yellow/Custom Spikes */}
                <polygon points="50,4 58,16 42,16" fill={spikeColor} stroke="#4A2C11" strokeWidth="2.5" strokeLinejoin="round" />
                <polygon points="72,14 82,28 66,26" fill={spikeColor} stroke="#4A2C11" strokeWidth="2.5" strokeLinejoin="round" />
                <polygon points="86,34 96,50 82,46" fill={spikeColor} stroke="#4A2C11" strokeWidth="2.5" strokeLinejoin="round" />

                {/* Dino Head Body */}
                <path d="M 22,60 C 18,25 35,12 55,12 C 78,12 88,28 85,62 C 82,88 65,94 48,94 C 28,94 24,80 22,60 Z" fill={bodyColor} stroke="#4A2C11" strokeWidth="3.5" strokeLinejoin="round" />

                {/* Dino Eyes */}
                <circle cx="34" cy="28" r="2.5" fill="#4A2C11" />
                <circle cx="56" cy="28" r="2.5" fill="#4A2C11" />

                {/* Dino Opened Mouth White Cavity */}
                <path d="M 24,44 Q 50,38 78,44 Q 76,78 48,78 Q 24,78 24,44 Z" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="3" strokeLinejoin="round" />

                {/* Top Teeth */}
                <polygon points="26,44 31,50 36,44" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="36,44 41,50 46,44" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="46,44 51,50 56,44" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="56,44 61,50 66,44" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="66,44 71,50 76,44" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />

                {/* Bottom Teeth */}
                <polygon points="28,76 33,70 38,76" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="38,76 43,70 48,76" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="48,76 53,70 58,76" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />
                <polygon points="58,76 63,70 68,76" fill="#FFFFFF" stroke="#4A2C11" strokeWidth="2" strokeLinejoin="round" />

                {/* Inner Character Face Details */}
                <ellipse cx="34" cy="62" rx="4.5" ry="2.5" fill="#FF85A1" opacity="0.8" />
                <ellipse cx="62" cy="62" rx="4.5" ry="2.5" fill="#FF85A1" opacity="0.8" />

                {/* Inner Eyes */}
                <circle cx="37" cy="56" r="3" fill="#4A2C11" />
                <circle cx="59" cy="56" r="3" fill="#4A2C11" />

                {/* Cute mouth (w expression) */}
                <path d="M 44,60 Q 48,64 50,60 Q 52,64 56,60" stroke="#4A2C11" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                {/* Tiny Dino Arms */}
                <path d="M 22,68 C 16,72 16,80 24,80" fill={bodyColor} stroke="#4A2C11" strokeWidth="2.5" />
                <path d="M 76,68 C 82,72 82,80 74,80" fill={bodyColor} stroke="#4A2C11" strokeWidth="2.5" />
            </svg>
            <span className="absolute -top-1 -right-2 bg-yellow-400 text-[#4A2C11] text-[9px] font-black px-1.5 py-0.5 rounded-full shadow border border-[#4A2C11]/20">
                {badgeText}
            </span>
        </div>
    );

export const FallingPetals: React.FC<{ defaultActive?: boolean; count?: number }> = ({
    defaultActive = true,
    count = 30
}) => {
    const [isPetalsActive, setIsPetalsActive] = useState<boolean>(defaultActive);
    const [isMascotActive, setIsMascotActive] = useState<boolean>(defaultActive);
    const [isBakeryOpen, setIsBakeryOpen] = useState<boolean>(false);
    const [isHerbGardenOpen, setIsHerbGardenOpen] = useState<boolean>(false);
    const [isCapsuleOpen, setIsCapsuleOpen] = useState<boolean>(false);
    const [isShooterOpen, setIsShooterOpen] = useState<boolean>(false);
    const [isDropMergeOpen, setIsDropMergeOpen] = useState<boolean>(false);
    const [isGameMenuOpen, setIsGameMenuOpen] = useState<boolean>(false);
    const [mascots, setMascots] = useState<MascotItem[]>(INITIAL_MASCOTS);
    const [explosions, setExplosions] = useState<ExplosionEffect[]>([]);

    const mascotsRef = useRef<MascotItem[]>(INITIAL_MASCOTS);
    mascotsRef.current = mascots;

    // Tự động xoay đổi câu thoại cho từng nhân vật
    useEffect(() => {
        const interval = setInterval(() => {
            setMascots((prev) =>
                prev.map((m) => ({
                    ...m,
                    msgIndex: (m.msgIndex + 1) % ENCOURAGING_MESSAGES.length
                }))
            );
        }, 11000);
        return () => clearInterval(interval);
    }, []);

    // Vòng lặp vật lý di chuyển và xử lý va chạm thời gian thực (real-time physics tick)
    useEffect(() => {
        if (!isMascotActive) return;

        let animId: number;
        let lastTime = performance.now();

        const tick = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta time
            lastTime = now;

            const currentMascots = mascotsRef.current.map((m) => ({ ...m }));
            const nowTime = Date.now();
            const newExplosions: ExplosionEffect[] = [];

            // 1. Cập nhật vị trí nhân vật
            for (let i = 0; i < currentMascots.length; i++) {
                const m = currentMascots[i];
                m.x += m.direction * m.speed * (dt * 60);

                // Nảy lại khi chạm mép màn hình
                if (m.x <= 2) {
                    m.x = 2;
                    m.direction = 1;
                } else if (m.x >= 90) {
                    m.x = 90;
                    m.direction = -1;
                }
            }

            // 2. Kiểm tra va chạm từng cặp nhân vật (Pairwise Collision Detection)
            const COLLISION_THRESHOLD = 6.5; // Khoảng cách phần trăm màn hình va chạm
            const COOLDOWN = 1400; // ms thời gian chờ nảy lại

            for (let i = 0; i < currentMascots.length; i++) {
                for (let j = i + 1; j < currentMascots.length; j++) {
                    const m1 = currentMascots[i];
                    const m2 = currentMascots[j];

                    const dist = Math.abs(m1.x - m2.x);

                    if (
                        dist < COLLISION_THRESHOLD &&
                        nowTime - m1.lastCollision > COOLDOWN &&
                        nowTime - m2.lastCollision > COOLDOWN
                    ) {
                        // Đổi hướng nhân vật khi đụng nhau
                        if (m1.x < m2.x) {
                            m1.direction = -1;
                            m2.direction = 1;
                        } else {
                            m1.direction = 1;
                            m2.direction = -1;
                        }

                        m1.lastCollision = nowTime;
                        m2.lastCollision = nowTime;
                        m1.isShaking = true;
                        m2.isShaking = true;

                        // Tạo hiệu ứng nổ tung tại vị trí va chạm
                        const collisionX = (m1.x + m2.x) / 2;
                        const explosionTexts = [
                            "💥 BOOM!", "⚡ POW!", "💕 BUMP!", "✨ Ú ÒA!", "🔥 NỔ TUNG!", "🎆 CHÍU CHÍU!"
                        ];
                        const randomText = explosionTexts[Math.floor(Math.random() * explosionTexts.length)];

                        const particleSymbols = ['💥', '✨', '⭐', '🔥', '💖', '🎉', '⚡', '🌟', '💥', '🌸'];
                        const particles: ExplosionParticle[] = Array.from({ length: 12 }, (_, pIdx) => {
                            const angle = (pIdx * 30 + Math.random() * 20 - 10) * (Math.PI / 180);
                            const distance = Math.floor(Math.random() * 55) + 35;
                            return {
                                id: pIdx,
                                symbol: particleSymbols[Math.floor(Math.random() * particleSymbols.length)],
                                tx: Math.cos(angle) * distance,
                                ty: Math.sin(angle) * distance - 20,
                                color: PALETTE[Math.floor(Math.random() * PALETTE.length)]
                            };
                        });

                        newExplosions.push({
                            id: nowTime + Math.random(),
                            x: collisionX,
                            text: randomText,
                            particles
                        });
                    }
                }
            }

            // Tắt trạng thái rung chấn sau 400ms
            for (let i = 0; i < currentMascots.length; i++) {
                if (currentMascots[i].isShaking && nowTime - currentMascots[i].lastCollision > 400) {
                    currentMascots[i].isShaking = false;
                }
            }

            setMascots(currentMascots);

            if (newExplosions.length > 0) {
                setExplosions((prev) => [...prev.slice(-6), ...newExplosions]);
            }

            animId = requestAnimationFrame(tick);
        };

        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, [isMascotActive]);

    // Tự động xóa bớt các hiệu ứng nổ cũ
    useEffect(() => {
        if (explosions.length === 0) return;
        const timer = setTimeout(() => {
            const now = Date.now();
            setExplosions((prev) => prev.filter((e) => now - e.id < 1200));
        }, 800);
        return () => clearTimeout(timer);
    }, [explosions]);

    const petals: PetalItem[] = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 98,
            size: Math.floor(Math.random() * 16) + 14,
            duration: Math.random() * 6 + 5,
            delay: Math.random() * 7,
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
            symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            rotation: Math.floor(Math.random() * 360),
            drift: (Math.random() - 0.5) * 120
        }));
    }, [count]);

    return (
        <>
            {/* Lớp hiển thị hiệu ứng hoa rơi */}
            {isPetalsActive && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-40 select-none">
                    {petals.map((petal) => (
                        <div
                            key={petal.id}
                            className="absolute top-[-50px] animate-petal"
                            style={{
                                left: `${petal.left}%`,
                                fontSize: `${petal.size}px`,
                                color: petal.color,
                                animationDuration: `${petal.duration}s`,
                                animationDelay: `${petal.delay}s`,
                                animationIterationCount: 'infinite',
                                animationTimingFunction: 'linear',
                                filter: `drop-shadow(0 2px 6px ${petal.color}40)`,
                                transform: `rotate(${petal.rotation}deg)`,
                                willChange: 'transform, opacity'
                            }}
                        >
                            <div
                                className="animate-drift"
                                style={{
                                    animationDuration: `${petal.duration * 0.8}s`,
                                    animationIterationCount: 'infinite'
                                }}
                            >
                                {petal.symbol}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Các hiệu ứng nổ tung hoành tráng khi nhân vật va chạm nhau */}
            {isMascotActive && (
                <div className="fixed bottom-10 inset-x-0 h-0 pointer-events-none z-45 select-none">
                    {explosions.map((exp) => (
                        <div
                            key={exp.id}
                            className="absolute bottom-4 flex items-center justify-center -translate-x-1/2"
                            style={{ left: `${exp.x}%` }}
                        >
                            {/* Sóng xung kích bùng nổ (Shockwave Ring) */}
                            <div className="absolute w-24 h-24 rounded-full border-4 border-yellow-400 bg-yellow-300/20 animate-shockwave" />

                            {/* Khung chữ thông báo tiếng nổ / va chạm */}
                            <div className="z-10 bg-gradient-to-r from-yellow-400 via-rose-500 to-purple-600 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-full shadow-2xl border-2 border-white animate-pop-bounce whitespace-nowrap">
                                {exp.text}
                            </div>

                            {/* Các hạt pháo hoa / ngôi sao văng ra các hướng */}
                            {exp.particles.map((p) => (
                                <div
                                    key={p.id}
                                    className="absolute text-base sm:text-xl transition-all duration-700 ease-out"
                                    style={{
                                        transform: `translate(${p.tx}px, ${p.ty}px) scale(1.2)`,
                                        opacity: 0.95,
                                        filter: `drop-shadow(0 0 8px ${p.color})`
                                    }}
                                >
                                    {p.symbol}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Biệt đội các nhân vật di chuyển qua lại trên màn hình */}
            {isMascotActive && (
                <div className="fixed bottom-2 inset-x-0 z-40 pointer-events-none select-none">
                    {mascots.map((m) => (
                        <div
                            key={m.id}
                            className="absolute bottom-0 flex flex-col items-center transition-transform duration-75"
                            style={{
                                left: `${m.x}%`,
                                transform: `translateX(-50%) ${m.isShaking ? 'scale(1.25) rotate(-10deg)' : 'scale(1)'}`
                            }}
                        >
                            <div className="animate-bob flex flex-col items-center">
                                {/* Khung lời thoại động nằm trên đầu nhân vật */}
                                <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold px-3 py-1 rounded-2xl shadow-xl shadow-pink-500/20 border border-white/40 backdrop-blur-md text-[11px] sm:text-xs whitespace-nowrap tracking-wide transition-all duration-500 animate-fadeIn">
                                    {ENCOURAGING_MESSAGES[m.msgIndex]}
                                </div>
                                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-purple-600 -mt-0.5 mb-0.5 opacity-90" />

                                {/* Nhân vật quay hướng theo chiều di chuyển */}
                                <div
                                    className="transition-transform duration-200"
                                    style={{ transform: m.direction === -1 ? 'scaleX(-1)' : 'scaleX(1)' }}
                                >
                                    <CuteDinoIcon
                                        className="w-13 h-13 sm:w-15 sm:h-15 drop-shadow-md"
                                        bodyColor={m.bodyColor}
                                        spikeColor={m.spikeColor}
                                        badgeText={m.badgeText}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cụm 3 nút góc dưới màn hình */}
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 pointer-events-auto select-none">
                {/* Menu chọn trò chơi mini-games */}
                <div className="relative">
                    {isGameMenuOpen && (
                        <div className="absolute bottom-12 right-0 bg-white/95 dark:bg-neutral-850 backdrop-blur-md border border-pink-200 dark:border-neutral-700 p-2 rounded-2xl shadow-2xl flex flex-col gap-1.5 min-w-[200px] animate-pop-bounce z-50">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 pt-1">
                                Trò Chơi Thư Giãn 🎮
                            </div>
                            <button
                                type="button"
                                onClick={() => { setIsBakeryOpen(true); setIsGameMenuOpen(false); }}
                                className="w-full px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-neutral-800 hover:bg-amber-100 dark:hover:bg-neutral-700 rounded-xl flex items-center gap-2 transition text-left"
                            >
                                <span className="text-base">🐱</span>
                                <span>Tiệm Trà Mèo & Bánh Ngọt</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsHerbGardenOpen(true); setIsGameMenuOpen(false); }}
                                className="w-full px-3 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-neutral-800 hover:bg-emerald-100 dark:hover:bg-neutral-700 rounded-xl flex items-center gap-2 transition text-left"
                            >
                                <span className="text-base">🌿</span>
                                <span>Vườn Dược Liệu & Đông Y</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsCapsuleOpen(true); setIsGameMenuOpen(false); }}
                                className="w-full px-3 py-2 text-xs font-bold text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-neutral-800 hover:bg-purple-100 dark:hover:bg-neutral-700 rounded-xl flex items-center gap-2 transition text-left"
                            >
                                <span className="text-base">💊</span>
                                <span>Ghép Viên Thuốc 2048</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsShooterOpen(true); setIsGameMenuOpen(false); }}
                                className="w-full px-3 py-2 text-xs font-bold text-rose-900 dark:text-rose-200 bg-rose-50 dark:bg-neutral-800 hover:bg-rose-100 dark:hover:bg-neutral-700 rounded-xl flex items-center gap-2 transition text-left"
                            >
                                <span className="text-base">🎯</span>
                                <span>Bắn Viên Thuốc Bào Chế</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsDropMergeOpen(true); setIsGameMenuOpen(false); }}
                                className="w-full px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-neutral-800 hover:bg-amber-100 dark:hover:bg-neutral-700 rounded-xl flex items-center gap-2 transition text-left"
                            >
                                <span className="text-base">🧪</span>
                                <span>Thả Viên Thuốc Hợp Nhất</span>
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
                        title="Mở Góc Giải Trí Mini-Games"
                        className="flex items-center gap-1.5 backdrop-blur-md border shadow-xl px-3.5 py-1.5 rounded-full text-xs font-black transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 text-white border-white/60 animate-bounce"
                    >
                        <Gamepad2 size={14} />
                        <span>🎮 Mini Games ({isGameMenuOpen ? '▲' : '▼'})</span>
                    </button>
                </div>

                {/* Nút bật/tắt hoa rơi */}
                <button
                    type="button"
                    onClick={() => setIsPetalsActive((prev) => !prev)}
                    title={isPetalsActive ? "Tắt hiệu ứng hoa rơi" : "Bật hiệu ứng hoa rơi"}
                    className={`flex items-center gap-1.5 backdrop-blur-md border shadow-lg px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 ${isPetalsActive
                        ? "bg-white/90 dark:bg-neutral-800/90 text-pink-600 dark:text-pink-400 border-pink-200/80 dark:border-neutral-700"
                        : "bg-white/70 dark:bg-neutral-800/70 text-gray-500 dark:text-gray-400 hover:text-pink-500 border-gray-200 dark:border-neutral-700 opacity-80"
                        }`}
                >
                    {isPetalsActive ? (
                        <>
                            <Sparkles size={14} className="animate-pulse" />
                            <span>Tắt hoa rơi</span>
                        </>
                    ) : (
                        <>
                            <Flower2 size={14} className="animate-spin-slow" />
                            <span>Bật hoa rơi</span>
                        </>
                    )}
                </button>

                {/* Nút bật/tắt biệt đội nhân vật va chạm */}
                <button
                    type="button"
                    onClick={() => setIsMascotActive((prev) => !prev)}
                    title={isMascotActive ? "Tắt biệt đội nhân vật" : "Bật biệt đội nhân vật"}
                    className={`flex items-center gap-1.5 backdrop-blur-md border shadow-lg px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 ${isMascotActive
                        ? "bg-white/90 dark:bg-neutral-800/90 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-neutral-700"
                        : "bg-white/70 dark:bg-neutral-800/70 text-gray-500 dark:text-gray-400 hover:text-emerald-500 border-gray-200 dark:border-neutral-700 opacity-80"
                        }`}
                >
                    <Users size={14} className={isMascotActive ? "animate-bounce" : ""} />
                    <span>{isMascotActive ? "Tắt biệt đội" : "Bật biệt đội"}</span>
                </button>
            </div>

            {/* Modal Mini-Game 1: Tiệm Trà Mèo & Bánh Ngọt */}
            <CatBobaBakeryModal
                isOpen={isBakeryOpen}
                onClose={() => setIsBakeryOpen(false)}
            />

            {/* Modal Mini-Game 2: Nông Trại Dược Liệu & Đông Y */}
            <HerbGardenModal
                isOpen={isHerbGardenOpen}
                onClose={() => setIsHerbGardenOpen(false)}
            />

            {/* Modal Mini-Game 3: Ghép Viên Thuốc 2048 */}
            <Capsule2048Modal
                isOpen={isCapsuleOpen}
                onClose={() => setIsCapsuleOpen(false)}
            />

            {/* Modal Mini-Game 4: Bắn Viên Thuốc Bào Chế (Egg Shooter) */}
            <PillBubbleShooterModal
                isOpen={isShooterOpen}
                onClose={() => setIsShooterOpen(false)}
            />

            {/* Modal Mini-Game 5: Thả Viên Thuốc Hợp Nhất (Suika Style Physics) */}
            <PillDropMergeModal
                isOpen={isDropMergeOpen}
                onClose={() => setIsDropMergeOpen(false)}
            />
        </>
    );
};

export default FallingPetals;
