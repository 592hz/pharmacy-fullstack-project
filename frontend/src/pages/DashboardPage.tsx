import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { DollarSign, Calendar, TrendingUp, Activity, ShoppingCart, Flag, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { type DashboardSummary, type NearExpiryProduct, type LowStockProduct } from "@/lib/schemas"
import { dashboardService } from "@/services/dashboard.service"
import { getErrorMessage } from "@/lib/utils"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [lowStockLimit, setLowStockLimit] = useState(5)
    const [nearExpiryLimit, setNearExpiryLimit] = useState(5)

    const currentMonthNum = useMemo(() => new Date().getMonth() + 1, [])
    const currentYearNum = useMemo(() => new Date().getFullYear(), [])

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const data = await dashboardService.getSummary()
                setSummary(data)
            } catch (error: unknown) {
                console.error("Dashboard data fetch error:", getErrorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const getChartData = () => {
        if (!summary) return []
        return summary.chartData.month
    }

    if (isLoading && !summary) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#5c9a38]" size={48} />
            </div>
        )
    }

    const statsData = summary?.stats || {
        today: { revenue: 0, profit: 0 },
        month: { revenue: 0, profit: 0 },
        year: { revenue: 0, profit: 0 },
        totalIncome: 0,
        totalExpense: 0,
        lowStockCount: 0,
        nearExpiryCount: 0,
        lowStockProducts: [],
        nearExpiryProducts: [],
        billCountToday: 0
    }

    const stats = [
        {
            title: "Doanh thu ngày",
            value: formatCurrency(statsData.today.revenue),
            sub: "Hôm nay",
            icon: Activity,
            color: "text-blue-500 bg-blue-100 dark:bg-blue-900/40",
        },
        {
            title: "Lợi nhuận ngày",
            value: formatCurrency(statsData.today.profit),
            sub: "Hôm nay",
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
        {
            title: "Doanh thu tháng",
            value: formatCurrency(statsData.month.revenue),
            sub: `Tháng ${currentMonthNum}`,
            icon: Calendar,
            color: "text-orange-500 bg-orange-100 dark:bg-orange-900/40",
        },
        {
            title: "Lợi nhuận tháng",
            value: formatCurrency(statsData.month.profit),
            sub: `Tháng ${currentMonthNum}`,
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
        {
            title: "Doanh thu năm",
            value: formatCurrency(statsData.year.revenue),
            sub: `Năm ${currentYearNum}`,
            icon: DollarSign,
            color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/40",
        },
        {
            title: "Lợi nhuận năm",
            value: formatCurrency(statsData.year.profit),
            sub: `Năm ${currentYearNum}`,
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-6 p-4">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 relative">
                {stats.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-xl border bg-white dark:bg-neutral-900 p-3 sm:p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        >
                            <div className="space-y-0.5 sm:space-y-1">
                                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">{item.title}</p>
                                <p className="text-sm sm:text-xl font-black tracking-tight text-foreground truncate">
                                    {item.value.replace(" \u20ab", "")} <span className="text-[10px] font-normal font-mono opacity-50 sm:text-xs">đ</span>
                                </p>
                                <p className="text-[9px] sm:text-xs text-muted-foreground">{item.sub}</p>
                            </div>

                            <div
                                className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full shrink-0 ${item.color}`}
                            >
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Thống kê doanh thu */}
            <div className="flex min-h-[450px] flex-col rounded-xl border bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">Thống kê doanh thu</h2>
                        <p className="text-sm text-muted-foreground">Biểu đồ doanh thu và lợi nhuận tháng {currentMonthNum}</p>
                    </div>
                </div>

                <div className="flex-1 min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={getChartData()}
                            margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.2} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 13 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 13 }}
                                tickFormatter={(value) => `${value / 1000000}tr`}
                                dx={-10}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: unknown, name: string | number | undefined) => [formatCurrency(Number(value) || 0), String(name || "")]}
                                labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ paddingBottom: '20px' }}
                            />
                            <Bar
                                dataKey="DoanhThu"
                                name="Doanh thu"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="LoiNhuan"
                                name="Lợi nhuận"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Các thông tin phụ - 3 thẻ này giờ chiếm trọn hàng */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                <Link
                    to={`/export-manage?date=${new Date().toISOString().split("T")[0]}&type=Ngày`}
                    className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900/40">
                        <ShoppingCart size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Hóa đơn ngày</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">{statsData.billCountToday}</p>
                        <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                    </div>
                </Link>

                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex min-w-[48px] h-12 w-12 items-center justify-center rounded-full bg-green-100 text-[#65a34e] dark:bg-green-900/40">
                        <TrendingUp size={22} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-muted-foreground truncate">Tổng thu tháng</p>
                        <p className="text-lg font-bold tracking-tight text-foreground truncate">{formatCurrency(statsData.totalIncome)}</p>
                        <p className="text-[10px] text-muted-foreground">Từ thu chi ngoài</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex min-w-[48px] h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/40">
                        <DollarSign size={22} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-muted-foreground truncate">Tổng chi tháng</p>
                        <p className="text-lg font-bold tracking-tight text-foreground truncate">{formatCurrency(statsData.totalExpense)}</p>
                        <p className="text-[10px] text-muted-foreground">Từ thu chi ngoài</p>
                    </div>
                </div>


            </div>

            {/* Cảnh báo kho & Hạn dùng */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-1.5 h-6 bg-[#5c9a38] rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Cảnh báo tồn kho & Hạn dùng</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Hàng sắp hết hạn */}
                    <div className="rounded-2xl border bg-white dark:bg-neutral-900 shadow-md overflow-hidden transition-all hover:shadow-lg">
                        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 bg-red-50/50 dark:bg-red-900/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Flag className="text-red-500 animate-pulse" size={20} />
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[13px] uppercase tracking-wide">Sản phẩm sắp hết hạn (6 tháng)</h3>
                            </div>
                            <span className="text-[11px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1 rounded-full font-black">
                                {statsData.nearExpiryCount} mặt hàng
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px] text-left">
                                <thead className="bg-gray-50/50 dark:bg-neutral-900/50 text-gray-400 font-bold uppercase tracking-widest text-[9px] border-b border-gray-100 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3">Tên thuốc</th>
                                        <th className="px-2 py-3 text-center">Số lô</th>
                                        <th className="px-2 py-3 text-center">Hạn dùng</th>
                                        <th className="px-4 py-3 text-right">Tồn</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                    {statsData.nearExpiryProducts && statsData.nearExpiryProducts.length > 0 ? (
                                        statsData.nearExpiryProducts.slice(0, nearExpiryLimit).map((p: NearExpiryProduct, i: number) => (
                                            <tr key={i} className="hover:bg-red-50/30 dark:hover:bg-red-900/5 transition-colors">
                                                <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-200">{p.name}</td>
                                                <td className="px-2 py-4 text-center text-gray-500 font-mono text-[10px]">{p.batchNumber}</td>
                                                <td className="px-2 py-4 text-center font-bold text-red-500">{p.expiryDate}</td>
                                                <td className="px-4 py-4 text-right font-black text-gray-700 bg-gray-50/20">{p.quantity} <span className="text-[10px] font-normal text-gray-400">{p.unit}</span></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-gray-400 italic">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-gray-200" size={24} />
                                                    <span>Không có hàng cận date cần lưu ý</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {statsData.nearExpiryProducts && statsData.nearExpiryProducts.length > nearExpiryLimit && (
                            <div className="p-3 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/30 text-center">
                                <button
                                    onClick={() => setNearExpiryLimit(prev => prev + 10)}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-tighter"
                                >
                                    Xem thêm 10 sản phẩm cận date...
                                </button>
                            </div>
                        )}
                        <div className="p-4 bg-red-500 hover:bg-red-600 transition-colors text-center">
                            <Link
                                to="/stock?filter=Sắp hết hạn"
                                className="text-white font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Flag size={18} />
                                <span>Xem quản lý hàng cận date chi tiết</span>
                            </Link>
                        </div>
                    </div>

                    {/* Hàng sắp hết hàng */}
                    <div className="rounded-2xl border bg-white dark:bg-neutral-900 shadow-md overflow-hidden transition-all hover:shadow-lg">
                        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 bg-orange-50/50 dark:bg-orange-900/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="text-orange-500" size={20} />
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[13px] uppercase tracking-wide">Sản phẩm sắp hết hàng (≤ 1)</h3>
                            </div>
                            <span className="text-[11px] bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full font-black">
                                {statsData.lowStockCount} mặt hàng
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px] text-left">
                                <thead className="bg-gray-50/50 dark:bg-neutral-900/50 text-gray-400 font-bold uppercase tracking-widest text-[9px] border-b border-gray-100 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3">Tên thuốc</th>
                                        <th className="px-4 py-3 text-right">Số lượng tồn kho hiện tại</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                    {statsData.lowStockProducts && statsData.lowStockProducts.length > 0 ? (
                                        statsData.lowStockProducts.slice(0, lowStockLimit).map((p: LowStockProduct, i: number) => (
                                            <tr key={i} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/5 transition-colors">
                                                <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-200">{p.name}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded font-black">
                                                        {p.quantity} {p.unit}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="px-4 py-12 text-center text-gray-400 italic">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-gray-200" size={24} />
                                                    <span>Kho hàng đang ở trạng thái an toàn</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {statsData.lowStockProducts && statsData.lowStockProducts.length > lowStockLimit && (
                            <div className="p-3 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/30 text-center">
                                <button
                                    onClick={() => setLowStockLimit(prev => prev + 10)}
                                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-tighter"
                                >
                                    Xem thêm 10 sản phẩm...
                                </button>
                            </div>
                        )}
                        <div className="p-4 bg-orange-500 hover:bg-orange-600 transition-colors text-center">
                            <Link
                                to="/stock?filter=Sắp hết hàng"
                                className="text-white font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={18} />
                                <span>Xem chi tiết Quản lý kho</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}