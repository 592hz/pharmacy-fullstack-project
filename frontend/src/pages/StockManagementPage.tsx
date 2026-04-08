import { useState, useEffect, useMemo } from "react"
import { Search, Filter, RefreshCw, AlertTriangle, Package, Calendar, Trash2, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { type ProductCategory } from "@/lib/schemas"
import { type IProduct, type IProductBatch } from "@/types/product"
import { productService } from "@/services/product.service"
import { productCategoryService } from "@/services/product-category.service"
import { getErrorMessage } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

export default function StockManagementPage() {
    const [products, setProducts] = useState<IProduct[]>([])
    const [categories, setCategories] = useState<ProductCategory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [stockFilter, setStockFilter] = useState("Tất cả")
    const [categoryFilter, setCategoryFilter] = useState("Tất cả")
    const [displayLimit, setDisplayLimit] = useState(10)
    const [hideEmptyBatches, setHideEmptyBatches] = useState(false)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [productsData, categoriesData] = await Promise.all([
                productService.getAll(),
                productCategoryService.getAll()
            ])
            setProducts(productsData)
            setCategories(categoriesData)
        } catch (error: unknown) {
            toast.error("Lỗi tải dữ liệu: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteBatch = async (product: IProduct, batchNumber: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa lô "${batchNumber}" này không?\nLưu ý: Chỉ nên xóa nếu lô này nhập sai hoặc không còn cần theo dõi.`)) return

        try {
            const updatedBatches = (product.batches || []).filter(b => b.batchNumber !== batchNumber).map(b => ({
                batchNumber: b.batchNumber,
                expiryDate: b.expiryDate || "",
                quantity: b.quantity
            }))
            const newTotalQty = updatedBatches.reduce((sum, b) => sum + b.quantity, 0)
            
            await productService.update(product.id, { 
                batches: updatedBatches,
                baseQuantity: newTotalQty
            })
            
            toast.success(`Đã xóa lô ${batchNumber}`)
            fetchData()
        } catch (error: unknown) {
            toast.error("Lỗi khi xóa lô: " + getErrorMessage(error))
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Reset display limit when filters change
    useEffect(() => {
        setDisplayLimit(10)
    }, [debouncedSearchQuery, stockFilter, categoryFilter])


    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const query = debouncedSearchQuery.toLowerCase().trim()
            const name = product.name || ""
            const code = product.id || ""

            const matchesQuery = !query ||
                name.toLowerCase().includes(query) ||
                code.toLowerCase().includes(query)

            if (!matchesQuery) return false

            // Category Filter
            const prodCategoryId = typeof product.categoryId === 'object' && product.categoryId !== null 
                ? product.categoryId.id
                : product.categoryId
            if (categoryFilter !== "Tất cả" && prodCategoryId !== categoryFilter) return false

            // Stock Filter logic
            const totalQty = product.batches && product.batches.length > 0
                ? product.batches.reduce((sum: number, b: IProductBatch) => sum + b.quantity, 0)
                : (product.baseQuantity || 0)

            const unitType = (product.unit || "").toLowerCase()
            // nếu viên hàng tồn kho < 50 thì báo sắp hết hàng còn các đơn vị khác là 1 
            const lowStockThreshold = unitType === "viên" ? 50 : 1

            // Check if any batch is near expiry (within 6 months / 180 days)
            const hasNearExpiry = product.batches && product.batches.some((b: IProductBatch) => {
                if (!b.expiryDate || b.expiryDate === ".") return false
                try {
                    const [d, m, y] = b.expiryDate.split(/[-/]/).map(Number)
                    const expiry = new Date(y, m - 1, d)
                    const today = new Date()
                    const diffTime = expiry.getTime() - today.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return diffDays > 0 && diffDays <= 180
                } catch { return false }
            })

            if (stockFilter === "Hết hàng") return totalQty <= 0
            if (stockFilter === "Sắp hết hàng") return totalQty > 0 && totalQty <= lowStockThreshold
            if (stockFilter === "Sắp hết hạn") return hasNearExpiry
            if (stockFilter === "Còn hàng") return totalQty > lowStockThreshold

            return true
        })
    }, [products, debouncedSearchQuery, stockFilter, categoryFilter])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value)
    }

    const parseBatchDate = (dateStr: string) => {
        if (!dateStr || dateStr === "." || dateStr === "") return new Date(9999, 11, 31)
        try {
            const [d, m, y] = dateStr.split(/[-/]/).map(Number)
            const date = new Date(y, m - 1, d)
            return isNaN(date.getTime()) ? new Date(9999, 11, 31) : date
        } catch {
            return new Date(9999, 11, 31)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 bg-gray-50/50 dark:bg-neutral-950 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white uppercase tracking-widest">Kho dược & Hạn dùng</h1>
                    <p className="text-sm text-muted-foreground mt-1 text-gray-500 font-medium">Chế độ quản lý chuyên sâu cho thuốc và vật tư y tế</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all shadow-sm text-[#5c9a38]"
                >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Đồng bộ kho
                </button>
            </div>

            {/* Thống kê nhanh */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Package size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng mặt hàng</p>
                            <p className="text-xl font-bold">{products.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hết hàng</p>
                            <p className="text-xl font-bold text-red-600">{products.filter(p => (p.baseQuantity || 0) <= 0).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm border-l-4 border-l-orange-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg"><Filter size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sắp hết hàng</p>
                            <p className="text-xl font-bold text-orange-600">{products.filter(p => {
                                const qty = p.baseQuantity || 0
                                return qty > 0 && qty <= (p.unit?.toLowerCase() === "viên" ? 50 : 5)
                            }).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm border-l-4 border-l-red-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg"><Calendar size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cận date (6th)</p>
                            <p className="text-xl font-bold text-red-700">{products.filter(p => p.batches?.some(b => {
                                if (!b.expiryDate || b.expiryDate === ".") return false
                                try {
                                    const [d, m, y] = b.expiryDate.split(/[-/]/).map(Number)
                                    const expiry = new Date(y, m - 1, d)
                                    const diffTime = expiry.getTime() - new Date().getTime()
                                    return diffTime > 0 && diffTime <= 180 * 24 * 60 * 60 * 1000
                                } catch { return false }
                            })).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm tên thuốc, số đăng ký, mã vạch..."
                        className="w-full h-11 pl-10 pr-4 py-2 border border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50/50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all font-bold text-gray-700 font-sans"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="flex-1 md:w-48 h-11 px-3 py-2 border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-sm font-bold text-gray-600 font-sans"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="Tất cả">Nhóm hàng: Tất cả</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        className="flex-1 md:w-48 h-11 px-3 py-2 border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-sm font-bold text-gray-600 font-sans"
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                    >
                        <option value="Tất cả">Trạng thái: Tất cả</option>
                        <option value="Sắp hết hạn">⚠️ Sắp hết hạn</option>
                        <option value="Sắp hết hàng">📉 Sắp hết hàng</option>
                        <option value="Hết hàng">🚫 Đã hết hàng</option>
                        <option value="Còn hàng">✅ Còn hàng</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 select-none cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                     onClick={() => setHideEmptyBatches(!hideEmptyBatches)}>
                    <input 
                        type="checkbox" 
                        checked={hideEmptyBatches}
                        onChange={() => {}} // Controlled by div click
                        className="w-4 h-4 accent-[#5c9a38] rounded"
                    />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                        <EyeOff size={14} /> Ẩn lô hết hàng
                    </span>
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-neutral-800/50 border-b border-gray-100 dark:border-neutral-800">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/3">Tên thuốc & Mã SP</th>
                                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">ĐVT</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Tổng tồn kho</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Chi tiết theo lô (Hạn dùng)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Giá bán lẻ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <RefreshCw className="animate-spin text-[#5c9a38]" size={40} />
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Đang kiểm kê dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.slice(0, displayLimit).map((p) => {
                                    const totalQty = p.batches && p.batches.length > 0
                                        ? p.batches.reduce((sum, b) => sum + b.quantity, 0)
                                        : (p.baseQuantity || 0)

                                    const isLow = totalQty > 0 && totalQty <= (p.unit === "Viên" ? 50 : 5)
                                    const isOut = totalQty <= 0

                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-800 dark:text-gray-100 text-[14px] leading-tight group-hover:text-[#5c9a38] transition-colors uppercase">
                                                        {p.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-400 font-mono tracking-tighter bg-gray-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-neutral-700">{p.id}</span>
                                                        {p.isDQG && <span className="text-[9px] font-black text-blue-500 border border-blue-200 px-1 rounded uppercase">DQG</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-center">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded-md text-[10px] font-black text-gray-500 uppercase tracking-tight">
                                                    {p.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-xl font-black ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-[#4d7c0f]'}`}>
                                                        {totalQty}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{p.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="grid gap-2 min-w-[280px]">
                                                    {p.batches && p.batches.length > 0 ? (
                                                        p.batches
                                                        .filter(b => !hideEmptyBatches || b.quantity > 0)
                                                        .sort((a, b) => parseBatchDate(a.expiryDate || "").getTime() - parseBatchDate(b.expiryDate || "").getTime())
                                                        .map((b, i) => {
                                                            let isNearExpiry = false
                                                            try {
                                                                if (b.expiryDate) {
                                                                    const [d, m, y] = b.expiryDate.split(/[-/]/).map(Number)
                                                                    const expiry = new Date(y, m - 1, d)
                                                                    const diff = expiry.getTime() - new Date().getTime()
                                                                    isNearExpiry = diff > 0 && diff <= 180 * 24 * 60 * 60 * 1000
                                                                }
                                                            } catch { }

                                                            return (
                                                                <div key={i} className={`flex items-center justify-between p-2 rounded-xl border ${isNearExpiry ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40' : 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700'} shadow-sm group/batch`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-2 h-2 rounded-full ${isNearExpiry ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`}></div>
                                                                        <span className="font-mono text-[11px] text-gray-500 font-bold">{b.batchNumber}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className={`text-[11px] font-black tracking-tight flex items-center gap-1 ${isNearExpiry ? 'text-red-600' : 'text-gray-400'}`}>
                                                                            <Calendar size={12} /> {b.expiryDate}
                                                                        </span>
                                                                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 w-8 text-right italic">{b.quantity}</span>
                                                                        
                                                                        {b.quantity === 0 && (
                                                                            <button 
                                                                                onClick={() => handleDeleteBatch(p, b.batchNumber)}
                                                                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover/batch:opacity-100"
                                                                                title="Xóa lô trống"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400 italic font-medium">Không quản lý lô hàng</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-[#5c9a38] text-[15px]">
                                                {formatCurrency(p.retailPrice)}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Search size={48} />
                                            <span className="font-bold uppercase tracking-widest text-sm">Không tìm thấy sản phẩm phù hợp</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {!isLoading && filteredProducts.length > displayLimit && (
                    <div className="p-6 bg-gray-50/50 dark:bg-neutral-800/20 border-t border-gray-100 dark:border-neutral-800 text-center">
                        <button
                            onClick={() => setDisplayLimit(prev => prev + 10)}
                            className="px-8 py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-black text-[#5c9a38] hover:bg-green-50 dark:hover:bg-neutral-800 transition-all shadow-sm uppercase tracking-widest"
                        >
                            Xem thêm 10 sản phẩm tồn kho...
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
                            Đang hiển thị {displayLimit} / {filteredProducts.length} mặt hàng
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
