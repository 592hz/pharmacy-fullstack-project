import { useState, useMemo } from "react"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { Plus, Search, PlusCircle, Trash2, Save, X, Calendar, FileText, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { mockProducts, type PurchaseOrderItem, addMockPurchaseOrder, type PurchaseOrder, mockSuppliersList } from "@/lib/mock-data"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"
import { parseFloatSafe } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { useCallback } from "react"

export default function CreatePurchaseOrderPage() {
    const navigate = useNavigate()

    // Form state
    const [supplierName, setSupplierName] = useState("")
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<PurchaseOrderItem[]>([])

    // Metadata (some auto-generated/fixed)
    const [orderId] = useState(() => `PN${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`)
    const [importDate] = useState(() => new Date().toISOString())
    const createdBy = "Quản trị viên"
    const [paymentMethod, setPaymentMethod] = useState("Chuyển khoản")

    const [showAddModal, setShowAddModal] = useState(false)

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
        const vatPct = 5
        const vatAmt = Math.round(total * vatPct / 100)

        const newItem: PurchaseOrderItem = {
            id: `new-${Date.now()}-${Math.random()}`,
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
            id: `new-${Date.now()}-${Math.random()}`,
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

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
        toast.error("Đã xóa sản phẩm khỏi phiếu")
    }, [])

    const roundTo3 = (num: number) => {
        return Math.round((num + Number.EPSILON) * 1000) / 1000
    }

    const updateItemField = useCallback((id: string, field: keyof PurchaseOrderItem, value: string | number | boolean) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item

            let finalValue = value
            if (['quantity', 'importPrice', 'discountPercent', 'vatPercent', 'retailPrice'].includes(field as string)) {
                const numValue = parseFloatSafe(value as string | number | boolean)
                finalValue = roundTo3(numValue)
            }

            const updatedItem = { ...item, [field]: finalValue }

            if (['quantity', 'importPrice', 'discountPercent', 'vatPercent'].includes(field as string)) {
                const qty = parseFloatSafe(updatedItem.quantity)
                const price = parseFloatSafe(updatedItem.importPrice)
                const discPct = parseFloatSafe(updatedItem.discountPercent)
                const vatPct = parseFloatSafe(updatedItem.vatPercent)

                updatedItem.totalAmount = roundTo3(qty * price)
                updatedItem.discountAmount = roundTo3(updatedItem.totalAmount * discPct / 100)
                updatedItem.vatAmount = roundTo3((updatedItem.totalAmount - updatedItem.discountAmount) * vatPct / 100)
                updatedItem.remainingAmount = roundTo3(updatedItem.totalAmount - updatedItem.discountAmount + updatedItem.vatAmount)
            }

            return updatedItem
        }))
    }, [])

    const vnd = (val: number) => val.toLocaleString("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    })

    const totalAmount = roundTo3(items.reduce((sum, item) => sum + item.totalAmount, 0))
    const totalDiscount = roundTo3(items.reduce((sum, item) => sum + item.discountAmount, 0))
    const totalVat = roundTo3(items.reduce((sum, item) => sum + item.vatAmount, 0))
    const amountToPay = roundTo3(totalAmount - totalDiscount + totalVat)

    const handleSaveOrder = useCallback(() => {
        // Prepare data for validation
        const orderData = {
            supplierName,
            invoiceNumber,
            items: items.map(item => ({
                ...item,
                quantity: Number(item.quantity),
                importPrice: Number(item.importPrice)
            }))
        }

        // Define Schema
        const schema = z.object({
            supplierName: z.string().min(1, "Vui lòng nhập tên nhà cung cấp"),
            invoiceNumber: z.string().min(1, "Vui lòng nhập số hóa đơn"),
            items: z.array(z.object({
                name: z.string(),
                quantity: z.number().gt(0, "Số lượng phải lớn hơn 0"),
                importPrice: z.number().gte(0, "Giá nhập không được âm"),
                expiryDate: z.string().refine((val) => {
                    // Quick check for DD-MM-YYYY format
                    const regex = /^(\d{2})-(\d{2})-(\d{4})$/
                    if (!regex.test(val)) return false

                    const [d, m, y] = val.split("-").map(Number)
                    const date = new Date(y, m - 1, d)

                    // Check if valid date (e.g. not 31-02-2024)
                    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
                        return false
                    }

                    // Check if future date (allow today)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date >= today
                }, "Hạn sử dụng không hợp lệ hoặc đã hết hạn (Sử dụng định dạng DD-MM-YYYY)")
            })).min(1, "Vui lòng thêm ít nhất một sản phẩm vào phiếu")
        })

        // Validate
        const validation = schema.safeParse(orderData)

        if (!validation.success) {
            const firstError = validation.error.issues[0]
            toast.error(firstError.message)

            // Log all errors for developer debugging
            console.error("Validation failed:", validation.error.format())
            return
        }

        const newOrder: PurchaseOrder = {
            id: orderId,
            importDate,
            supplierId: "NEW_ID",
            supplierName,
            totalAmount,
            discount: totalDiscount,
            vat: totalVat,
            grandTotal: amountToPay,
            notes,
            createdBy,
            invoiceNumber,
            paymentMethod,
            items,
        }

        console.log("Saving Purchase Order:", newOrder);

        addMockPurchaseOrder(newOrder)
        toast.success("Đã tạo phiếu nhập mới thành công")
        navigate("/purchase-orders")
    }, [amountToPay, createdBy, importDate, invoiceNumber, items, navigate, notes, orderId, paymentMethod, supplierName, totalAmount, totalDiscount, totalVat])

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
            {/* ── HEADER SECTION ── */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Plus size={24} className="text-[#5c9a38]" />
                        Tạo phiếu nhập mới
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate("/purchase-orders")}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            <X size={16} className="inline mr-1" /> Thoát
                        </button>
                        <button
                            onClick={handleSaveOrder}
                            className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-6 py-2 rounded text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                        >
                            <Save size={18} /> LƯU PHIẾU
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4 border p-4 rounded-xl bg-white dark:bg-neutral-800 shadow-sm">
                    {/* Supplier Select */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nhà cung cấp *</label>
                        <select
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        >
                            <option value="">Chọn nhà cung cấp...</option>
                            {mockSuppliersList.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Order Meta Info */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><FileText size={10} /> Số phiếu</label>
                        <input
                            type="text"
                            value={orderId}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 px-3 py-2 rounded text-sm text-gray-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Số hóa đơn</label>
                        <input
                            type="text"
                            placeholder="Số hóa đơn..."
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Calendar size={10} /> Ngày nhập</label>
                        <input
                            type="text"
                            value={new Date(importDate).toLocaleString("vi-VN").replace(/,/g, "")}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 px-3 py-2 rounded text-sm text-gray-400 font-mono"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><CreditCard size={10} /> HTTT</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        >
                            <option value="Chuyển khoản">Chuyển khoản</option>
                            <option value="Tiền mặt">Tiền mặt</option>
                            <option value="Nợ">Ghi nợ</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">Người nhập</label>
                        <input
                            type="text"
                            value={createdBy}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 px-3 py-2 rounded text-sm text-gray-400 font-medium"
                        />
                    </div>
                </div>

                {/* ── SEARCH-FIRST ADD BAR ── */}
                <div className="mt-6 relative group">
                    <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-md focus-within:ring-4 focus-within:ring-green-500/10 focus-within:border-green-500 transition-all p-1.5">
                        <div className="pl-4 text-gray-400 group-focus-within:text-green-500 transition-colors">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã (F1)..."
                            className="flex-1 bg-transparent border-none outline-none text-base py-2 px-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowResults(true)
                            }}
                            onFocus={() => setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        />
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-green-800/50"
                        >
                            <PlusCircle size={18} />
                            <span>Thêm mới sản phẩm (F2)</span>
                        </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            {filteredSuggestions.length > 0 ? (
                                <div className="max-h-[400px] overflow-y-auto p-2">
                                    {filteredSuggestions.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleQuickAdd(product)}
                                            className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left group"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-base font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-600 transition-colors">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                                                    <span className="bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded-md font-mono text-[10px]">{product.id}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span>ĐVT: <b className="text-gray-700 dark:text-gray-300">{product.unit}</b></span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span className="text-green-600 dark:text-green-400 font-bold">Giá: {vnd(product.importPrice)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all shadow-lg">
                                                THÊM VÀO PHIẾU
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <Search size={48} className="mx-auto text-gray-200 mb-4" />
                                    <div className="text-gray-500">Không tìm thấy sản phẩm "{searchQuery}"</div>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-2 text-green-600 font-bold hover:underline"
                                    >
                                        Thêm "{searchQuery}" thành sản phẩm mới?
                                    </button>
                                </div>
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

            {/* ── LINE ITEMS DATA GRID ── */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50/30 dark:bg-neutral-900">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <table className="w-full text-[12px] text-left whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 w-24">Mã SP</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700">Tên sản phẩm</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700">ĐVT</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-center">Số lô</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-center">Hạn dùng</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">Số lượng</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">Giá nhập *</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">Giá bán lẻ</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">Tổng tiền</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">%CK</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">Chiết khấu</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">%VAT</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right">VAT</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-right font-bold text-blue-600 dark:text-blue-400">Còn lại</th>
                                <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-700 text-center">SĐK</th>
                                <th className="px-2 py-3 text-center w-10">#</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={16} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Search size={64} />
                                            <p className="text-base font-medium">Tìm sản phẩm để bắt đầu thêm vào phiếu</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-green-50/30 dark:hover:bg-green-900/5 transition-colors">
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 font-mono text-gray-500">{item.code}</td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800">
                                            <div className="font-bold text-gray-800 dark:text-gray-100 max-w-[200px] truncate" title={item.name}>{item.name}</div>
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800">{item.unit}</td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800">
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-center outline-none focus:ring-1 focus:ring-blue-500"
                                                value={item.batchNumber}
                                                placeholder="Lô..."
                                                onChange={(e) => updateItemField(item.id, 'batchNumber', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800">
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-center outline-none focus:ring-1 focus:ring-blue-500"
                                                value={item.expiryDate}
                                                placeholder="HH-DD-YYYY"
                                                onChange={(e) => updateItemField(item.id, 'expiryDate', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-16 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-right outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                                                value={Number(item.quantity)}
                                                onChange={(v) => updateItemField(item.id, 'quantity', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-24 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-right outline-none focus:ring-1 focus:ring-blue-500 font-bold text-red-600 dark:text-red-400"
                                                value={Number(item.importPrice)}
                                                onChange={(v) => updateItemField(item.id, 'importPrice', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-24 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-right outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                                                value={Number(item.retailPrice)}
                                                onChange={(v) => updateItemField(item.id, 'retailPrice', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right font-medium">{vnd(item.totalAmount)}</td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-right outline-none"
                                                value={Number(item.discountPercent)}
                                                onChange={(v) => updateItemField(item.id, 'discountPercent', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right text-gray-500">{vnd(item.discountAmount)}</td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-right outline-none"
                                                value={Number(item.vatPercent)}
                                                onChange={(v) => updateItemField(item.id, 'vatPercent', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right text-gray-500">{vnd(item.vatAmount)}</td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-right font-bold text-green-700 dark:text-green-400">{vnd(item.remainingAmount)}</td>
                                        <td className="px-2 py-3 border-r border-gray-100 dark:border-neutral-800 text-center">
                                            <input
                                                type="text"
                                                className="w-16 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-1 py-1 rounded text-center outline-none focus:ring-1 focus:ring-blue-500"
                                                value={item.registrationNumber}
                                                placeholder="SĐK..."
                                                onChange={(e) => updateItemField(item.id, 'registrationNumber', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── FOOTER SUB-SECTION (Totals) ── */}
            <div className="flex-none p-4 border-t-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex gap-8 items-start">
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ghi chú phiếu nhập</label>
                        <textarea
                            placeholder="Nhập ghi chú thêm nếu cần..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded-xl text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
                        />
                    </div>

                    <div className="w-[450px] bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-inner">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Tổng tiền hàng:</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{vnd(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Tổng chiết khấu:</span>
                                <span className="font-bold text-orange-600">-{vnd(totalDiscount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Tổng thuế VAT:</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">+{vnd(totalVat)}</span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-neutral-700 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Cần thanh toán</span>
                                <div className="text-3xl font-black text-[#5c9a38] drop-shadow-sm">
                                    {vnd(amountToPay)} <span className="text-sm font-medium">đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-100 dark:border-neutral-800">
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" className="rounded-lg w-5 h-5 accent-[#5c9a38]" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Giá đã bao gồm VAT</span>
                        </label>

                    </div>

                    <div className="flex gap-3">

                        <button
                            onClick={handleSaveOrder}
                            className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-8 py-3 rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Save size={20} /> LƯU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
