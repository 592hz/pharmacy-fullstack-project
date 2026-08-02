import React, { useState, useMemo } from 'react';
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

const SYMBOLS = ['🌸', '🌺', '🌼', '🌻', '🏵️', '🍃', '✨', '🌸', '🌸', '🌺', '🌹', '🌸'];

export const FallingPetals: React.FC<{ defaultActive?: boolean; count?: number }> = ({
    defaultActive = true,
    count = 30
}) => {
    const [isActive, setIsActive] = useState<boolean>(defaultActive);

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

            {/* Nút tắt/bật nhanh ở góc dưới màn hình */}
            <button
                type="button"
                onClick={() => setIsActive(false)}
                title="Tắt hiệu ứng hoa rơi"
                className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md text-pink-600 dark:text-pink-400 border border-pink-200/80 dark:border-neutral-700 shadow-lg px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
                <Sparkles size={14} className="animate-pulse" />
                <span>Tắt hoa rơi</span>
            </button>
        </>
    );
};

export default FallingPetals;
