import { useState, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Plus, AlertCircle, Search, PlusCircle, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { type PurchaseOrder, type PurchaseOrderItem, type Product, purchaseOrderSchema } from "@/lib/schemas"
import { purchaseOrderService } from "@/services/purchase-order.service"
import { productService } from "@/services/product.service"
import { useEffect } from "react"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"
import { parseFloatSafe } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"

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

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return
            setIsLoading(true)
            try {
                const [orderData, productsData] = await Promise.all([
                    purchaseOrderService.getById(id),
                    productService.getAll()
                ])
                setOrder(orderData)
                setItems(orderData.items || [])
                setInvoiceNumber(orderData.invoiceNumber || "")
                setNotes(orderData.notes || "")
                setAllProducts(productsData)
            } catch (error) {
                toast.error("Không thể tải thông tin phiếu nhập")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id])

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [showResults, setShowResults] = useState(false)

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        return allProducts.filter(p =>
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.id && p.id.toLowerCase().includes(query))
        ).slice(0, 10)
    }, [searchQuery, allProducts])

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
            unit: product.baseUnitName || "",
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
    const handleProductSaved = useCallback((savedProduct: any, formData: ProductFormData) => {
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
    }, [invoiceNumber, notes]) // Added dependencies just in case

    const handleCancelEdit = () => {
        if (order) {
            setItems(order.items || [])
            setInvoiceNumber(order.invoiceNumber || "")
            setNotes(order.notes || "")
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
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`)
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
                <div className="grid grid-cols-6 gap-4">
                    {/* Supplier Select (Disabled demo) */}
                    <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Chọn nhà cung cấp</label>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSaveOrder}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap w-[80px] text-center transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Save size={14} /> Lưu
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center"
                                        title="Hủy"
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleToggleEdit}
                                    className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap w-[100px] text-center transition-colors flex items-center justify-center gap-1"
                                >
                                    Sửa phiếu
                                </button>
                            )}
                            <input
                                type="text"
                                value={order.supplierName}
                                disabled
                                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-800 dark:text-gray-300 outline-none"
                            />
                            <button disabled className="bg-gray-200 dark:bg-neutral-700 text-gray-500 w-8 flex items-center justify-center rounded border border-gray-300 dark:border-neutral-600">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Order Meta Info */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Số phiếu</label>
                        <input
                            type="text"
                            value={order.id}
                            disabled
                            className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-800 dark:text-gray-300"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Số hóa đơn</label>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={!isEditing}
                            className={`${isEditing ? 'bg-white' : 'bg-gray-50/50 text-gray-500'} dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Ngày nhập</label>
                        <input
                            type="text"
                            value={new Date(order.importDate).toLocaleString("vi-VN").replace(/,/g, "")}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">HTTT</label>
                        <input
                            type="text"
                            value={order.paymentMethod || "Chuyển khoản"}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1 col-span-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Người nhập</label>
                        <input
                            type="text"
                            value={order.createdBy}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
                        />
                    </div>
                </div>

                {/* ── SEARCH-FIRST ADD BAR ── */}
                <div className="mt-4 relative group">
                    <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-1">
                        <div className="pl-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Gõ tên hoặc mã sản phẩm để thêm nhanh (F1)..."
                            className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowResults(true)
                            }}
                            onFocus={() => setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        />
                        <div className="flex items-center gap-2 pr-1">
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                                >
                                    &times;
                                </button>
                            )}
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-neutral-700 mx-1"></div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                <PlusCircle size={16} />
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
            <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-neutral-900">
                <table className="w-full text-[12px] text-left whitespace-nowrap">
                    <thead className="text-gray-700 dark:text-gray-200 font-semibold sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 z-10">
                        <tr>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 w-24">Mã SP</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-blue-700 dark:text-blue-400 max-w-[300px] truncate">Tên sản phẩm ({items.length})</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">ĐVT</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">Số lô</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">Hạn dùng</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">Số lượng</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right text-red-600 dark:text-red-400">Giá nhập *</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">Giá bán lẻ</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">Tổng tiền</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">%CK</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">Chiết khấu</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">%VAT</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">VAT</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">Còn lại</th>
                            <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">SĐK</th>
                            {isEditing && <th className="px-3 py-2 text-center w-10">Xóa</th>}
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
            <div className="flex-none p-3 border-t-4 border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/80">
                <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Ghi chú</label>
                        <input
                            type="text"
                            placeholder="Ghi chú"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            readOnly={!isEditing}
                            className={`w-full ${isEditing ? 'bg-white' : 'bg-gray-50 dark:bg-neutral-800 text-gray-500'} border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-1 w-[130px]">
                            <label className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Tổng tiền</label>
                            <input
                                type="text"
                                readOnly
                                value={vnd(totalAmount)}
                                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm font-semibold text-gray-700 dark:text-gray-300 text-right"
                            />
                        </div>
                        <div className="flex flex-col gap-1 w-[130px]">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Chiết khấu</label>
                                <span className="text-[10px] text-gray-400">%</span>
                            </div>
                            <input
                                type="text"
                                readOnly
                                value={vnd(totalDiscount)}
                                className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 text-right font-medium"
                            />
                        </div>
                        <div className="flex flex-col gap-1 w-[130px]">
                            <label className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">VAT</label>
                            <input
                                type="text"
                                readOnly
                                value={vnd(totalVat)}
                                className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 text-right font-medium"
                            />
                        </div>
                        <div className="flex flex-col gap-1 w-[130px]">
                            <label className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Tiền phải trả</label>
                            <input
                                type="text"
                                readOnly
                                value={vnd(amountToPay)}
                                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 text-right font-semibold"
                            />
                        </div>
                        <div className="flex flex-col gap-1 w-[130px]">
                            <label className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Tiền thanh toán</label>
                            <input
                                type="text"
                                readOnly
                                value={vnd(amountToPay)}
                                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 text-right font-semibold"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER ACTIONS ── */}
            <div className="flex-none p-3 border-t border-gray-200 dark:border-neutral-800 flex justify-between bg-white dark:bg-neutral-900">
                <button 
                    onClick={() => navigate("/purchase-orders")} 
                    className="flex items-center gap-2 border border-gray-300 dark:border-neutral-700 px-4 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-gray-700 dark:text-gray-300"
                >
                    <AlertCircle size={16} /> Quay lại danh sách
                </button>
                <button
                    onClick={handleSaveOrder}
                    className={`${isEditing ? 'bg-[#5c9a38] hover:bg-[#5c9a38]/90' : 'bg-gray-200 text-gray-500'} text-white px-10 py-2 rounded text-sm font-bold transition shadow-sm`}
                    disabled={!isEditing}
                >
                    LƯU THAY ĐỔI
                </button>
            </div>
        </div>
    )
}
