import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Flower2 } from 'lucide-react';

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

const PALETTE = [
    '#ff4d6d', '#ff758f', '#ffb3c1', '#f72585', '#7209b7',
    '#3a0ca3', '#4361ee', '#4cc9f0', '#10b981', '#34d399',
    '#f59e0b', '#fbbf24', '#f97316', '#a855f7', '#ec4899'
];

const SYMBOLS = [
    '🍀', '🍀', '🍀', '🍀', // Cỏ 4 lá may mắn (tần suất xuất hiện cao)
    '🌸', '🌺', '🌼', '🌻', '🏵️', '🍃', '✨', '⭐', '🌟',
    '🧧', '💎', '🌈', '💖', '💕', '🌿', '🎋', '🎏', '🎈', '💐'
];

const ENCOURAGING_MESSAGES = [
    "Bé ơi hôm nay cố gắng rồi! 💪✨",
    "Chúc bé một ngày ngập tràn may mắn! 🍀✨",
    "Mọi điều tuyệt vời đang chờ bé phía trước! 🌟💖",
    "Cố lên nhé, bé đang làm rất tốt! 🚀🔥",
    "Chúc buôn may bán đắt và thuận lợi nhé! 💰🎉",
    "Nụ cười của bé làm bừng sáng cả ngày đấy! 😊✨",
    "Luôn tin tưởng vào bản thân mình nhé! 💖🌈",
    "Một ngày mới tràn đầy năng lượng và niềm vui! ☀️🍀",
    "Vẫn đang làm rất xuất sắc nha bé ơi! 👏⭐"
];

const CuteDinoIcon: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Yellow Spikes */}
        <polygon points="50,4 58,16 42,16" fill="#FFD000" stroke="#4A2C11" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="72,14 82,28 66,26" fill="#FFD000" stroke="#4A2C11" strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="86,34 96,50 82,46" fill="#FFD000" stroke="#4A2C11" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Green Dino Head Body */}
        <path d="M 22,60 C 18,25 35,12 55,12 C 78,12 88,28 85,62 C 82,88 65,94 48,94 C 28,94 24,80 22,60 Z" fill="#7BC043" stroke="#4A2C11" strokeWidth="3.5" strokeLinejoin="round" />

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
        <path d="M 22,68 C 16,72 16,80 24,80" fill="#7BC043" stroke="#4A2C11" strokeWidth="2.5" />
        <path d="M 76,68 C 82,72 82,80 74,80" fill="#7BC043" stroke="#4A2C11" strokeWidth="2.5" />
    </svg>
);

export const FallingPetals: React.FC<{ defaultActive?: boolean; count?: number }> = ({
    defaultActive = true,
    count = 30
}) => {
    const [isActive, setIsActive] = useState<boolean>(defaultActive);
    const [msgIndex, setMsgIndex] = useState<number>(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((prev) => (prev + 1) % ENCOURAGING_MESSAGES.length);
        }, 13000);
        return () => clearInterval(interval);
    }, []);

    const currentMessage = ENCOURAGING_MESSAGES[msgIndex];

    const petals: PetalItem[] = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 98,
            size: Math.floor(Math.random() * 16) + 14, // 14px to 30px
            duration: Math.random() * 6 + 5,           // 5s to 11s
            delay: Math.random() * 7,                  // 0s to 7s
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
            symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            rotation: Math.floor(Math.random() * 360),
            drift: (Math.random() - 0.5) * 120          // -60px to +60px sway
        }));
    }, [count]);

    if (!isActive) return (
        <button
            type="button"
            onClick={() => setIsActive(true)}
            title="Bật hiệu ứng hoa rơi"
            className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md text-pink-500 hover:text-pink-600 border border-pink-200 dark:border-neutral-700 shadow-lg px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
        >
            <Flower2 size={14} className="animate-spin-slow" />
            <span>Hoa rơi</span>
        </button>
    );

    return (
        <>
            {/* Lớp hiển thị hiệu ứng hoa rơi */}
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

            {/* Người nhỏ mặc đồ khủng long xanh với bóng thoại ngẫu nhiên ở trên đầu */}
            <div className="fixed bottom-2 left-0 z-40 pointer-events-none select-none animate-walk flex flex-col items-center">
                <div className="animate-bob flex flex-col items-center">
                    {/* Khung nội dung/lời thoại nằm TRÊN ĐẦU nhân vật, tự động đổi câu */}
                    <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl shadow-xl shadow-pink-500/25 border border-white/40 backdrop-blur-md text-xs sm:text-sm whitespace-nowrap tracking-wide transition-all duration-700 animate-fadeIn">
                        {currentMessage}
                    </div>
                    {/* Mũi tên bóng thoại chỉ xuống đầu khủng long */}
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-purple-600 -mt-0.5 mb-0.5 opacity-90" />

                    {/* Nhân vật khủng long ở phía dưới (chỉ quay nhân vật khi đổi chiều, chữ giữ nguyên) */}
                    <div className="relative animate-dino-turn">
                        <CuteDinoIcon className="w-14 h-14 drop-shadow-lg" />
                        <span className="absolute -top-1 -right-2 bg-yellow-400 text-[#4A2C11] text-[9px] font-black px-1.5 py-0.5 rounded-full shadow border border-[#4A2C11]/20">Hi!</span>
                    </div>
                </div>
            </div>

            {/* Nút tắt/bật nhanh ở góc dưới màn hình */}
            <button
                type="button"
                onClick={() => setIsActive(false)}
                title="Tắt hiệu ứng hoa rơi"
                className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md text-pink-600 dark:text-pink-400 border border-pink-200/80 dark:border-neutral-700 shadow-lg px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 pointer-events-auto"
            >
                <Sparkles size={14} className="animate-pulse" />
                <span>Tắt hoa rơi</span>
            </button>
        </>
    );
};

export default FallingPetals;
