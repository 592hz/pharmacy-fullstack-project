import { useState, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Plus, AlertCircle, Search, PlusCircle, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { mockPurchaseOrders, mockProducts, type PurchaseOrderItem } from "@/lib/mock-data"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"

export default function PurchaseOrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // Find the order
    const originalOrder = useMemo(() => mockPurchaseOrders.find(o => o.id === id) || null, [id])

    const order = originalOrder
    const [items, setItems] = useState<PurchaseOrderItem[]>(originalOrder?.items || [])
    const [showAddModal, setShowAddModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Reset items when order changes (e.g. navigation between orders)
    const [prevId, setPrevId] = useState(id)
    if (id !== prevId) {
        setPrevId(id)
        setItems(originalOrder?.items || [])
        setIsEditing(false)
    }

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [showResults, setShowResults] = useState(false)

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        return mockProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
        ).slice(0, 10)
    }, [searchQuery])

    const handleQuickAdd = useCallback((product: typeof mockProducts[0]) => {
        const qty = 1
        const importPrice = product.importPrice || 0
        const total = qty * importPrice
        const vatPct = 5 // Default for simplicity in quick add
        const vatAmt = Math.round(total * vatPct / 100)

        const newItem: PurchaseOrderItem = {
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            code: product.id,
            name: product.name,
            unit: product.unit,
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
            registrationNumber: "-",
        }

        setItems(prev => [...prev, newItem])
        setSearchQuery("")
        setShowResults(false)
        toast.success(`Đã thêm nhanh: ${product.name}`)
    }, [])

    // Handler when AddProductModal saves a new product → convert to PurchaseOrderItem
    const handleProductSaved = useCallback((formData: ProductFormData) => {
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
            code: formData.productCode || "",
            name: formData.productName,
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
        toast.success(`Đã thêm: ${newItem.name}`)
    }, [])

    const handleCancelEdit = () => {
        setItems(originalOrder?.items || [])
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
                const qty = Number(updatedItem.quantity) || 0
                const price = Number(updatedItem.importPrice) || 0
                const discPct = Number(updatedItem.discountPercent) || 0
                const vatPct = Number(updatedItem.vatPercent) || 0

                updatedItem.totalAmount = qty * price
                updatedItem.discountAmount = Math.round(updatedItem.totalAmount * discPct / 100)
                updatedItem.vatAmount = Math.round((updatedItem.totalAmount - updatedItem.discountAmount) * vatPct / 100)
                updatedItem.remainingAmount = updatedItem.totalAmount - updatedItem.discountAmount + updatedItem.vatAmount
            }

            return updatedItem
        }))
    }, [])

    const handleSaveOrder = () => {
        setIsEditing(false)
        toast.success("Đã lưu thay đổi phiếu nhập")
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
                            value={order.invoiceNumber}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
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
                                                    <span className="text-green-600 dark:text-green-400 font-medium">Giá: {vnd(product.importPrice)}</span>
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
                                                onChange={(e) => updateItemField(item.id, 'batchNumber', e.target.value)}
                                            />
                                        ) : item.batchNumber}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-center"
                                                value={item.expiryDate}
                                                onChange={(e) => updateItemField(item.id, 'expiryDate', e.target.value)}
                                            />
                                        ) : item.expiryDate}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right font-medium">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="w-16 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={item.quantity}
                                                onChange={(e) => updateItemField(item.id, 'quantity', e.target.value)}
                                            />
                                        ) : item.quantity}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right font-medium">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="w-24 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={item.importPrice}
                                                onChange={(e) => updateItemField(item.id, 'importPrice', e.target.value)}
                                            />
                                        ) : vnd(item.importPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="w-24 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={item.retailPrice}
                                                onChange={(e) => updateItemField(item.id, 'retailPrice', e.target.value)}
                                            />
                                        ) : vnd(item.retailPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">{vnd(item.totalAmount)}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={item.discountPercent}
                                                onChange={(e) => updateItemField(item.id, 'discountPercent', e.target.value)}
                                            />
                                        ) : Number(item.discountPercent ?? 0).toFixed(2).replace('.', ',')}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">{item.discountAmount > 0 ? vnd(item.discountAmount) : 0}</td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 rounded outline-none text-right"
                                                value={item.vatPercent}
                                                onChange={(e) => updateItemField(item.id, 'vatPercent', e.target.value)}
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
                                                onChange={(e) => updateItemField(item.id, 'registrationNumber', e.target.value)}
                                            />
                                        ) : item.registrationNumber}
                                    </td>
                                    {isEditing && (
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => removeItem(item.id)}
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
                            value={order.notes}
                            readOnly
                            className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
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
            <div className="flex-none p-3 border-t border-gray-200 dark:border-neutral-800 flex justify-between gap-4 bg-white dark:bg-neutral-900">
                <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none mr-2">
                        <input type="checkbox" className="rounded w-4 h-4 accent-green-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Giá đã có VAT</span>
                    </label>
                    <button className="bg-[#5c9a38] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-[#5c9a38]/90">
                        Tìm kiếm phiếu
                    </button>
                    <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded text-sm font-semibold hover:bg-gray-400 dark:bg-neutral-700 dark:text-gray-300">
                        Lấy phiếu dự trù
                    </button>
                    <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded text-sm font-semibold hover:bg-gray-400 dark:bg-neutral-700 dark:text-gray-300">
                        Thêm ĐVT
                    </button>
                </div>
                <div className="flex gap-2">
                    <button className="bg-[#5c9a38] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-[#5c9a38]/90">
                        In mã vạch
                    </button>
                    <button className="bg-[#5c9a38] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-[#5c9a38]/90">
                        In phiếu
                    </button>
                    <button
                        onClick={handleSaveOrder}
                        className={`${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 text-gray-500'} text-white px-6 py-2 rounded text-sm font-semibold transition`}
                        disabled={!isEditing}
                    >
                        LƯU - F6
                    </button>
                    <button
                        onClick={handleSaveOrder}
                        className={`${isEditing ? 'bg-[#5c9a38] hover:bg-[#5c9a38]/90' : 'bg-gray-200 text-gray-500'} text-white px-6 py-2 rounded text-sm font-semibold transition`}
                        disabled={!isEditing}
                    >
                        LƯU & IN - F7
                    </button>
                </div>
            </div>
        </div>
    )
}
