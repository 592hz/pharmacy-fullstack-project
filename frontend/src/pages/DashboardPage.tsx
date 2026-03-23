import { useState, useMemo } from "react"
import { DollarSign, Calendar, TrendingUp, Activity, ShoppingCart, Flag, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { mockCategories } from "@/lib/mock-data"

const mockDataDay = [
    { name: '08:00', DoanhThu: 1200000, LoiNhuan: 300000 },
    { name: '10:00', DoanhThu: 2100000, LoiNhuan: 500000 },
    { name: '12:00', DoanhThu: 1800000, LoiNhuan: 450000 },
    { name: '14:00', DoanhThu: 2400000, LoiNhuan: 600000 },
    { name: '16:00', DoanhThu: 3200000, LoiNhuan: 800000 },
    { name: '18:00', DoanhThu: 4100000, LoiNhuan: 1200000 },
    { name: '20:00', DoanhThu: 2800000, LoiNhuan: 700000 },
]

const mockDataMonth = [
    { name: '01/03', DoanhThu: 15000000, LoiNhuan: 4000000 },
    { name: '02/03', DoanhThu: 18000000, LoiNhuan: 5000000 },
    { name: '03/03', DoanhThu: 16500000, LoiNhuan: 4500000 },
    { name: '04/03', DoanhThu: 21000000, LoiNhuan: 6000000 },
    { name: '05/03', DoanhThu: 19000000, LoiNhuan: 5500000 },
    { name: '06/03', DoanhThu: 24000000, LoiNhuan: 7000000 },
    { name: '07/03', DoanhThu: 22000000, LoiNhuan: 6500000 },
]

const mockDataYear = [
    { name: 'Tháng 1', DoanhThu: 450000000, LoiNhuan: 120000000 },
    { name: 'Tháng 2', DoanhThu: 520000000, LoiNhuan: 150000000 },
    { name: 'Tháng 3', DoanhThu: 480000000, LoiNhuan: 130000000 },
    { name: 'Tháng 4', DoanhThu: 560000000, LoiNhuan: 160000000 },
    { name: 'Tháng 5', DoanhThu: 610000000, LoiNhuan: 180000000 },
    { name: 'Tháng 6', DoanhThu: 590000000, LoiNhuan: 170000000 },
]


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export default function DashboardPage() {
    const [timeRange, setTimeRange] = useState<"day" | "month" | "year">("month")

    const currentMonthNum = useMemo(() => new Date().getMonth() + 1, [])
    const currentYearNum = useMemo(() => new Date().getFullYear(), [])

    const getChartData = () => {
        switch (timeRange) {
            case "day": return mockDataDay
            case "month": return mockDataMonth
            case "year": return mockDataYear
        }
    }

    const totalDay = mockDataDay.reduce((sum, item) => sum + item.DoanhThu, 0)
    const totalProfitDay = mockDataDay.reduce((sum, item) => sum + item.LoiNhuan, 0)

    const totalMonth = mockDataMonth.reduce((sum, item) => sum + item.DoanhThu, 0)
    const totalProfitMonth = mockDataMonth.reduce((sum, item) => sum + item.LoiNhuan, 0)

    const totalYear = mockDataYear.reduce((sum, item) => sum + item.DoanhThu, 0)
    const totalProfitYear = mockDataYear.reduce((sum, item) => sum + item.LoiNhuan, 0)

    //tổng thu chi tháng này
    const currentTotalIncome = mockCategories.filter(c => c.type === "Thu").reduce((sum, item) => sum + (item.amount || 0), 0)
    const currentTotalExpense = mockCategories.filter(c => c.type === "Chi").reduce((sum, item) => sum + (item.amount || 0), 0)

    //tổng thu chi tháng trước
    const previousTotalIncome = 150000000
    const previousTotalExpense = 25000000

    const incomeGrowth = previousTotalIncome ? ((currentTotalIncome - previousTotalIncome) / previousTotalIncome) * 100 : 0
    const expenseGrowth = previousTotalExpense ? ((currentTotalExpense - previousTotalExpense) / previousTotalExpense) * 100 : 0

    const stats = [
        {
            title: "Doanh thu ngày",
            value: formatCurrency(totalDay),
            sub: "Hôm nay",
            icon: Activity,
            color: "text-blue-500 bg-blue-100 dark:bg-blue-900/40",
        },
        {
            title: "Lợi nhuận ngày",
            value: formatCurrency(totalProfitDay),
            sub: "Hôm nay",
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
        {
            title: "Doanh thu tháng",
            value: formatCurrency(totalMonth),
            sub: `Tháng ${currentMonthNum}`,
            icon: Calendar,
            color: "text-orange-500 bg-orange-100 dark:bg-orange-900/40",
        },
        {
            title: "Lợi nhuận tháng",
            value: formatCurrency(totalProfitMonth),
            sub: `Tháng ${currentMonthNum}`,
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
        {
            title: "Doanh thu năm",
            value: formatCurrency(totalYear),
            sub: `Năm ${currentYearNum}`,
            icon: DollarSign,
            color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/40",
        },
        {
            title: "Lợi nhuận năm",
            value: formatCurrency(totalProfitYear),
            sub: `Năm ${currentYearNum}`,
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-6 p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                        <p className="text-sm text-muted-foreground">Theo dõi biểu đồ doanh thu và lợi nhuận</p>
                    </div>

                    <div className="flex items-center space-x-1 rounded-lg border bg-muted/40 p-1">
                        <button
                            onClick={() => setTimeRange("day")}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${timeRange === "day"
                                ? "bg-white dark:bg-neutral-800 text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => setTimeRange("month")}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${timeRange === "month"
                                ? "bg-white dark:bg-neutral-800 text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                        >
                            Tháng {currentMonthNum}
                        </button>
                        <button
                            onClick={() => setTimeRange("year")}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${timeRange === "year"
                                ? "bg-white dark:bg-neutral-800 text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                        >
                            Năm {currentYearNum}
                        </button>
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
                                formatter={(value: string | number | readonly (string | number)[] | undefined, name: string | number | undefined) => [formatCurrency(Number(Array.isArray(value) ? value[0] : value) || 0), name?.toString() || ""]}
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
                        <p className="text-2xl font-bold tracking-tight text-foreground">15</p>
                        <p className="text-xs text-muted-foreground">0 - Trả lại</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/40">
                        <Flag size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Hàng cận date</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">3</p>
                        <p className="text-xs text-red-500 font-medium">Cần xử lý gấp</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex min-w-[48px] h-12 w-12 items-center justify-center rounded-full bg-green-100 text-[#65a34e] dark:bg-green-900/40">
                        <TrendingUp size={22} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-muted-foreground truncate">Tổng thu tháng</p>
                        <p className="text-lg font-bold tracking-tight text-foreground truncate">{formatCurrency(currentTotalIncome)}</p>
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${incomeGrowth >= 0 ? "text-[#65a34e]" : "text-red-500"} truncate`}>
                            {incomeGrowth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(incomeGrowth).toFixed(1)}% so với tháng trước
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex min-w-[48px] h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/40">
                        <DollarSign size={22} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-muted-foreground truncate">Tổng chi tháng</p>
                        <p className="text-lg font-bold tracking-tight text-foreground truncate">{formatCurrency(currentTotalExpense)}</p>
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${expenseGrowth <= 0 ? "text-[#65a34e]" : "text-red-500"} truncate`}>
                            {expenseGrowth <= 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                            {Math.abs(expenseGrowth).toFixed(1)}% so với tháng trước
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-900/40">
                        <Activity size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Hàng sắp hết</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">8</p>
                        <p className="text-xs text-orange-500 font-medium">Dưới mức tồn kho tối thiểu</p>
                    </div>
                </div>
            </div>
        </div>
    )
}