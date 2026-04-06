import { useState, useMemo, useCallback, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AlertCircle, Search, PlusCircle, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { type PurchaseOrder, type PurchaseOrderItem, type Product, purchaseOrderSchema, type PaymentMethod } from "@/lib/schemas"
import { purchaseOrderService } from "@/services/purchase-order.service"
import { productService } from "@/services/product.service"
import { paymentMethodService } from "@/services/payment-method.service"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"
import { parseFloatSafe, getErrorMessage } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { useDebounce } from "@/hooks/use-debounce"

export default function PurchaseOrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const roundTo3 = (num: number) => Math.round((num + Number.EPSILON) * 1000) / 1000

    // Find the order
    const [order, setOrder] = useState<PurchaseOrder | null>(null)
    const [items, setItems] = useState<PurchaseOrderItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [notes, setNotes] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("")
    const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>([])

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return
            setIsLoading(true)
            try {
                const [orderData, productsData, paymentMethodsData] = await Promise.all([
                    purchaseOrderService.getById(id),
                    productService.getAll(),
                    paymentMethodService.getAll()
                ])
                setOrder(orderData)
                setItems(orderData.items || [])
                setInvoiceNumber(orderData.invoiceNumber || "")
                setNotes(orderData.notes || "")
                setPaymentMethod(orderData.paymentMethod || "")
                setAllProducts(productsData)
                setAllPaymentMethods(paymentMethodsData)
            } catch (error: unknown) {
                toast.error("Không thể tải thông tin phiếu nhập: " + getErrorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id])

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [showResults, setShowResults] = useState(false)
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const filteredSuggestions = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return []
        const query = debouncedSearchQuery.toLowerCase()
        return allProducts.filter(p =>
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.id && p.id.toLowerCase().includes(query))
        ).slice(0, 10)
    }, [debouncedSearchQuery, allProducts])

    const handleQuickAdd = useCallback((product: Product) => {
        const qty = 1
        const importPrice = product.importPrice || 0
        const total = qty * importPrice
        const vatPct = 5 // Default for simplicity in quick add
        const vatAmt = Math.round(total * vatPct / 100)

        const newItem: PurchaseOrderItem = {
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            code: product.id || "",
            name: product.name || "",
            unit: product.unit || product.baseUnitName || "",
            registrationNumber: product.registrationNo || "-",
            batchNumber: "",
            expiryDate: "",
            quantity: qty,
            importPrice,
            retailPrice: product.retailPrice || importPrice,
            totalAmount: total,
            discountPercent: 0,
            discountAmount: 0,
            vatPercent: vatPct,
            vatAmount: vatAmt,
            remainingAmount: total + vatAmt,
        }

        setItems(prev => [...prev, newItem])
        setSearchQuery("")
        setShowResults(false)
        toast.success(`Đã thêm nhanh: ${product.name}`)
    }, [])

    // Handler when AddProductModal saves a new product → convert to PurchaseOrderItem
    const handleProductSaved = useCallback((savedProduct: Product, formData: ProductFormData) => {
        const firstUnit = formData.units?.[0]
        const qty = 1
        const importPrice = firstUnit?.importPrice || 0
        const retailPrice = firstUnit?.retailPrice || importPrice
        const vatPct = Number(formData.vatPercent) || 0
        const discountPct = Number(formData.discountPercent) || 0
        const total = qty * importPrice
        const discountAmt = Math.round(total * discountPct / 100)
        const vatAmt = Math.round((total - discountAmt) * vatPct / 100)
        const newItem: PurchaseOrderItem = {
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            code: savedProduct.id || formData.productCode || "",
            name: savedProduct.name || formData.productName,
            unit: firstUnit?.unitName || "",
            batchNumber: "",
            expiryDate: "",
            quantity: qty,
            importPrice,
            retailPrice,
            totalAmount: total,
            discountPercent: discountPct,
            discountAmount: discountAmt,
            vatPercent: vatPct,
            vatAmount: vatAmt,
            remainingAmount: total - discountAmt + vatAmt,
            registrationNumber: "-",
        }
        setItems(prev => [...prev, newItem])
    }, [])

    const handleCancelEdit = () => {
        if (order) {
            setItems(order.items || [])
            setInvoiceNumber(order.invoiceNumber || "")
            setNotes(order.notes || "")
            setPaymentMethod(order.paymentMethod || "")
        }
        setIsEditing(false)
        toast.info("Đã hủy thay đổi")
    }

    const handleToggleEdit = () => {
        if (isEditing) {
            // If stopping edit, we might want to save
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

    const updateItemField = useCallback((id: string, field: keyof PurchaseOrderItem, value: string | number | boolean) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item

            const updatedItem = { ...item, [field]: value } as PurchaseOrderItem

            // Recalculate totals for this row
            if (['quantity', 'importPrice', 'discountPercent', 'vatPercent'].includes(field as string)) {
                const qty = parseFloatSafe(updatedItem.quantity)
                const price = parseFloatSafe(updatedItem.importPrice)
                const discPct = parseFloatSafe(updatedItem.discountPercent)
                const vatPct = parseFloatSafe(updatedItem.vatPercent)

                updatedItem.totalAmount = qty * price
                updatedItem.discountAmount = Math.round(updatedItem.totalAmount * discPct / 100)
                updatedItem.vatAmount = Math.round((updatedItem.totalAmount - updatedItem.discountAmount) * vatPct / 100)
                updatedItem.remainingAmount = updatedItem.totalAmount - updatedItem.discountAmount + updatedItem.vatAmount
            }

            return updatedItem
        }))
    }, [])

    const handleSaveOrder = async () => {
        if (!order || !id) return

        // Basic validation
        if (items.length === 0) {
            toast.error("Phiếu nhập phải có ít nhất một sản phẩm")
            return
        }

        for (const item of items) {
            if (!item.name) {
                toast.error("Sản phẩm không được để trống tên")
                return
            }
            if (item.quantity <= 0) {
                toast.error(`Sản phẩm ${item.name} có số lượng không hợp lệ (>0)`)
                return
            }
            if (item.importPrice < 0) {
                toast.error(`Sản phẩm ${item.name} có giá nhập không hợp lệ (>=0)`)
                return
            }
        }

        try {
            const updatedOrder = { 
                ...order, 
                invoiceNumber,
                notes,
                paymentMethod,
                items,
                totalAmount: roundTo3(totalAmount),
                discount: roundTo3(totalDiscount),
                vat: roundTo3(totalVat),
                grandTotal: roundTo3(amountToPay)
            }

            // Validate with Zod schema
            const validation = purchaseOrderSchema.safeParse(updatedOrder)
            if (!validation.success) {
                toast.error(validation.error.issues[0].message)
                return
            }

            await purchaseOrderService.update(id, updatedOrder)
            setOrder(updatedOrder)
            setIsEditing(false)
            toast.success("Đã lưu thay đổi phiếu nhập")
        } catch (error: unknown) {
            toast.error("Lỗi khi lưu phiếu nhập: " + getErrorMessage(error))
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">Đang tải thông tin phiếu nhập...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Không tìm thấy phiếu nhập</h2>
                <button
                    onClick={() => navigate("/purchase-orders")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    <AlertCircle size={16} /> Quay lại danh sách
                </button>
            </div>
        )
    }

    // Helpers
    const vnd = (val: number) => val.toLocaleString("vi-VN")

    // Derived totals from items
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0)
    const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0)
    const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0)
    const amountToPay = totalAmount - totalDiscount + totalVat

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
            {/* ── HEADER SECTION ── */}
            <div className="flex-none p-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Supplier Info */}
                    <div className="w-full sm:flex-1 flex flex-col gap-1">
                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nhà cung cấp</label>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <div className="flex gap-1">
                                    <button
                                        onClick={handleSaveOrder}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Lưu
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center shadow-sm"
                                        title="Hủy"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleToggleEdit}
                                    className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    Sửa phiếu
                                </button>
                            )}
                            <input
                                type="text"
                                value={order.supplierName}
                                disabled
                                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold outline-none"
                            />
                        </div>
                    </div>

                    {/* Metadata Grid (Quick Info) */}
                    <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-1">Số phiếu</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-gray-800 dark:text-gray-200">{order.id}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-1">Ngày nhập</span>
                            <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(order.importDate).toLocaleDateString("vi-VN")}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Số khóa đơn</label>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={!isEditing}
                            className={`w-full ${isEditing ? 'bg-white ring-2 ring-blue-500/10 border-blue-500' : 'bg-gray-50/50 dark:bg-neutral-800/50 text-gray-400 border-gray-200 dark:border-neutral-800'} px-3 py-1.5 rounded text-xs sm:text-sm outline-none transition-all`}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">HTTT</label>
                        {isEditing ? (
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full bg-white border border-blue-500 ring-2 ring-blue-500/10 px-2 py-1.5 rounded text-xs sm:text-sm text-gray-800 outline-none"
                            >
                                <option value="">Chọn...</option>
                                {allPaymentMethods.map(m => (
                                    <option key={m.id || m.name} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="px-3 py-1.5 bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-800 rounded text-xs sm:text-sm text-gray-400 font-medium">
                                {paymentMethod || "Chuyển khoản"}
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-1">Người tạo</label>
                        <div className="px-3 py-1.5 bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-800 rounded text-xs sm:text-sm text-gray-400 truncate">
                            {order.createdBy}
                        </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 lg:col-span-2 flex items-end">
                        <div className="w-full bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 flex justify-between items-center group">
                            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">Thanh toán</span>
                            <span className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-400 leading-none">{vnd(amountToPay)} đ</span>
                        </div>
                    </div>
                </div>

                {/* ── SEARCH-FIRST ADD BAR ── */}
                <div className="mt-4 relative group">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-1.5 sm:p-1">
                        <div className="hidden sm:flex pl-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tên hoặc mã sản phẩm (F1)..."
                            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm py-2 px-2 sm:px-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowResults(true)
                            }}
                            onFocus={() => setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        />
                        <div className="flex items-center gap-2 pr-0 sm:pr-1 border-t sm:border-t-0 border-gray-100 sm:pt-0 pt-2 sm:mt-0 mt-1">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Thêm mới (F2)</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredSuggestions.length > 0 ? (
                                <div className="max-h-[400px] overflow-y-auto p-2">
                                    <div className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase tracking-wider">Kết quả tìm kiếm</div>
                                    {filteredSuggestions.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleQuickAdd(product)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors text-left group"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {product.name}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <span className="bg-gray-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-600 text-[10px]">{product.id}</span>
                                                    <span>&bull;</span>
                                                    <span>ĐVT: {product.unit}</span>
                                                    <span>&bull;</span>
                                                    <span className="text-green-600 dark:text-green-400 font-medium">Giá: {vnd(product.importPrice || 0)}</span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold">
                                                THÊM NHANH
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50/50 dark:bg-neutral-900/50">
                                    <div className="text-gray-400 mb-3">
                                        <Search size={32} className="mx-auto opacity-20" />
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Không tìm thấy sản phẩm <span className="font-bold text-gray-800 dark:text-gray-200">"{searchQuery}"</span>
                                    </div>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-4 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline"
                                    >
                                        Tạo mới sản phẩm này trong hệ thống?
                                    </button>
                                </div>
                            )}
                            <div className="bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 px-4 py-2 text-[10px] text-gray-400 flex justify-between">
                                <span>Dùng phím mũi tên & Enter để chọn nhanh</span>
                                <span>{filteredSuggestions.length} kết quả</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── ADD PRODUCT MODAL (reuses full AddProductModal) ── */}
            <AddProductModal
                key={showAddModal ? "open" : "closed"}
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleProductSaved}
            />

            {/* ── LINE ITEMS DATA GRID ── */}
            <div className="flex-1 overflow-x-auto bg-gray-50/30 dark:bg-neutral-900">
                <table className="w-full text-[11px] sm:text-[12px] text-left whitespace-nowrap">
                    <thead className="text-gray-700 dark:text-gray-200 font-semibold sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 z-10 uppercase tracking-tighter">
                        <tr>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 w-16 sm:w-24">Mã SP</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-blue-700 dark:text-blue-400 min-w-[200px] sm:min-w-[300px]">Tên sản phẩm</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 w-12 sm:w-16 text-center">ĐVT</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 w-20 sm:w-28 text-center">Số lô</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 w-20 sm:w-28 text-center">Hạn dùng</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right w-16 sm:w-24">SL</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right w-24 sm:w-32 bg-red-50/10 dark:bg-red-900/5">Giá nhập</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right w-24 sm:w-32 hidden md:table-cell">Giá bán</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right w-24 sm:w-32">Thành tiền</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right hidden lg:table-cell">%CK</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right hidden lg:table-cell">CK</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right hidden xl:table-cell">%VAT</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">Tổng thanh toán</th>
                            <th className="px-2 sm:px-3 py-3 border-r border-gray-200 dark:border-neutral-700 hidden 2xl:table-cell">SĐK</th>
                            {isEditing && <th className="px-2 py-3 text-center w-10 sm:w-12">#</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/60 bg-white dark:bg-neutral-900">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={15} className="py-8 text-center text-gray-400">Chưa có sản phẩm nào.</td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 text-gray-600 dark:text-gray-300 group">
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800">{item.code}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 max-w-[300px]">
                                        <div className="flex flex-col">
                                            <span className="truncate whitespace-normal leading-tight font-medium text-gray-800 dark:text-gray-200">
                                                {item.name}
                                            </span>
                                            {item.name.includes("Buymed") && <span className="text-[10px] text-green-600">(HH)</span>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800">{item.unit}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 uppercase">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-center"
                                                value={item.batchNumber}
                                                onChange={(e) => updateItemField(item.id || "", 'batchNumber', e.target.value)}
                                            />
                                        ) : item.batchNumber}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-center"
                                                value={item.expiryDate}
                                                onChange={(e) => updateItemField(item.id || "", 'expiryDate', e.target.value)}
                                            />
                                        ) : item.expiryDate}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right font-medium">
                                        {isEditing ? (
                                            <NumericInput
                                                className="w-16 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={Number(item.quantity)}
                                                onChange={(v) => updateItemField(item.id || "", 'quantity', v)}
                                            />
                                        ) : item.quantity}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right font-medium">
                                        {isEditing ? (
                                            <NumericInput
                                                className="w-24 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={Number(item.importPrice)}
                                                onChange={(v) => updateItemField(item.id || "", 'importPrice', v)}
                                            />
                                        ) : vnd(item.importPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">
                                        {isEditing ? (
                                            <NumericInput
                                                className="w-24 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={Number(item.retailPrice)}
                                                onChange={(v) => updateItemField(item.id || "", 'retailPrice', v)}
                                            />
                                        ) : vnd(item.retailPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">{vnd(item.totalAmount)}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">
                                        {isEditing ? (
                                            <NumericInput
                                                className="w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={Number(item.discountPercent)}
                                                onChange={(v) => updateItemField(item.id || "", 'discountPercent', v)}
                                            />
                                        ) : Number(item.discountPercent ?? 0).toFixed(2).replace('.', ',')}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">{item.discountAmount > 0 ? vnd(item.discountAmount) : 0}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">
                                        {isEditing ? (
                                            <NumericInput
                                                className="w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={Number(item.vatPercent)}
                                                onChange={(v) => updateItemField(item.id || "", 'vatPercent', v)}
                                            />
                                        ) : Number(item.vatPercent ?? 0)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">{item.vatAmount > 0 ? vnd(item.vatAmount) : 0}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right font-medium">{vnd(item.remainingAmount)}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-center">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-center"
                                                value={item.registrationNumber}
                                                onChange={(e) => updateItemField(item.id || "", 'registrationNumber', e.target.value)}
                                            />
                                        ) : item.registrationNumber}
                                    </td>
                                    {isEditing && (
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => removeItem(item.id || "")}
                                                className="text-red-500 hover:text-red-700 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── FOOTER SUB-SECTION (Totals) ── */}
            <div className="flex-none p-4 border-t-4 border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#1a1a1a]">
                <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Ghi chú phiếu nhập</label>
                        <textarea
                            placeholder="Nhập ghi chú thêm..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            readOnly={!isEditing}
                            className={`w-full ${isEditing ? 'bg-white ring-2 ring-blue-500/10' : 'bg-gray-100/50 dark:bg-neutral-800/50 text-gray-400 cursor-default'} border border-gray-200 dark:border-neutral-700 px-4 py-2 rounded-xl text-sm min-h-[60px] lg:min-h-[100px] outline-none transition-all resize-none font-medium`}
                        />
                    </div>
                    
                    <div className="w-full lg:w-[480px] grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            { label: "Tổng tiền hàng", value: totalAmount, color: "text-gray-600 dark:text-gray-400" },
                            { label: "Chiết khấu", value: totalDiscount, color: "text-red-500" },
                            { label: "Thuế VAT", value: totalVat, color: "text-gray-600 dark:text-gray-300" },
                            { label: "Phải trả NCC", value: amountToPay, color: "text-blue-600 dark:text-blue-400", prominent: true },
                            { label: "Đã thanh toán", value: amountToPay, color: "text-[#5c9a38]", prominent: true },
                        ].map((stat, i) => (
                            <div key={i} className={`flex flex-col gap-1 p-2 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm ${stat.prominent ? 'sm:col-span-1' : ''}`}>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none">{stat.label}</span>
                                <span className={`text-[13px] sm:text-[15px] font-black tabular-nums transition-all ${stat.color}`}>
                                    {vnd(stat.value)}
                                </span>
                            </div>
                        ))}
                        <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center bg-[#5c9a38] rounded-lg p-2 shadow-lg shadow-[#5c9a38]/20">
                            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Trạng thái</span>
                            <span className="text-[11px] font-black text-white uppercase italic">Đã Hoàn Tất</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* ── FOOTER ACTIONS ── */}
            <div className="flex-none p-3 border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-neutral-900">
                <button 
                    onClick={() => navigate("/purchase-orders")} 
                    className="flex items-center justify-center gap-2 border border-gray-300 dark:border-neutral-700 px-4 py-2.5 rounded-lg text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-gray-700 dark:text-gray-300 font-bold"
                >
                    <AlertCircle className="w-4 h-4" /> Quay lại danh sách
                </button>
                <button
                    onClick={handleSaveOrder}
                    className={`flex items-center justify-center px-8 py-2.5 rounded-lg text-xs sm:text-sm font-black transition shadow-lg ${isEditing ? 'bg-[#5c9a38] text-white hover:bg-[#5c9a38]/90 scale-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    disabled={!isEditing}
                >
                    LƯU THAY ĐỔI
                </button>
            </div>
        </div>
    )
}
