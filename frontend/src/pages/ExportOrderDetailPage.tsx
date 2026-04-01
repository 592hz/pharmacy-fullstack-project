import { useState, useMemo, useCallback, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AlertCircle, Search, PlusCircle, Trash2, Save, Printer, Calendar, User, FileText, LayoutDashboard, CreditCard, Wallet, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { type ExportOrder, type ExportOrderItem, type Product, exportOrderSchema } from "@/lib/schemas"
import { exportSlipService } from "@/services/export-slip.service"
import { productService } from "@/services/product.service"
import { paymentMethodService } from "@/services/payment-method.service"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"
import { parseFloatSafe, getErrorMessage } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { type PaymentMethod } from "@/lib/schemas"
import { useDebounce } from "@/hooks/use-debounce"

export default function ExportOrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const roundTo3 = (num: number) => Math.round((num + Number.EPSILON) * 1000) / 1000

    const [slip, setSlip] = useState<ExportOrder | null>(null)
    const [items, setItems] = useState<ExportOrderItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [notes, setNotes] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("")
    const [symptoms, setSymptoms] = useState("")
    const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>([])

    const fetchData = useCallback(async () => {
        if (!id) return
        setIsLoading(true)
        try {
            const [slipData, productsData, paymentMethodsData] = await Promise.all([
                exportSlipService.getById(id),
                productService.getAll(),
                paymentMethodService.getAll()
            ])
            setSlip(slipData)
            setItems(slipData.items || [])
            setNotes(slipData.notes || "")
            setPaymentMethod(slipData.paymentMethod || "")
            setSymptoms(slipData.symptoms || "")
            setAllProducts(productsData)
            setAllPaymentMethods(paymentMethodsData)
        } catch (error: unknown) {
            toast.error("Không thể tải thông tin phiếu xuất: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [showResults, setShowResults] = useState(false)
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const filteredSuggestions = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return []
        const query = debouncedSearchQuery.toLowerCase()
        return allProducts.filter(p =>
            (p.productName || p.name || "").toLowerCase().includes(query) ||
            ((p.id || p.productCode || "")).toLowerCase().includes(query)
        ).slice(0, 10)
    }, [allProducts, debouncedSearchQuery])

    const handleQuickAdd = useCallback((product: Product) => {
        const qty = 1
        const retailPrice = product.retailPrice || 0
        const importPrice = product.importPrice || 0
        const total = qty * retailPrice

        // Pick the earliest expiring batch if available
        const firstBatch = product.batches && product.batches.length > 0
            ? [...product.batches].sort((a, b) => {
                const dateA = a.expiryDate || "";
                const dateB = b.expiryDate || "";
                return dateA.localeCompare(dateB);
            })[0]
            : null

        const newItem: ExportOrderItem = {
            id: `new-${Date.now()}-${Math.random()}`,
            code: product.productCode || product.id || "",
            name: product.productName || product.name || "",
            unit: product.baseUnitName || product.unit || "",
            batchNumber: firstBatch?.batchNumber || "",
            expiryDate: firstBatch?.expiryDate || product.expiryDate || "",
            quantity: qty,
            retailPrice,
            importPrice,
            totalAmount: total,
            discountPercent: 0,
            discountAmount: 0,
            remainingAmount: total,
        }

        setItems(prev => [...prev, newItem])
        setSearchQuery("")
        setShowResults(false)
        toast.success(`Đã thêm nhanh: ${product.name}`)
    }, [])

    const formattedExportDate = useMemo(() => {
        if (!slip) return ""
        try {
            return new Date(slip.exportDate).toLocaleString("vi-VN").replace(/,/g, "")
        } catch {
            return ""
        }
    }, [slip])

    const handleProductSaved = useCallback((savedProduct: Product, formData: ProductFormData) => {
        const firstUnit = formData.units?.[0]
        const qty = 1
        const retailPrice = firstUnit?.retailPrice || 0
        const importPrice = firstUnit?.importPrice || 0
        const total = qty * retailPrice

        const newItem: ExportOrderItem = {
            id: `new-${Date.now()}-${Math.random()}`,
            code: savedProduct.id || formData.productCode || "",
            name: savedProduct.name || formData.productName,
            unit: firstUnit?.unitName || "",
            batchNumber: formData.batchNumber || "",
            expiryDate: formData.expiryDate || "",
            quantity: qty,
            retailPrice,
            importPrice,
            totalAmount: total,
            discountPercent: 0,
            discountAmount: 0,
            remainingAmount: total,
        }
        setItems(prev => [...prev, newItem])
    }, [])

    const handleCancelEdit = () => {
        if (slip) {
            setItems(slip.items || [])
            setNotes(slip.notes || "")
            setPaymentMethod(slip.paymentMethod || "")
        }
        setIsEditing(false)
        toast.info("Đã hủy thay đổi")
    }

    const handleToggleEdit = () => {
        if (isEditing) {
            setIsEditing(false)
            toast.success("Đã thoát chế độ chỉnh sửa")
        } else {
            setIsEditing(true)
            toast.info("Đã bật chế độ chỉnh sửa")
        }
    }

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
        toast.error("Đã xóa sản phẩm khỏi phiếu")
    }

    const updateItemField = useCallback((id: string, field: keyof ExportOrderItem, value: string | number | boolean) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item

            const updatedItem = { ...item, [field]: value }

            if (['quantity', 'retailPrice', 'importPrice', 'discountPercent'].includes(field as string)) {
                const qty = parseFloatSafe(updatedItem.quantity)
                const price = parseFloatSafe(updatedItem.retailPrice)
                const discPct = parseFloatSafe(updatedItem.discountPercent)

                updatedItem.totalAmount = qty * price
                updatedItem.discountAmount = Math.round(updatedItem.totalAmount * discPct / 100)
                updatedItem.remainingAmount = updatedItem.totalAmount - updatedItem.discountAmount
            }

            return updatedItem
        }))
    }, [])

    const handleSaveOrder = async () => {
        if (!slip || !id) return

        const updatedSlip: ExportOrder = {
            ...slip,
            notes,
            symptoms,
            paymentMethod,
            items: items.map(item => ({
                ...item,
                id: item.id || `ITEM-${Date.now()}-${Math.random()}`,
                quantity: Number(item.quantity),
                retailPrice: Number(item.retailPrice),
                importPrice: Number(item.importPrice),
                totalAmount: Number(item.totalAmount),
                discountPercent: Number(item.discountPercent),
                discountAmount: Number(item.discountAmount),
                remainingAmount: Number(item.remainingAmount)
            })),
            totalAmount: roundTo3(totalAmount),
            grandTotal: roundTo3(amountToPay)
        }

        // Validate using schema
        const validation = exportOrderSchema.safeParse(updatedSlip)
        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        try {
            await exportSlipService.update(id, updatedSlip)
            setSlip(updatedSlip)
            setIsEditing(false)
            toast.success("Đã lưu thay đổi phiếu xuất")
        } catch (error: unknown) {
            toast.error("Lỗi khi lưu phiếu xuất: " + getErrorMessage(error))
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-[#5c9a38] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">Đang tải thông tin phiếu xuất...</p>
            </div>
        )
    }

    if (!slip) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Không tìm thấy phiếu xuất</h2>
                <button
                    onClick={() => navigate("/export-manage")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Quay lại danh sách
                </button>
            </div>
        )
    }

    const vnd = (val: number) => val.toLocaleString("vi-VN")

    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0)
    const totalImport = items.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0)
    const amountToPay = totalAmount - totalDiscount
    const totalProfit = amountToPay - totalImport

    return (
            <div className="flex-none bg-white dark:bg-neutral-900 shadow-sm z-20">
                {/* ── TOP NAV BAR ── */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate("/export-manage")}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full text-gray-500 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <FileText size={24} className="text-[#5c9a38]" />
                            Chi tiết phiếu xuất
                        </h1>
                        <span className="px-2 py-0.5 bg-[#5c9a38]/10 text-[#5c9a38] text-[10px] font-black rounded uppercase tracking-wider">
                            {slip.id}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleSaveOrder}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all transform active:scale-95"
                                >
                                    <Save size={18} /> LƯU THAY ĐỔI
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleToggleEdit}
                                className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-6 py-2 rounded-xl text-sm font-black shadow-lg shadow-[#5c9a38]/20 flex items-center gap-2 transition-all transform active:scale-95"
                            >
                                <LayoutDashboard size={18} /> SỬA PHIẾU
                            </button>
                        )}
                        <button className="p-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors" title="In phiếu">
                            <Printer size={20} />
                        </button>
                    </div>
                </div>

                {/* ── METADATA GRID ── */}
                <div className="px-6 py-5 bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800">
                    <div className="grid grid-cols-12 gap-6 max-w-[1600px]">
                        {/* Customer Info Card */}
                        <div className="col-span-3 bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 text-gray-100 dark:text-neutral-700 group-hover:text-gray-200 transition-colors">
                                <User size={48} />
                            </div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Khách hàng</label>
                            <div className="text-lg font-black text-gray-800 dark:text-white truncate">
                                {slip.customerName}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#5c9a38] rounded-full"></span>
                                {slip.isPrescription ? "Bán theo đơn thuốc" : "Bán lẻ thông thường"}
                            </div>
                        </div>

                        {/* Order Identity & Symptoms */}
                        <div className="col-span-6 grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#5c9a38] uppercase tracking-[0.2em] flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-[#5c9a38] rounded-full"></div>
                                    Triệu chứng bệnh
                                </label>
                                <input
                                    type="text"
                                    value={symptoms}
                                    placeholder="Không có dữ liệu triệu chứng..."
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all border-2 ${
                                        isEditing 
                                        ? 'bg-white border-red-200 dark:bg-neutral-800 dark:border-red-900/30 text-red-600 font-bold focus:ring-4 focus:ring-red-500/10' 
                                        : 'bg-transparent border-transparent text-gray-700 dark:text-gray-300 font-bold italic opacity-80'
                                    }`}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                    Ghi chú nhanh
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    placeholder="Thêm ghi chú tại đây..."
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all border-2 ${
                                        isEditing 
                                        ? 'bg-white border-blue-200 dark:bg-neutral-800 dark:border-blue-900/30 text-blue-600 font-bold focus:ring-4 focus:ring-blue-500/10' 
                                        : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 font-medium opacity-60'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Logistics info */}
                        <div className="col-span-3 grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <CreditCard size={10} /> Thanh toán
                                </label>
                                {isEditing ? (
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-4 focus:ring-[#5c9a38]/10"
                                    >
                                        <option value="">Chọn...</option>
                                        {allPaymentMethods.map(m => (
                                            <option key={m.id || m.name} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-neutral-800 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-neutral-700">
                                        {paymentMethod || "Tiền mặt"}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar size={10} /> Thời gian
                                </label>
                                <div className="text-sm font-mono font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-neutral-800 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-neutral-700 truncate">
                                    {formattedExportDate}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SEARCH BAR (Integrated) ── */}
                <div className="px-6 py-4 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
                    <div className="relative group max-w-4xl">
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-800 border-2 border-transparent focus-within:bg-white focus-within:border-[#5c9a38]/30 focus-within:ring-4 focus-within:ring-[#5c9a38]/5 rounded-2xl transition-all px-4 py-1">
                            <Search size={20} className="text-gray-400 group-focus-within:text-[#5c9a38] transition-colors" />
                            <input
                                type="text"
                                placeholder="Gõ tên sản phẩm để thêm vào phiếu này..."
                                className="flex-1 bg-transparent border-none outline-none text-sm py-3 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setShowResults(true)
                                }}
                                onFocus={() => setShowResults(true)}
                                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            />
                            <div className="h-6 w-px bg-gray-200 dark:bg-neutral-700 mx-2"></div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-[#5c9a38]/10 text-[#5c9a38] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#5c9a38]/20 transition-all"
                            >
                                <PlusCircle size={14} /> Thêm mới
                            </button>
                        </div>

                    {showResults && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {filteredSuggestions.length > 0 ? (
                                <div className="max-h-[300px] overflow-y-auto p-2">
                                    {filteredSuggestions.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleQuickAdd(product)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors text-left group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{product.name}</span>
                                                <span className="text-[10px] text-gray-500">{product.id} - ĐVT: {product.unit}</span>
                                            </div>
                                            <div className="text-blue-600 text-[10px] font-bold">THÊM NHANH</div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-500">Không tìm thấy sản phẩm</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AddProductModal
                key={showAddModal ? "open" : "closed"}
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleProductSaved}
            />

            {/* ── PRODUCTS TABLE ── */}
            <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900 border-x border-gray-100 dark:border-neutral-800 mx-6 my-4 rounded-2xl shadow-inner shadow-gray-50 dark:shadow-neutral-950/50 relative">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-gray-50 dark:bg-neutral-800/80 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 first:rounded-tl-2xl">Mã SP</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700">Tên sản phẩm</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 w-20">ĐVT</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700">Số lô</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700">Hạn dùng</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 text-right">Số lượng</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 text-right">Giá nhập</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 text-right">Giá bán</th>
                            <th className="px-4 py-4 text-[10px] font-black text-[#5c9a38] uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 text-right">Thành tiền</th>
                            <th className="px-4 py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-gray-100 dark:border-neutral-700 text-right last:rounded-tr-2xl">Lợi nhuận</th>
                            {isEditing && <th className="px-4 py-4 border-b border-gray-100 dark:border-neutral-700 w-12"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="py-10 text-center text-gray-400">Chưa có sản phẩm nào.</td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                                    <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{item.code}</td>
                                    <td className="px-4 py-3.5">
                                        <div className="text-sm font-black text-gray-800 dark:text-gray-200">{item.name}</div>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase">{item.unit}</td>
                                    <td className="px-4 py-3.5 text-xs font-bold text-gray-600 dark:text-gray-400">
                                        {isEditing ? (
                                            <input type="text" className="w-full bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700 rounded-lg px-2 py-1 text-center font-bold outline-none focus:border-[#5c9a38]/30" value={item.batchNumber || ""} onChange={(e) => updateItemField(item.id!, 'batchNumber', e.target.value)} />
                                        ) : item.batchNumber}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs font-bold text-red-500/80">
                                        {isEditing ? (
                                            <input type="text" className="w-full bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700 rounded-lg px-2 py-1 text-center font-bold outline-none focus:border-[#5c9a38]/30" value={item.expiryDate || ""} onChange={(e) => updateItemField(item.id!, 'expiryDate', e.target.value)} />
                                        ) : item.expiryDate}
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        {isEditing ? (
                                            <NumericInput className="w-20 bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700 rounded-lg px-2 py-1 text-right font-black outline-none focus:border-[#5c9a38]/30" value={Number(item.quantity)} onChange={(v) => updateItemField(item.id!, 'quantity', v)} />
                                        ) : <span className="text-sm font-black text-gray-700 dark:text-gray-200">{item.quantity}</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-400">
                                        {isEditing ? (
                                            <NumericInput className="w-24 bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700 rounded-lg px-2 py-1 text-right outline-none focus:border-[#5c9a38]/30" value={Number(item.importPrice)} onChange={(v) => updateItemField(item.id!, 'importPrice', v)} />
                                        ) : vnd(item.importPrice)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-gray-600 dark:text-gray-300">
                                        {isEditing ? (
                                            <NumericInput className="w-28 bg-white dark:bg-neutral-800 border-2 border-gray-100 dark:border-neutral-700 rounded-lg px-2 py-1 text-right font-bold outline-none focus:border-[#5c9a38]/30 text-green-600" value={Number(item.retailPrice)} onChange={(v) => updateItemField(item.id!, 'retailPrice', v)} />
                                        ) : vnd(item.retailPrice)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-base font-black text-[#5c9a38] group-hover:scale-105 transition-transform origin-right">
                                        {vnd(item.remainingAmount)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-blue-500/70 italic bg-blue-50/10">
                                        {vnd(item.remainingAmount - (item.quantity * item.importPrice))}
                                    </td>
                                    {isEditing && (
                                        <td className="px-4 py-3.5 text-center">
                                            <button onClick={() => removeItem(item.id!)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── FOOTER TOTALS ── */}
            <div className="flex-none bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 p-6 z-20">
                <div className="flex flex-col lg:flex-row justify-between items-end gap-10 max-w-[1600px] mx-auto">
                    {/* Status badges */}
                    <div className="hidden lg:flex flex-col gap-3 mr-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tình trạng phiếu</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                slip.paymentStatus === 'Đã thanh toán' 
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' 
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'
                            }`}>
                                {slip.paymentStatus || "Chưa thanh toán"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhân viên tạo</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-neutral-800 rounded-full border border-gray-100 dark:border-neutral-700">
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">A</div>
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{slip.createdBy}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-8 flex-1">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <Wallet size={12} /> Tổng giá nhập
                            </span>
                            <span className="text-xl text-gray-400 dark:text-neutral-600 font-mono font-bold tracking-tight">{vnd(totalImport)}</span>
                        </div>
                        <div className="h-10 w-px bg-gray-100 dark:bg-neutral-800 mt-2"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <LayoutDashboard size={12} /> Lợi nhuận dự kiến
                            </span>
                            <span className="text-xl text-blue-600 dark:text-blue-500 font-mono font-bold tracking-tight">{vnd(totalProfit)}</span>
                        </div>
                        <div className="h-10 w-[2px] bg-[#5c9a38]/20 mt-2"></div>
                        <div className="flex flex-col items-end px-6 py-2 bg-[#5c9a38]/5 dark:bg-[#5c9a38]/10 rounded-2xl border border-[#5c9a38]/10">
                            <span className="text-[11px] font-black text-[#5c9a38] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <CreditCard size={12} /> Khách phải trả
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl text-[#5c9a38] font-black tracking-tighter drop-shadow-sm">{vnd(amountToPay)}</span>
                                <span className="text-sm font-black text-[#5c9a38] uppercase opacity-70">VNĐ</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center max-w-[1600px] mx-auto border-t border-gray-100 dark:border-neutral-800 pt-6">
                    <button 
                        onClick={() => navigate("/export-manage")} 
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm font-bold transition-colors group"
                    >
                        <AlertCircle size={18} className="group-hover:rotate-12 transition-transform" /> 
                        Quay lại danh sách phiếu
                    </button>
                    
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl text-sm font-black hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all active:scale-95 shadow-sm">
                            <Printer size={18} /> IN PHIẾU BÁN
                        </button>
                        {isEditing && (
                            <button 
                                onClick={handleSaveOrder} 
                                className="bg-[#5c9a38] text-white px-10 py-3 rounded-xl text-sm font-black hover:bg-[#4d822f] shadow-lg shadow-[#5c9a38]/30 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Save size={18} /> CẬP NHẬT PHIẾU XUẤT
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
