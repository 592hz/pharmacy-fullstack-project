import { useState, useEffect } from "react"
import { 
    TrendingUp, 
    DollarSign, 
    ShoppingCart, 
    BarChart3, 
    Calendar,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react"
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend
} from "recharts"
import { reportService, type RevenueReportData } from "@/services/report.service"
import { getErrorMessage } from "@/lib/utils"
import { toast } from "sonner"
import * as XLSX from "xlsx"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value).replace(" ₫", " đ")
}

export default function RevenueReportPage() {
    const [data, setData] = useState<RevenueReportData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: ""
    })

    useEffect(() => {
        fetchReport()
    }, [dateRange])

    const fetchReport = async () => {
        setIsLoading(true)
        try {
            const result = await reportService.getRevenueReport(dateRange.startDate, dateRange.endDate)
            setData(result)
        } catch (error) {
            toast.error("Không thể tải báo cáo: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const exportToExcel = () => {
        if (!data) return
        
        const worksheet = XLSX.utils.json_to_sheet(data.monthlyData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Doanh Thu Thang")
        XLSX.writeFile(workbook, "Bao_Cao_Doanh_Thu.xlsx")
    }

    if (!data && isLoading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#5c9a38]" size={48} />
            </div>
        )
    }

    const summary = data?.summary || {
        current: { revenue: 0, profit: 0, totalOrders: 0 },
        previous: { revenue: 0, profit: 0, totalOrders: 0 },
        growth: { revenue: 0, profit: 0, orders: 0 }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Báo cáo doanh thu</h1>
                    <p className="text-sm text-gray-500">Phân tích hiệu quả kinh doanh & so sánh tăng trưởng hàng tháng</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <Download size={16} />
                        Xuất Excel
                    </button>
                    <div className="flex items-center bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-1 shadow-sm">
                        <input 
                            type="date"
                            className="bg-transparent border-none text-xs font-bold px-2 py-1 focus:ring-0 outline-none"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        />
                        <span className="text-gray-300 mx-1">→</span>
                        <input 
                            type="date"
                            className="bg-transparent border-none text-xs font-bold px-2 py-1 focus:ring-0 outline-none"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { 
                        label: "Tổng doanh thu", 
                        value: summary.current.revenue, 
                        growth: summary.growth.revenue,
                        icon: DollarSign,
                        color: "blue"
                    },
                    { 
                        label: "Lợi nhuận gộp", 
                        value: summary.current.profit, 
                        growth: summary.growth.profit,
                        icon: TrendingUp,
                        color: "green"
                    },
                    { 
                        label: "Số lượng đơn hàng", 
                        value: summary.current.totalOrders, 
                        growth: summary.growth.orders,
                        icon: ShoppingCart,
                        color: "orange"
                    },
                    { 
                        label: "Tỷ suất lợi nhuận", 
                        value: (summary.current.profit / (summary.current.revenue || 1)) * 100, 
                        isPercent: true,
                        icon: BarChart3,
                        color: "purple"
                    },
                ].map((stat, i) => {
                    const statusColor = stat.color === 'blue' ? 'text-blue-600 bg-blue-100' : 
                                      stat.color === 'green' ? 'text-green-600 bg-green-100' : 
                                      stat.color === 'orange' ? 'text-orange-600 bg-orange-100' : 'text-purple-600 bg-purple-100';
                    return (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-xl ${statusColor} dark:bg-opacity-20`}>
                                    <stat.icon size={20} />
                                </div>
                                {stat.growth !== undefined && (
                                    <div className={`flex items-center gap-0.5 text-[11px] font-black ${stat.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(stat.growth).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100">
                                {stat.isPercent ? `${stat.value.toFixed(1)}%` : formatCurrency(stat.value)}
                            </h3>
                        </div>
                    )
                })}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter flex items-center gap-2">
                            <Calendar className="text-[#5c9a38]" size={18} />
                            Biểu đồ tăng trưởng hàng tháng
                        </h3>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.monthlyData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} tickFormatter={(val) => `${val/1000000}tr`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: unknown) => formatCurrency(Number(val) || 0)}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Area type="monotone" name="Doanh thu" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" name="Lợi nhuận" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
                    <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter mb-8 flex items-center gap-2">
                        <ArrowUpRight className="text-orange-500" size={18} />
                        Top 10 sản phẩm doanh thu cao
                    </h3>
                    <div className="space-y-4">
                        {data?.topProducts.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-neutral-800 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-[#5c9a38] group-hover:text-white transition-colors">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{p.name}</p>
                                    <div className="w-full bg-gray-100 dark:bg-neutral-800 h-1 rounded-full mt-1 overflow-hidden">
                                        <div 
                                            className="bg-[#5c9a38] h-full transition-all duration-1000" 
                                            style={{ width: `${(p.revenue / (data.topProducts[0]?.revenue || 1)) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-[#5c9a38]">{formatCurrency(p.revenue)}</p>
                                    <p className="text-[9px] text-gray-400 font-bold">{p.quantity} sp</p>
                                </div>
                            </div>
                        ))}
                        {(!data?.topProducts || data.topProducts.length === 0) && (
                            <p className="text-center text-gray-400 text-xs py-8">Chưa có dữ liệu sản phẩm</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Comparison Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
                    <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Bảng so sánh doanh thu chi tiết qua các tháng</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-neutral-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Tháng</th>
                                <th className="px-6 py-4 text-right">Doanh thu</th>
                                <th className="px-6 py-4 text-right">Lợi nhuận</th>
                                <th className="px-6 py-4 text-right">Số đơn hàng</th>
                                <th className="px-6 py-4 text-right">Trung bình/Đơn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {data?.monthlyData.map((m, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-800/20 transition-colors">
                                    <td className="px-6 py-4 font-black text-gray-800 dark:text-gray-200">{m.month}</td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(m.revenue)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(m.profit)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300">{m.orders}</td>
                                    <td className="px-6 py-4 text-right font-bold text-orange-500">{formatCurrency(m.revenue / (m.orders || 1))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
