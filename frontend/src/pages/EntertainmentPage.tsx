import React, { useState } from 'react';
import { Sparkles, FlaskConical, Swords, Zap, LayoutGrid, CircleDot, Hammer, HeartHandshake, Brain } from 'lucide-react';
import PillDropMergeModal from '@/components/PillDropMergeModal';
import GomokuCaroModal from '@/components/GomokuCaroModal';
import NumberFinderModal from '@/components/NumberFinderModal';
import PillTangramModal from '@/components/PillTangramModal';
import GoMasterModal from '@/components/GoMasterModal';
import WhackAMoleModal from '@/components/WhackAMoleModal';
import PiggybackMazeModal from '@/components/PiggybackMazeModal';
import PillMemoryCardModal from '@/components/PillMemoryCardModal';
import MedRushModal from '@/components/MedRushModal';

export const EntertainmentPage: React.FC = () => {
    const [isDropMergeGameOpen, setIsDropMergeGameOpen] = useState<boolean>(false);
    const [isCaroGameOpen, setIsCaroGameOpen] = useState<boolean>(false);
    const [isNumberFinderGameOpen, setIsNumberFinderGameOpen] = useState<boolean>(false);
    const [isTangramGameOpen, setIsTangramGameOpen] = useState<boolean>(false);
    const [isGoGameOpen, setIsGoGameOpen] = useState<boolean>(false);
    const [isWhackAMoleGameOpen, setIsWhackAMoleGameOpen] = useState<boolean>(false);
    const [isPiggybackGameOpen, setIsPiggybackGameOpen] = useState<boolean>(false);
    const [isMemoryGameOpen, setIsMemoryGameOpen] = useState<boolean>(false);
    const [isMedRushGameOpen, setIsMedRushGameOpen] = useState<boolean>(false);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto animate-fadeIn">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black border border-white/30">
                        <Sparkles size={14} className="animate-spin-slow" />
                        <span>Góc Thư Giãn & Giải Trí Sau Giờ Làm</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm flex items-center justify-center sm:justify-start gap-2">
                        <span>Góc Giải Trí Mini Games 🎮</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-white/90 max-w-lg font-medium">
                        Thư giãn tinh thần, xả stress với các trò chơi giải trí đấu trí, sáng tạo & rèn luyện phản xạ!
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setIsMedRushGameOpen(true)}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40 animate-pulse"
                    >
                        <Zap size={16} />
                        <span>MED RUSH 💊</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsMemoryGameOpen(true)}
                        className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40 animate-bounce"
                    >
                        <Brain size={16} />
                        <span>Lật Hình Tìm Cặp 🃏</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPiggybackGameOpen(true)}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40"
                    >
                        <HeartHandshake size={16} />
                        <span>Cõng Bạn Tìm Bi 🧑‍🤝‍🧑</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsWhackAMoleGameOpen(true)}
                        className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40"
                    >
                        <Hammer size={16} />
                        <span>Đập Thú 🔨</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsGoGameOpen(true)}
                        className="px-4 py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40"
                    >
                        <CircleDot size={16} />
                        <span>Cờ Vây Go ⚪⚫</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsTangramGameOpen(true)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40"
                    >
                        <LayoutGrid size={16} />
                        <span>Xếp Vỉ Thuốc 💊</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsNumberFinderGameOpen(true)}
                        className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40"
                    >
                        <Zap size={16} />
                        <span>Tìm Số Schulte 🔢</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsDropMergeGameOpen(true)}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40"
                    >
                        <FlaskConical size={16} />
                        <span>Thả Thuốc Hợp Nhất 🧪</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsCaroGameOpen(true)}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-white/40"
                    >
                        <Swords size={16} />
                        <span>Cờ Ca-rô Gomoku ❌⭕</span>
                    </button>
                </div>
            </div>

            {/* Game Cards Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Card Special: MED RUSH (Eggy Party Runner) */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 border-2 border-cyan-400/60 shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-white">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                    <div className="space-y-3 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            💊
                        </div>
                        <div>
                            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-cyan-500 to-indigo-500 text-white mb-1 shadow">
                                EGGY STYLE • PHẢN XẠ 🚀
                            </div>
                            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-200">
                                MED RUSH 💊🏃‍♂️
                            </h3>
                            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                Game runner phong cách Eggy Party! Nhanh tay điều khiển viên thuốc bật nhảy cực đỉnh qua chướng ngại vật & virus!
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between relative z-10">
                        <span className="text-[11px] font-bold text-slate-400">Double Jump • Nhạc Siêu Phê</span>
                        <button
                            type="button"
                            onClick={() => setIsMedRushGameOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500 hover:from-cyan-300 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-lg transition hover:scale-105 active:scale-95"
                        >
                            CHƠI MED RUSH 💊
                        </button>
                    </div>
                </div>

                {/* Card 00: Pill Memory Matching (Lật Hình Tìm Cặp Thuốc) */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-cyan-300 dark:border-cyan-700/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🃏
                        </div>
                        <div>
                            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 mb-1">
                                Mới Ra Mắt • Rèn Trí Nhớ 🧠
                            </div>
                            <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100">
                                Lật Hình Tìm Cặp Thuốc
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                                Thử thách siêu trí nhớ! Lật các lá bài 3D tìm cặp viên thuốc, serum & thảo dược đồng nhất trước khi hết giờ.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-700/50 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-neutral-400">4 Màn Chơi • 3D Flip</span>
                        <button
                            type="button"
                            onClick={() => setIsMemoryGameOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                        >
                            Chơi Ngay 🃏
                        </button>
                    </div>
                </div>

                {/* Card 0: Piggyback Maze (Cõng Bạn Tìm Thuốc & Bi) */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-rose-300 dark:border-rose-700/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🧑‍🤝‍🧑
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Cõng Bạn Tìm Thuốc & Bi
                                </h3>
                                <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-300">
                                    SIÊU HOT 🔥
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Game cõng nhân vật ăn bi ngọt ngào! Di chuyển qua các mê cung, thu thập bi vàng & ngọc quý, né quái ma ranh mãnh để về đích.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                            <span className="bg-rose-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🧑‍🤝‍🧑 Cõng bạn đời</span>
                            <span className="bg-rose-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🪙 Ăn bi & ngọc quý</span>
                            <span className="bg-rose-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">⏱️ Vượt 5 màn chơi</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsPiggybackGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <HeartHandshake size={16} />
                        <span>Chơi Cõng Bạn Tìm Bi 🧑‍🤝‍🧑</span>
                    </button>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-amber-300 dark:border-amber-700/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            ⚪⚫
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Tuyệt Đỉnh Cờ Vây (Go Master)
                                </h3>
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                                    MỚI HOT 🔥
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Môn thể thao trí tuệ hàng đầu thế giới! Bao vây đất đai, tính toán Khí và triệt hạ quân đối phương trên bàn cờ gỗ sang trọng.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">⚪⚫ Bàn 9x9, 13x13, 19x19</span>
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🤖 Đấu AI 3 Cấp độ</span>
                            <span className="bg-amber-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">📊 Tự động đếm Đất & Komi</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsGoGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-amber-700 via-amber-800 to-orange-900 hover:from-amber-800 hover:to-orange-950 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <CircleDot size={16} />
                        <span>Đấu Cờ Vây ⚪⚫</span>
                    </button>
                </div>

                {/* Card 1: Pill Tangram Grid Puzzle */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-emerald-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            💊
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Xếp Vỉ Thuốc Vào Hộp
                                </h3>
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                                    MỚI 🔥
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Game đố vui sắp xếp vỉ thuốc phong cách Tetris Tangram! Sắp xếp các khối vỉ thuốc vừa khít 100% vào khay 8x8 để ăn điểm kỷ lục.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            <span className="bg-emerald-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">💊 Xếp vỉ Polyomino</span>
                            <span className="bg-emerald-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🔄 Xoay vỉ 90°</span>
                            <span className="bg-emerald-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">💥 Tan biến hàng & cột</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsTangramGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <LayoutGrid size={16} />
                        <span>Xếp Vỉ Thuốc 💊</span>
                    </button>
                </div>

                {/* Card 2: Schulte Table Number Finder */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-cyan-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🔢
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Thử Thách Tìm Số 1..100
                                </h3>
                                <span className="bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-cyan-200">
                                    HOT 🔥
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Trò chơi Bảng Schulte rèn luyện mắt tinh tường & phản xạ nhanh! Tìm các số từ 1 đến 100 - Chọn sai quá 2 lần là THUA!
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                            <span className="bg-cyan-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🔢 Tìm số 1..100</span>
                            <span className="bg-cyan-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">⏱️ Đếm thời gian</span>
                            <span className="bg-cyan-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">💀 Sai quá 2 lần là thua</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsNumberFinderGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <Zap size={16} />
                        <span>Thử Thách Tìm Số 🔢</span>
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
                                    HOT 🔥
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

                {/* Card 4: Gomoku Caro Pro */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-rose-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            ❌⭕
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Cờ Ca-rô Gomoku Pro (12x12)
                                </h3>
                                <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                                    HOT 🚀
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Game cờ caro dân gian đấu trí cực cuốn! Đánh ❌ hoặc ⭕ tạo chuỗi 5 quân liên tiếp để giành chiến thắng.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                            <span className="bg-rose-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">❌⭕ 5 quân liên tiếp</span>
                            <span className="bg-rose-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🤖 Máy AI thông minh</span>
                            <span className="bg-rose-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🛡️ Luật chặn 2 đầu</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCaroGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <Swords size={16} />
                        <span>Đấu Cờ Ca-rô ❌⭕</span>
                    </button>
                </div>

                {/* Card 5: Whack-a-Mole (Đập Thú) */}
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-orange-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-neutral-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🔨
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                    Thử Thách Đập Thú (Whack-a-Mole)
                                </h3>
                                <span className="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-200">
                                    MỚI HOT 🔥
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                Game phản xạ siêu nhạy! Nhanh tay đập Chuột, Mèo thần tài & Thuốc bổ, né Bom độc để đạt chuỗi Combo đỉnh cao.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-orange-700 dark:text-orange-300">
                            <span className="bg-orange-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🐹 5 Loại sinh vật</span>
                            <span className="bg-orange-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">🔥 Chuỗi Combo x2 Điểm</span>
                            <span className="bg-orange-50 dark:bg-neutral-700 px-2 py-0.5 rounded-md">⏸️ Tính năng Tạm Dừng</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsWhackAMoleGameOpen(true)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-orange-500 via-amber-600 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                        <Hammer size={16} />
                        <span>Chơi Đập Thú 🔨</span>
                    </button>
                </div>

            </div>

            {/* Mini Game Modals */}
            <GoMasterModal
                isOpen={isGoGameOpen}
                onClose={() => setIsGoGameOpen(false)}
            />

            <PillTangramModal
                isOpen={isTangramGameOpen}
                onClose={() => setIsTangramGameOpen(false)}
            />

            <NumberFinderModal
                isOpen={isNumberFinderGameOpen}
                onClose={() => setIsNumberFinderGameOpen(false)}
            />

            <PillDropMergeModal
                isOpen={isDropMergeGameOpen}
                onClose={() => setIsDropMergeGameOpen(false)}
            />

            <GomokuCaroModal
                isOpen={isCaroGameOpen}
                onClose={() => setIsCaroGameOpen(false)}
            />

            <WhackAMoleModal
                isOpen={isWhackAMoleGameOpen}
                onClose={() => setIsWhackAMoleGameOpen(false)}
            />

            <PiggybackMazeModal
                isOpen={isPiggybackGameOpen}
                onClose={() => setIsPiggybackGameOpen(false)}
            />

            <PillMemoryCardModal
                isOpen={isMemoryGameOpen}
                onClose={() => setIsMemoryGameOpen(false)}
            />

            <MedRushModal
                isOpen={isMedRushGameOpen}
                onClose={() => setIsMedRushGameOpen(false)}
            />
        </div>
    );
};

export default EntertainmentPage;

