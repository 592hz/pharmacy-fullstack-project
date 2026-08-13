import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { DollarSign, Calendar, TrendingUp, Activity, ShoppingCart, Flag, Loader2, StickyNote, Plus, Pin, Trash2, Edit3, X, Save, ArrowRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { type DashboardSummary, type Note, noteSchema } from "@/lib/schemas"
import { dashboardService } from "@/services/dashboard.service"
import { noteService } from "@/services/note.service"
import { getErrorMessage } from "@/lib/utils"
import { toast } from "sonner"
import FallingPetals from "@/components/FallingPetals"

const NOTE_COLORS = [
    "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
    "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
    "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200",
    "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200",
    "bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-200",
    "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200",
]

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const fmtDate = (iso: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [chartMode, setChartMode] = useState<"week" | "month" | "custom" | "year">("month")

    const currentMonthNum = useMemo(() => new Date().getMonth() + 1, [])
    const currentYearNum = useMemo(() => new Date().getFullYear(), [])

    const [customMonth, setCustomMonth] = useState<number>(currentMonthNum)
    const [customYear, setCustomYear] = useState<number>(currentYearNum)

    // Notes state
    const [notes, setNotes] = useState<Note[]>([])
    const [isNotesLoading, setIsNotesLoading] = useState(true)
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [editingNote, setEditingNote] = useState<Note | null>(null)

    // Form state
    const [newTitle, setNewTitle] = useState("")
    const [newContent, setNewContent] = useState("")
    const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0])
    const [newIsPinned, setNewIsPinned] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const params = chartMode === "custom" ? { month: customMonth, year: customYear } : undefined
                const data = await dashboardService.getSummary(params)
                setSummary(data)
            } catch (error: unknown) {
                console.error("Dashboard data fetch error:", getErrorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [chartMode, customMonth, customYear])

    const fetchNotes = async () => {
        setIsNotesLoading(true)
        try {
            const data = await noteService.getAll()
            setNotes(data)
        } catch (error: unknown) {
            console.error("Fetch notes error:", getErrorMessage(error))
        } finally {
            setIsNotesLoading(false)
        }
    }

    useEffect(() => {
        fetchNotes()
    }, [])

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            return new Date(b.date).getTime() - new Date(a.date).getTime()
        })
    }, [notes])

    const handleAddNote = async () => {
        const result = noteSchema.safeParse({
            title: newTitle,
            content: newContent,
        })

        if (!result.success) {
            toast.error(result.error.issues[0].message)
            return
        }

        try {
            const date = new Date().toISOString()
            const newNote = await noteService.create({
                ...result.data,
                date: date,
                color: selectedColor,
                isPinned: newIsPinned
            })

            const completeNote: Note = {
                ...newNote,
                id: newNote.id || `NOTE${Date.now()}`,
                date: date,
                isPinned: newIsPinned
            }

            setNotes([completeNote, ...notes])

            setNewTitle("")
            setNewContent("")
            setNewIsPinned(false)
            setIsAddingNote(false)
            toast.success("Đã thêm ghi chú mới")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await noteService.delete(id)
            setNotes(notes.filter(n => n.id !== id))
            toast.success("Đã xóa ghi chú")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const updatedNote = { ...note, isPinned: !note.isPinned }
            const data = await noteService.update(note.id, updatedNote)
            setNotes(notes.map(n => n.id === data.id ? data : n))
            toast.success(updatedNote.isPinned ? "Đã ghim ghi chú" : "Đã bỏ ghim ghi chú")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const handleUpdateNote = async () => {
        if (!editingNote || !editingNote.id) return
        const result = noteSchema.safeParse(editingNote)
        if (!result.success) {
            toast.error(result.error.issues[0].message)
            return
        }

        try {
            const data = await noteService.update(editingNote.id, editingNote)
            setNotes(notes.map(n => n.id === data.id ? data : n))
            setEditingNote(null)
            toast.success("Đã cập nhật ghi chú")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const getChartData = () => {
        if (!summary || !summary.chartData) return []
        if (chartMode === "week") return summary.chartData.week || []
        if (chartMode === "year") return summary.chartData.year || []
        if (chartMode === "custom") return summary.chartData.customMonth || summary.chartData.month || []
        return summary.chartData.month || []
    }

    const statsData = summary?.stats || {
        today: { revenue: 0, profit: 0, netProfit: 0 },
        month: { revenue: 0, profit: 0, netProfit: 0 },
        year: { revenue: 0, profit: 0, netProfit: 0 },
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
            title: "LN bán hàng ngày",
            value: formatCurrency(statsData.today.profit),
            sub: "Hôm nay",
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
        {
            title: "LN thực tế ngày",
            value: formatCurrency(statsData.today.netProfit || 0),
            sub: "Đã trừ chi phí",
            icon: Flag,
            color: "text-purple-500 bg-purple-100 dark:bg-purple-900/40",
        },
        {
            title: "Doanh thu tháng",
            value: formatCurrency(statsData.month.revenue),
            sub: chartMode === "custom" ? `Tháng ${customMonth}/${customYear}` : `Tháng ${currentMonthNum}`,
            icon: Calendar,
            color: "text-orange-500 bg-orange-100 dark:bg-orange-900/40",
        },
        {
            title: "LN bán hàng tháng",
            value: formatCurrency(statsData.month.profit),
            sub: chartMode === "custom" ? `Tháng ${customMonth}/${customYear}` : `Tháng ${currentMonthNum}`,
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
        {
            title: "LN thực tế tháng",
            value: formatCurrency(statsData.month.netProfit || 0),
            sub: "Đã trừ chi phí",
            icon: Flag,
            color: "text-[#5c9a38] bg-[#5c9a38]/10 dark:bg-[#5c9a38]/20",
        },
        {
            title: "Doanh thu năm",
            value: formatCurrency(statsData.year.revenue),
            sub: `Năm ${currentYearNum}`,
            icon: DollarSign,
            color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/40",
        },
        {
            title: "LN bán hàng năm",
            value: formatCurrency(statsData.year.profit),
            sub: `Năm ${currentYearNum}`,
            icon: TrendingUp,
            color: "text-green-500 bg-green-100 dark:bg-green-900/40",
        },
        {
            title: "LN thực tế năm",
            value: formatCurrency(statsData.year.netProfit || 0),
            sub: "Đã trừ chi phí",
            icon: Flag,
            color: "text-rose-500 bg-rose-100 dark:bg-rose-900/40",
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 relative">
            {/* Hiệu ứng hoa rơi nhiều màu sắc */}
            <FallingPetals />

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
                        <p className="text-sm font-medium text-muted-foreground truncate">
                            Tổng thu tháng {chartMode === "custom" ? `${customMonth}/${customYear}` : `${currentMonthNum}`}
                        </p>
                        <p className="text-lg font-bold tracking-tight text-foreground truncate">{formatCurrency(statsData.totalIncome)}</p>
                        <p className="text-[10px] text-muted-foreground">Từ thu chi ngoài</p>
                    </div>
                </div>

                {/* biểu đồ thống kê doanh thu */}
                <div className="flex items-center space-x-4 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex min-w-[48px] h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/40">
                        <DollarSign size={22} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-muted-foreground truncate">
                            Tổng chi tháng {chartMode === "custom" ? `${customMonth}/${customYear}` : `${currentMonthNum}`}
                        </p>
                        <p className="text-lg font-bold tracking-tight text-foreground truncate">{formatCurrency(statsData.totalExpense)}</p>
                        <p className="text-[10px] text-muted-foreground">Từ thu chi ngoài</p>
                    </div>
                </div>
            </div>
            {/* Cụm 1: Hôm nay */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thống kê hôm nay</h3>
                </div>
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 relative">
                    {stats.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between rounded-xl border bg-white dark:bg-neutral-900 p-3 sm:p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <div className="space-y-0.5 sm:space-y-1">
                                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">{item.title}</p>
                                <p className="text-sm sm:text-xl font-black tracking-tight text-foreground truncate">
                                    {item.value.replace(" \u20ab", "")} <span className="text-[10px] font-normal font-mono opacity-50 sm:text-xs">đ</span>
                                </p>
                                <p className="text-[9px] sm:text-xs text-muted-foreground">{item.sub}</p>
                            </div>
                            <div className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full shrink-0 ${item.color}`}>
                                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Thống kê doanh thu ngày tháng năm */}
            <div className="flex min-h-[450px] flex-col rounded-xl border bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">Thống kê doanh thu & Lợi nhuận</h2>
                        <p className="text-sm text-muted-foreground">
                            {chartMode === "week" && "Biểu đồ doanh thu, lợi nhuận và số lượng đơn hàng 7 ngày qua"}
                            {chartMode === "month" && `Biểu đồ doanh thu, lợi nhuận và số lượng đơn hàng tháng ${currentMonthNum}/${currentYearNum}`}
                            {chartMode === "custom" && `Biểu đồ doanh thu, lợi nhuận và số lượng đơn hàng tháng ${customMonth}/${customYear}`}
                            {chartMode === "year" && `Biểu đồ doanh thu, lợi nhuận và số lượng đơn hàng 12 tháng năm ${currentYearNum}`}
                        </p>
                    </div>

                    {/* Bộ lọc khung thời gian biểu đồ */}
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                        {chartMode === "custom" && (
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
                                <span className="text-xs font-medium text-gray-500">Chọn:</span>
                                <select
                                    value={customMonth}
                                    onChange={(e) => setCustomMonth(Number(e.target.value))}
                                    className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
                                            Tháng {m}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-gray-400 text-xs font-bold">/</span>
                                <select
                                    value={customYear}
                                    onChange={(e) => setCustomYear(Number(e.target.value))}
                                    className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
                                >
                                    {[currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1].map(y => (
                                        <option key={y} value={y} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl border border-gray-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => setChartMode("week")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    chartMode === "week"
                                        ? "bg-white dark:bg-neutral-900 text-[#5c9a38] shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                7 ngày qua
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode("month")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    chartMode === "month"
                                        ? "bg-white dark:bg-neutral-900 text-[#5c9a38] shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Tháng này
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode("custom")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    chartMode === "custom"
                                        ? "bg-white dark:bg-neutral-900 text-[#5c9a38] shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Chọn tháng
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode("year")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    chartMode === "year"
                                        ? "bg-white dark:bg-neutral-900 text-[#5c9a38] shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                Năm nay
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[350px]">
                    {isLoading && !summary ? (
                        <div className="w-full h-[350px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-neutral-800/30 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 gap-3 text-muted-foreground animate-pulse">
                            <Loader2 className="animate-spin text-[#5c9a38]" size={32} />
                            <span className="text-xs font-medium">Đang tải dữ liệu biểu đồ...</span>
                        </div>
                    ) : (
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
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 13 }}
                                    tickFormatter={(value) => `${value / 1000000}tr`}
                                    dx={-10}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 12 }}
                                    tickFormatter={(value) => `${value} đơn`}
                                    dx={10}
                                    allowDecimals={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: unknown, name: string | number | undefined) => [
                                        name === "Số đơn hàng" ? `${Number(value) || 0} đơn hàng` : formatCurrency(Number(value) || 0),
                                        String(name || "")
                                    ]}
                                    labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px' }}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="DoanhThu"
                                    name="Doanh thu"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="LoiNhuan"
                                    name="Lợi nhuận"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="SoDon"
                                    name="Số đơn hàng"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            {/* Nhóm chỉ số Thống kê */}
            <div className="grid gap-6">
                {/* Cụm 2: Tháng này */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Thống kê tháng {chartMode === "custom" ? `${customMonth}/${customYear}` : currentMonthNum}
                        </h3>
                    </div>
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 relative">
                        {stats.slice(3, 6).map((item, index) => (
                            <div key={index} className="flex items-center justify-between rounded-xl border bg-white dark:bg-neutral-900 p-3 sm:p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <div className="space-y-0.5 sm:space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">{item.title}</p>
                                    <p className="text-sm sm:text-xl font-black tracking-tight text-foreground truncate">
                                        {item.value.replace(" \u20ab", "")} <span className="text-[10px] font-normal font-mono opacity-50 sm:text-xs">đ</span>
                                    </p>
                                    <p className="text-[9px] sm:text-xs text-muted-foreground">{item.sub}</p>
                                </div>
                                <div className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full shrink-0 ${item.color}`}>
                                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cụm 3: Năm nay */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thống kê năm {currentYearNum}</h3>
                    </div>
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 relative">
                        {stats.slice(6, 9).map((item, index) => (
                            <div key={index} className="flex items-center justify-between rounded-xl border bg-white dark:bg-neutral-900 p-3 sm:p-4 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <div className="space-y-0.5 sm:space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">{item.title}</p>
                                    <p className="text-sm sm:text-xl font-black tracking-tight text-foreground truncate">
                                        {item.value.replace(" \u20ab", "")} <span className="text-[10px] font-normal font-mono opacity-50 sm:text-xs">đ</span>
                                    </p>
                                    <p className="text-[9px] sm:text-xs text-muted-foreground">{item.sub}</p>
                                </div>
                                <div className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full shrink-0 ${item.color}`}>
                                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bảng ghi chú & Nhắc nhở */}
            <div className="mt-8 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#5c9a38] rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <StickyNote className="text-[#5c9a38]" size={24} />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                                Bảng Ghi Chú & Nhắc Nhở
                            </h2>
                        </div>
                        <span className="bg-[#5c9a38]/10 text-[#5c9a38] text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {notes.length} ghi chú
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={() => setIsAddingNote(true)}
                            className="bg-[#5c9a38] hover:bg-[#4d822f] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus size={16} />
                            Tạo ghi chú mới
                        </button>
                        <Link
                            to="/notes"
                            className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#5c9a38] dark:hover:text-[#5c9a38] flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 px-3.5 py-2 rounded-xl transition-all shadow-sm"
                        >
                            <span>Xem tất cả</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* Grid các ghi chú */}
                {isNotesLoading ? (
                    <div className="w-full h-48 flex items-center justify-center bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <Loader2 className="animate-spin text-[#5c9a38]" size={28} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Card tạo mới inline nếu ấn nút */}
                        {isAddingNote && (
                            <div className={`rounded-2xl border-2 p-5 shadow-lg flex flex-col gap-3 animate-in zoom-in-95 duration-200 ${selectedColor}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Ghi chú mới</span>
                                    <button onClick={() => setIsAddingNote(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                                        <X size={16} />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Tiêu đề ghi chú..."
                                    className="bg-transparent border-none outline-none font-bold text-base placeholder:text-current/40"
                                    autoFocus
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                                <textarea
                                    placeholder="Nội dung ghi chú..."
                                    className="bg-transparent border-none outline-none text-xs resize-none flex-1 min-h-[90px] placeholder:text-current/40 leading-relaxed"
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                />
                                <div className="flex items-center justify-between pt-3 border-t border-black/10">
                                    <div className="flex gap-1.5">
                                        {NOTE_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setSelectedColor(c)}
                                                className={`w-5 h-5 rounded-full border transition-all ${c.split(' ')[0]} ${selectedColor === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewIsPinned(!newIsPinned)}
                                            className={`p-1.5 rounded-lg transition-colors ${newIsPinned ? 'bg-amber-400 text-white' : 'bg-black/5 text-gray-400 hover:bg-black/10'}`}
                                            title={newIsPinned ? "Bỏ ghim" : "Ghim"}
                                        >
                                            <Pin size={15} fill={newIsPinned ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddNote}
                                            className="bg-gray-800 text-white p-1.5 rounded-lg hover:bg-black transition-colors shadow cursor-pointer"
                                        >
                                            <Save size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {sortedNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => setEditingNote(note)}
                                className={`group relative rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col gap-2.5 min-h-[180px] ${note.color || 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'}`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-bold text-base leading-tight group-hover:text-current transition-colors line-clamp-2 pr-6">
                                        {note.title}
                                    </h3>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => handleTogglePin(note, e)}
                                            className={`p-1 rounded-full transition-all ${note.isPinned ? 'text-amber-500 opacity-100' : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-black/5'}`}
                                        >
                                            <Pin size={15} fill={note.isPinned ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteNote(note.id, e)}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded-full transition-all"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs opacity-80 leading-relaxed line-clamp-3 flex-1">
                                    {note.content}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5 dark:border-white/10 opacity-60">
                                    <span className="text-[10px] font-bold tracking-tight">{fmtDate(note.date)}</span>
                                    <Edit3 size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}

                        {sortedNotes.length === 0 && !isAddingNote && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800 text-gray-400 gap-3">
                                <StickyNote size={48} className="opacity-30" />
                                <p className="text-sm font-medium">Chưa có ghi chú nào được tạo</p>
                                <button
                                    onClick={() => setIsAddingNote(true)}
                                    className="bg-[#5c9a38]/10 text-[#5c9a38] hover:bg-[#5c9a38]/20 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    + Thêm ghi chú đầu tiên
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Edit Note */}
            {editingNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200 ${editingNote.color || 'bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Chỉnh sửa ghi chú</span>
                            <button onClick={() => setEditingNote(null)} className="p-1.5 hover:bg-black/5 rounded-full transition-colors cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                className="w-full bg-transparent border-b border-black/10 dark:border-white/10 focus:border-[#5c9a38] outline-none font-bold text-xl py-1.5"
                                value={editingNote.title}
                                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                            />
                            <textarea
                                className="w-full bg-transparent border-none outline-none text-sm resize-none min-h-[160px] leading-relaxed"
                                value={editingNote.content}
                                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10">
                            <div className="flex gap-1.5">
                                {NOTE_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setEditingNote({ ...editingNote, color: c })}
                                        className={`w-6 h-6 rounded-full border transition-all ${c.split(' ')[0]} ${editingNote.color === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent'}`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingNote({ ...editingNote, isPinned: !editingNote.isPinned })}
                                    className={`p-2 rounded-xl transition-all border ${editingNote.isPinned ? 'bg-amber-400 border-amber-500 text-white' : 'bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500'}`}
                                    title={editingNote.isPinned ? "Bỏ ghim" : "Ghim"}
                                >
                                    <Pin size={18} fill={editingNote.isPinned ? "currentColor" : "none"} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateNote}
                                    className="bg-[#5c9a38] text-white px-5 py-2 rounded-xl hover:bg-[#4d822f] transition-all shadow font-bold text-xs active:scale-95 cursor-pointer"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}