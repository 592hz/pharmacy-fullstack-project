import { useState, useMemo, useEffect } from "react"
import { DollarSign, Calendar, TrendingUp, Activity, ShoppingCart, Flag, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { dashboardService } from "@/services/dashboard.service"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [summary, setSummary] = useState<any>(null)

    const currentMonthNum = useMemo(() => new Date().getMonth() + 1, [])
    const currentYearNum = useMemo(() => new Date().getFullYear(), [])

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const data = await dashboardService.getSummary()
                setSummary(data)
            } catch (error) {
                console.error("Dashboard data fetch error:", error)
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 relative">
                {stats.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                                <p className="text-2xl font-bold tracking-tight text-foreground">
                                    {item.value}
                                </p>
                                <p className="text-xs text-muted-foreground">{item.sub}</p>
                            </div>

                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color}`}
                            >
                                <Icon size={22} />
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
                                formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), name]}
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

            {/* Các thông tin phụ */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900/40">
                        <ShoppingCart size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Hóa đơn ngày</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">{statsData.billCountToday}</p>
                        <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/40">
                        <Flag size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Hàng cận date</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">{statsData.nearExpiryCount}</p>
                        <p className={`text-xs font-medium ${statsData.nearExpiryCount > 0 ? "text-red-500" : "text-green-500"}`}>
                            {statsData.nearExpiryCount > 0 ? "Cần kiểm tra" : "An toàn"}
                        </p>
                    </div>
                </div>

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

                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-900/40">
                        <Activity size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Hàng sắp hết</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">{statsData.lowStockCount}</p>
                        <p className="text-xs text-orange-500 font-medium">Cần nhập thêm</p>
                    </div>
                </div>
            </div>
        </div>
    )
}