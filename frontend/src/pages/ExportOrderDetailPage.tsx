import { useState, useMemo, useCallback, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AlertCircle, Search, PlusCircle, Trash2, Save, Printer, Calendar, User, FileText, LayoutDashboard, CreditCard, ChevronLeft } from "lucide-react"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-neutral-800 gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate("/export-manage")}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full text-gray-500 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <h1 className="text-base sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-[#5c9a38] hidden sm:block" />
                                Chi tiết phiếu xuất
                            </h1>
                            <span className="w-fit px-2 py-0.5 bg-[#5c9a38]/10 text-[#5c9a38] text-[9px] sm:text-[10px] font-black rounded uppercase tracking-wider">
                                {slip.id}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveOrder}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
                                >
                                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> LƯU
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleToggleEdit}
                                className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-[#5c9a38]/20 flex items-center gap-2 transition-all"
                            >
                                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> SỬA PHIẾU
                            </button>
                        )}
                        <button className="p-2 sm:p-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors" title="In phiếu">
                            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* ── METADATA GRID ── */}
                <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* Customer Info Card */}
                        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-gray-100 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 text-gray-100 dark:text-neutral-700 group-hover:text-gray-200 transition-colors hidden sm:block">
                                <User size={48} />
                            </div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 leading-none">Khách hàng</label>
                            <div className="text-base sm:text-lg font-black text-gray-800 dark:text-white truncate pr-10">
                                {slip.customerName}
                            </div>
                            <div className="mt-1 text-[10px] sm:text-xs text-gray-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#5c9a38] rounded-full"></span>
                                {slip.isPrescription ? "Bán theo đơn thuốc" : "Bán lẻ thông thường"}
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-[#5c9a38] uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-[#5c9a38] rounded-full"></div>
                                Triệu chứng bệnh
                            </label>
                            <input
                                type="text"
                                value={symptoms}
                                placeholder="..."
                                onChange={(e) => setSymptoms(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm transition-all border-2 ${
                                    isEditing 
                                    ? 'bg-white border-red-200 dark:bg-neutral-800 dark:border-red-900/30 text-red-600 font-bold' 
                                    : 'bg-transparent border-transparent text-gray-700 dark:text-gray-300 font-bold italic'
                                } outline-none focus:ring-4 focus:ring-red-500/5`}
                            />
                        </div>

                        {/* Notes */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                Ghi chú nhanh
                            </label>
                            <input
                                type="text"
                                value={notes}
                                placeholder="..."
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm transition-all border-2 ${
                                    isEditing 
                                    ? 'bg-white border-blue-200 dark:bg-neutral-800 dark:border-blue-900/30 text-blue-600 font-bold' 
                                    : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 font-medium'
                                } outline-none focus:ring-4 focus:ring-blue-500/5`}
                            />
                        </div>

                        {/* Payment & Logistics info */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <CreditCard size={10} /> HTTT
                                </label>
                                {isEditing ? (
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2 py-2 rounded-xl text-xs sm:text-sm outline-none"
                                    >
                                        <option value="">Chọn...</option>
                                        {allPaymentMethods.map(m => (
                                            <option key={m.id || m.name} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-neutral-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-neutral-700 truncate">
                                        {paymentMethod || "Tiền mặt"}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar size={10} /> Ngày xuất
                                </label>
                                <div className="text-xs sm:text-sm font-mono font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-neutral-800 px-2 sm:px-3 py-2 rounded-xl border border-gray-100 dark:border-neutral-700 truncate">
                                    {slip.exportDate.split('T')[0]}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SEARCH BAR (Integrated) ── */}
                <div className="px-4 sm:px-6 py-4 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
                    <div className="relative group w-full max-w-4xl">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 dark:bg-neutral-800 border-2 border-transparent focus-within:bg-white focus-within:border-[#5c9a38]/30 focus-within:ring-4 focus-within:ring-[#5c9a38]/5 rounded-2xl transition-all px-3 sm:px-4 py-1.5 sm:py-1">
                            <div className="flex items-center flex-1 gap-3">
                                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#5c9a38] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tên sản phẩm..."
                                    className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm py-2 sm:py-3 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setShowResults(true)
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                />
                            </div>
                            <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-neutral-700 mx-1"></div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center justify-center gap-2 bg-[#5c9a38]/10 text-[#5c9a38] px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-[#5c9a38]/20 transition-all border border-[#5c9a38]/20"
                            >
                                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Thêm nhanh
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
            <div className="flex-1 overflow-x-auto bg-white dark:bg-neutral-900 border-x border-gray-100 dark:border-neutral-800 mx-4 sm:mx-6 my-4 rounded-xl sm:rounded-2xl shadow-inner relative">
                <table className="w-full text-left border-separate border-spacing-0 whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-neutral-800/80 sticky top-0 z-10 text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700">Mã SP</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 min-w-[150px] sm:min-w-[250px]">Tên sản phẩm</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700">ĐVT</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 hidden md:table-cell">Số lô</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 hidden lg:table-cell">Hạn dùng</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 text-right">SL</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 text-right hidden xl:table-cell">Giá nhập</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 text-right">Giá bán</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 text-right text-[#5c9a38]">Thành tiền</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-neutral-700 text-right text-blue-600 hidden 2xl:table-cell">Lợi nhuận</th>
                            {isEditing && <th className="px-3 py-3 border-b border-gray-100 dark:border-neutral-700 w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                        <div className="p-4 bg-gray-100 rounded-full"><FileText size={32} /></div>
                                        <p className="text-sm font-bold text-gray-600">Chưa có sản phẩm nào được xuất</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-colors group text-[11px] sm:text-xs">
                                    <td className="px-3 sm:px-4 py-3.5 font-mono text-gray-400">{item.code}</td>
                                    <td className="px-3 sm:px-4 py-3.5 whitespace-normal max-w-[200px] sm:max-w-xs">
                                        <div className="font-black text-gray-800 dark:text-gray-200 leading-tight">{item.name}</div>
                                    </td>
                                    <td className="px-3 sm:px-4 py-3.5 text-gray-500 font-bold">{item.unit}</td>
                                    <td className="px-2 sm:px-4 py-3.5 hidden md:table-cell">
                                        {isEditing ? (
                                            <input type="text" className="w-24 bg-gray-50 border border-transparent hover:border-gray-300 rounded px-2 py-1 text-center font-bold outline-none focus:bg-white" value={item.batchNumber || ""} onChange={(e) => updateItemField(item.id!, 'batchNumber', e.target.value)} />
                                        ) : <span className="font-mono text-gray-500">{item.batchNumber}</span>}
                                    </td>
                                    <td className="px-2 sm:px-4 py-3.5 hidden lg:table-cell text-red-500/80 font-mono italic">{item.expiryDate}</td>
                                    <td className="px-3 sm:px-4 py-3.5 text-right">
                                        {isEditing ? (
                                            <NumericInput className="w-14 sm:w-16 bg-[#5c9a38]/5 border border-transparent hover:border-[#5c9a38]/30 rounded px-1.5 py-1 text-right font-black outline-none focus:bg-white text-[#5c9a38]" value={Number(item.quantity)} onChange={(v) => updateItemField(item.id!, 'quantity', v)} />
                                        ) : <span className="font-black text-gray-800 dark:text-gray-100">{item.quantity}</span>}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3.5 text-right hidden xl:table-cell text-gray-400 italic">{vnd(item.importPrice)}</td>
                                    <td className="px-3 sm:px-4 py-3.5 text-right">
                                        {isEditing ? (
                                            <NumericInput className="w-20 sm:w-24 bg-gray-50 border border-transparent hover:border-gray-200 rounded px-1.5 py-1 text-right font-bold outline-none focus:bg-white" value={Number(item.retailPrice)} onChange={(v) => updateItemField(item.id!, 'retailPrice', v)} />
                                        ) : <span className="font-bold text-gray-600 dark:text-gray-300">{vnd(item.retailPrice)}</span>}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3.5 text-right font-black text-[#5c9a38] text-[13px] sm:text-base">{vnd(item.remainingAmount)}</td>
                                    <td className="px-3 sm:px-4 py-3.5 text-right text-blue-500 font-mono hidden 2xl:table-cell">{vnd(item.remainingAmount - (item.quantity * item.importPrice))}</td>
                                    {isEditing && (
                                        <td className="px-2 sm:px-4 py-3.5 text-center">
                                            <button onClick={() => removeItem(item.id!)} className="p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── FOOTER TOTALS ── */}
            <div className="flex-none bg-white dark:bg-[#0f0f0f] border-t border-gray-100 dark:border-neutral-800 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row justify-between items-center sm:items-end gap-6 sm:gap-10 max-w-[1600px] mx-auto">
                    {/* Status badges */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto mr-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                slip.paymentStatus === 'Đã thanh toán' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {slip.paymentStatus || "Hoàn tất"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nhân viên</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-neutral-800 rounded-full border border-gray-100 dark:border-neutral-700">
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{slip.createdBy}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-end gap-3 sm:gap-8 w-full sm:w-auto">
                        <div className="flex flex-col items-end p-3 bg-gray-50 rounded-xl dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 sm:bg-transparent sm:border-0 sm:p-0">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Giá nhập</span>
                            <span className="text-sm sm:text-lg text-gray-400 font-mono font-bold leading-none">{vnd(totalImport)}</span>
                        </div>
                        <div className="flex flex-col items-end p-3 bg-blue-50/30 rounded-xl dark:bg-blue-900/5 border border-blue-100/20 sm:bg-transparent sm:border-0 sm:p-0">
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1 leading-none">Lợi nhuận</span>
                            <span className="text-sm sm:text-lg text-blue-600 font-mono font-black leading-none">{vnd(totalProfit)}</span>
                        </div>
                        <div className="col-span-2 flex flex-col items-end px-5 sm:px-8 py-3 sm:py-4 bg-[#5c9a38] text-white rounded-2xl shadow-xl shadow-green-500/20">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Tổng cộng thanh toán</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl sm:text-4xl font-black tracking-tighter">{vnd(amountToPay)}</span>
                                <span className="text-xs font-bold opacity-60">VNĐ</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center max-w-[1600px] mx-auto border-t border-gray-100 dark:border-neutral-800 pt-6 gap-4">
                    <button 
                        onClick={() => navigate("/export-manage")} 
                        className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm font-bold transition-colors"
                    >
                        <AlertCircle size={18} /> Quay lại danh sách
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl text-sm font-black hover:bg-gray-200 transition-all shadow-sm">
                            <Printer size={18} /> IN PHIẾU
                        </button>
                        {isEditing && (
                            <button 
                                onClick={handleSaveOrder} 
                                className="bg-[#5c9a38] text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-[#4d822f] shadow-lg shadow-green-500/20 transition-all"
                            >
                                <Save size={18} /> LƯU THAY ĐỔI
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
