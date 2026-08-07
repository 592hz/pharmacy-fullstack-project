import React, { useState } from 'react';
import { Gamepad2, Sparkles, Coffee, Heart, Smile, Sprout, Pill, Target, FlaskConical } from 'lucide-react';
import CatBobaBakeryModal from '@/components/CatBobaBakeryModal';
import HerbGardenModal from '@/components/HerbGardenModal';
import Capsule2048Modal from '@/components/Capsule2048Modal';
import PillBubbleShooterModal from '@/components/PillBubbleShooterModal';
import PillDropMergeModal from '@/components/PillDropMergeModal';

export const EntertainmentPage: React.FC = () => {
    const [isBobaGameOpen, setIsBobaGameOpen] = useState<boolean>(false);
    const [isHerbGameOpen, setIsHerbGameOpen] = useState<boolean>(false);
    const [isCapsuleGameOpen, setIsCapsuleGameOpen] = useState<boolean>(false);
    const [isShooterGameOpen, setIsShooterGameOpen] = useState<boolean>(false);
    const [isDropMergeGameOpen, setIsDropMergeGameOpen] = useState<boolean>(false);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto animate-fadeIn">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black border border-white/30">
                        <Sparkles size={14} className="animate-spin-slow" />
                        <span>Góc Thư Giãn & Giải Trí Sau Giờ Làm</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm flex items-center justify-center sm:justify-start gap-2">
                        <span>Góc Giải Trí Mini Games 🎮</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-white/90 max-w-lg font-medium">
                        Thư giãn tinh thần, nạp lại năng lượng tích cực với các trò chơi dễ thương, xoa dịu áp lực công việc!
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsBobaGameOpen(true)}
                        className="px-3 py-2 bg-white text-rose-600 hover:bg-rose-50 font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1 border border-white/60"
                    >
                        <Coffee size={14} />
                        <span>Tiệm Trà Mèo 🐾</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsHerbGameOpen(true)}
                        className="px-3 py-2 bg-emerald-500 text-white hover:bg-emerald-600 font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1 border border-white/40"
                    >
                        <Sprout size={14} />
                        <span>Vườn Dược Liệu 🌿</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsDropMergeGameOpen(true)}
                        className="px-3 py-2 bg-amber-500 text-white hover:bg-amber-600 font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1 border border-white/40"
                    >
                        <FlaskConical size={14} />
                        <span>Thả Thuốc Hợp Nhất 🧪</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsShooterGameOpen(true)}
                        className="px-3 py-2 bg-rose-500 text-white hover:bg-rose-600 font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1 border border-white/40"
                    >
                        <Target size={14} />
                        <span>Bắn Thuốc 🎯</span>
                    </button>
                </div>
            </div>

            {/* Game Cards Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Card 1: Cat & Boba Bakery */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-amber-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🐱
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Tiệm Trà Mèo & Bánh Ngọt
                                </h3>
                                <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                                    HOT ✨
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Nhập vai chủ tiệm trà sữa, pha chế đồ uống ngọt ngào và bánh bakery phục vụ các bé mèo chibi đáng yêu!
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🧋 Pha trà sữa</span>
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🍰 Bánh ngọt</span>
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🔊 Nhạc ASMR</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsBobaGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <Gamepad2 size={16} />
                        <span>Mở Tiệm Trà Chơi Ngay 🐾</span>
                    </button>
                </div>

                {/* Card 2: Herb Garden Apothecary */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-emerald-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🌿
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Nông Trại & Tiệm Thuốc Đông Y
                                </h3>
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                                    HOT 🌸
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Trồng thảo dược (Nhân sâm, Hoa cúc, Bạc hà), tưới nước thu hoạch và bào chế thuốc trị bệnh cho các bé động vật!
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            <span className="bg-emerald-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🌱 Trồng cây</span>
                            <span className="bg-emerald-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🧪 Bào chế thuốc</span>
                            <span className="bg-emerald-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🐰 Bắt mạch động vật</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsHerbGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <Sprout size={16} />
                        <span>Vào Vườn Dược Liệu 🌿</span>
                    </button>
                </div>

                {/* Card 3: Suika Pill Drop & Merge Physics */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-amber-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🧪
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Thả Viên Thuốc Hợp Nhất
                                </h3>
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                                    MỚI 🔥
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Thả các hình cầu viên thuốc có số ngẫu nhiên xuống ống nghiệm. Khi 2 viên cùng số chạm nhau sẽ hợp nhất thành viên lớn hơn!
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🧪 Vật lý Suika Drop</span>
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">💥 Hợp nhất viên lớn</span>
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">👑 Vua Dược Phẩm 2048</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsDropMergeGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <FlaskConical size={16} />
                        <span>Thả Thuốc Hợp Nhất 🧪</span>
                    </button>
                </div>

                {/* Card 4: Pill Bubble Shooter */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-purple-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🎯
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Bắn Viên Thuốc Bào Chế
                                </h3>
                                <span className="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                                    HOT 🎯
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Bắn bóng viên thuốc kiểu Bắn Trứng Khủng Long! Bắn 3+ viên cùng loại nổ giòn tan tạo thành 1 Liều Thuốc hoàn chỉnh!
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                            <span className="bg-purple-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🎯 Bắn bóng thuốc</span>
                            <span className="bg-purple-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">💥 Nổ ghép liều thuốc</span>
                            <span className="bg-purple-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🏆 Luyện tinh mắt</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsShooterGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <Target size={16} />
                        <span>Bắn Thuốc Bào Chế 🎯</span>
                    </button>
                </div>

                {/* Card 5: Capsule 2048 Merge */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-pink-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            💊
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Ghép Viên Thuốc Vitamin 2048
                                </h3>
                                <span className="bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-pink-200">
                                    MỚI ⚡
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Di chuyển và kết hợp các viên thuốc vitamin để tạo ra Vua Dược Phẩm 2048mg với hiệu ứng nổ cực phê!
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-pink-700 dark:text-pink-300">
                            <span className="bg-pink-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🧩 Xếp hình 2048</span>
                            <span className="bg-pink-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🏆 Luyện trí tuệ</span>
                            <span className="bg-pink-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">👑 Vua Dược Phẩm</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCapsuleGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <Pill size={16} />
                        <span>Ghép Thuốc 2048 💊</span>
                    </button>
                </div>

                {/* Card 6: Affirmation & Chill */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-amber-100 dark:border-neutral-700 shadow-lg flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner">
                            🌸
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                Lời Nhắn Năng Lượng Tích Cực
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                                "Mỗi ngày làm việc đều là một bước tiến tuyệt vời. Bạn đang làm rất xuất sắc rồi nha!" 💖
                            </p>
                        </div>

                        <div className="p-3 bg-pink-50 dark:bg-neutral-700/50 rounded-2xl border border-pink-100 dark:border-neutral-600 text-xs font-bold text-pink-700 dark:text-pink-300 flex items-center gap-2">
                            <Heart size={16} className="text-rose-500 fill-rose-500 shrink-0 animate-pulse" />
                            <span>Chúc bạn luôn có những nụ cười rạng rỡ mỗi ngày!</span>
                        </div>
                    </div>

                    <div className="mt-5 text-center text-xs font-bold text-gray-400">
                        ✨ Relax & Enjoy Your Day ✨
                    </div>
                </div>

            </div>

            {/* Mini Game Modals */}
            <CatBobaBakeryModal
                isOpen={isBobaGameOpen}
                onClose={() => setIsBobaGameOpen(false)}
            />

            <HerbGardenModal
                isOpen={isHerbGameOpen}
                onClose={() => setIsHerbGameOpen(false)}
            />

            <Capsule2048Modal
                isOpen={isCapsuleGameOpen}
                onClose={() => setIsCapsuleGameOpen(false)}
            />

            <PillBubbleShooterModal
                isOpen={isShooterGameOpen}
                onClose={() => setIsShooterGameOpen(false)}
            />

            <PillDropMergeModal
                isOpen={isDropMergeGameOpen}
                onClose={() => setIsDropMergeGameOpen(false)}
            />
        </div>
    );
};

export default EntertainmentPage;
