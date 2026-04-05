import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface SecretMessageModalProps {
    isOpen: boolean
    onClose: () => void
}

const RosePetal = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M50 85 C30 85, 10 65, 10 45 C10 25, 30 15, 50 40 C70 15, 90 25, 90 45 C90 65, 70 85, 50 85Z"
            fill="currentColor"
        />
    </svg>
)

const RoseIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 100 100"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <g fill="currentColor">
            <path d="M50 50 C40 40, 30 45, 25 55 C20 65, 30 75, 50 75 C70 75, 80 65, 75 55 C70 45, 60 40, 50 50 Z" opacity="0.9" />
            <path d="M50 50 C45 35, 55 25, 65 25 C75 25, 85 35, 75 50 C65 65, 55 65, 50 50 Z" opacity="0.8" />
            <path d="M50 50 C55 35, 45 25, 35 25 C25 25, 15 35, 25 50 C35 65, 45 65, 50 50 Z" opacity="0.8" />
            <path d="M50 50 C40 45, 45 60, 50 70 C55 60, 60 45, 50 50 Z" opacity="1" />
        </g>
    </svg>
)

const petals = Array.from({ length: 30 })
const petalColors = [
    'text-rose-400/60',
    'text-pink-300/60',
    'text-red-500/40',
    'text-orange-200/50',
    'text-purple-300/40',
    'text-yellow-100/60'
];

export function SecretMessageModal({ isOpen, onClose }: SecretMessageModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setMounted(true)
        } else {
            const timer = setTimeout(() => setMounted(false), 500)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!mounted) return null

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            {/* Soft Overlay with Rose Blur */}
            <div className="absolute inset-0 bg-rose-50/60 dark:bg-neutral-950/80 backdrop-blur-2xl" />

            {/* Animated Rose Petals */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {petals.map((_, i) => {
                    const size = 20 + Math.random() * 30;
                    const duration = 15 + Math.random() * 20;
                    const delay = Math.random() * 15;
                    const driftDuration = 4 + Math.random() * 4;
                    const blur = Math.random() > 0.7 ? 'blur-[1px]' : '';
                    const colorClass = petalColors[Math.floor(Math.random() * petalColors.length)];

                    return (
                        <div
                            key={i}
                            className={`absolute animate-petal opacity-0 ${blur}`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${delay}s`,
                                animationDuration: `${duration}s`,
                                width: `${size}px`,
                                height: `${size}px`,
                            }}
                        >
                            <RosePetal
                                className={`${colorClass} animate-drift`}
                                style={{
                                    animationDuration: `${driftDuration}s`,
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Content Container */}
            <div
                className={`relative max-w-4xl w-full p-6 sm:p-8 text-center transition-all duration-1000 ${isOpen ? 'animate-bloom' : 'opacity-0 scale-95'} max-h-[95vh] flex flex-col items-center`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Centerpiece Rose */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
                    <div className="relative">
                        <RoseIcon className="text-rose-600 dark:text-rose-500 w-24 h-24 animate-pulse" />
                        <div className="absolute inset-0 bg-rose-500/30 blur-3xl rounded-full" />
                    </div>
                </div>

                {/* Glassmorphic Paper */}
                <div className="w-full bg-white/40 dark:bg-neutral-900/40 p-8 sm:p-16 rounded-[3.5rem] border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl ring-1 ring-black/5 overflow-y-auto scrollbar-hide">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-rose-800 dark:text-rose-300 tracking-tight leading-tight">
                        Dành cho bé của tôi...
                    </h2>

                    <div className="space-y-8">
                        <p className="text-xl sm:text-2xl text-gray-800 dark:text-gray-100 font-serif italic leading-relaxed">
                            "Dù ngày mai có ra sao, anh vẫn mong rằng khi ngoảnh lại, em sẽ mỉm cười thật dịu dàng - Một nụ cười của hạnh phúc và sự biết ơn vì tất cả những điều mình đã đi qua."
                        </p>

                        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium italic leading-relaxed px-4">
                            Nếu cuộc sống có lúc khiến em chùn bước bởi những khó khăn hay trắc trở, thì hãy xem đó như những bài học quý giá - Từng trải nghiệm sẽ giúp em trưởng thành hơn, mạnh mẽ hơn, và tiến gần hơn đến thành công.
                        </p>

                        <p className="text-lg text-rose-700 dark:text-rose-400 font-semibold italic">
                            Em đã cố gắng rất nhiều rồi. Tin anh đi, mọi chuyện rồi sẽ ổn thôi.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-2 mt-12 pt-8 border-t border-rose-100 dark:border-rose-900/30">
                        <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-rose-600/70 dark:text-rose-400/60 font-black">
                            Hãy cứ cười thật nhiều nhé - vì em xứng đáng với những điều tốt đẹp nhất.
                        </span>
                        <span className="text-2xl font-serif italic text-gray-400 dark:text-gray-600 mt-2">- Ngọc Thái -</span>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="mt-12 p-4 rounded-full bg-white/40 hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10 transition-all border border-white/50 dark:border-white/10 group shadow-lg"
                >
                    <X className="text-rose-900 dark:text-rose-200 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500" size={24} />
                </button>
            </div>
        </div>
    )
}
