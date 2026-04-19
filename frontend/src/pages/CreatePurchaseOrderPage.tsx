import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, PlusCircle, Trash2, Save, X, Calendar as CalendarIcon, FileText, CreditCard, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { AddProductModal } from "@/components/add-product-modal"
import AddSupplierModal from "@/components/add-supplier-modal"
import { type ProductFormData } from "@/components/add-product-modal"
import { parseFloatSafe, getErrorMessage, formatDateInput } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { purchaseOrderSchema } from "@/lib/schemas"
import { productService } from "@/services/product.service"
import { supplierService } from "@/services/supplier.service"
import { purchaseOrderService } from "@/services/purchase-order.service"
import { paymentMethodService } from "@/services/payment-method.service"
import { type IProduct } from "@/types/product"
import { type ISupplier } from "@/types/supplier"
import { type IPurchaseOrder, type IPurchaseOrderItem } from "@/types/purchase-order"
import { type PaymentMethod } from "@/lib/schemas"
import { useDebounce } from "@/hooks/use-debounce"
import { cacheService } from "@/services/cache.service"
import { formatDateTimeInput } from "@/lib/utils"

// Helper functions for date conversion
const formatDateTimeToVN = (isoString: string) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
}

const parseVNDateTimeToISO = (vnString: string) => {
    if (!vnString) return new Date().toISOString()
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s(\d{1,2}):(\d{1,2})$/
    const match = vnString.match(regex)
    if (match) {
        const [, day, month, year, hours, minutes] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
        return date.toISOString()
    }
    return new Date().toISOString()
}

const DRAFT_STORAGE_KEY = "purchase_order_draft"

export default function CreatePurchaseOrderPage() {
    const navigate = useNavigate()

    // Form state
    const [supplierId, setSupplierId] = useState("")
    const [supplierName, setSupplierName] = useState("")
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<IPurchaseOrderItem[]>([])

    const generateOrderId = () => {
        const now = new Date();
        const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
        const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
        return `PN${datePart}${timePart}${randomPart}`;
    };

    // Metadata (some auto-generated/fixed)
    const [orderId, setOrderId] = useState(generateOrderId)
    const [dateValue, setDateValue] = useState(() => formatDateTimeToVN(new Date().toISOString()))
    const [dateError, setDateError] = useState("")
    const dateInputRef = useRef<HTMLInputElement>(null)
    const createdBy = "Quản trị viên"
    const [paymentMethod, setPaymentMethod] = useState("Chuyển khoản")
    const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>(() => cacheService.get("payment_methods") || [])

    const [showAddModal, setShowAddModal] = useState(false)
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [showResults, setShowResults] = useState(false)
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [allProducts, setAllProducts] = useState<IProduct[]>(() => cacheService.get("products") || [])
    const [allSuppliers, setAllSuppliers] = useState<ISupplier[]>(() => cacheService.get("suppliers") || [])

    // Draft handling
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

    const clearDraft = useCallback(() => {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
    }, [])

    const saveDraft = useCallback(() => {
        const draftData = {
            orderId,
            importDate: dateValue,
            supplierId,
            supplierName,
            invoiceNumber,
            notes,
            items,
            paymentMethod,
            timestamp: new Date().getTime()
        }
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
    }, [orderId, dateValue, supplierId, supplierName, invoiceNumber, notes, items, paymentMethod])

    // Auto-save useEffect
    useEffect(() => {
        if (items.length > 0 || supplierId || invoiceNumber || notes) {
            saveDraft()
        }
    }, [items, supplierId, supplierName, invoiceNumber, notes, paymentMethod, dateValue, saveDraft])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [products, suppliers, paymentMethods] = await Promise.all([
                    productService.getAll(),
                    supplierService.getAll(),
                    paymentMethodService.getAll()
                ]);
                setAllProducts(products);
                setAllSuppliers(suppliers);
                setAllPaymentMethods(paymentMethods);

                // Save to cache
                cacheService.set("products", products);
                cacheService.set("suppliers", suppliers);
                cacheService.set("payment_methods", paymentMethods);

                // Load draft if exists
                const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
                if (savedDraft && !hasRestoredDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft)
                        // Only restore if it's "fresh" enough (optional, let's just restore)
                        setOrderId(parsed.orderId)
                        if (parsed.importDate) setDateValue(parsed.importDate)
                        setSupplierId(parsed.supplierId)
                        setSupplierName(parsed.supplierName)
                        setInvoiceNumber(parsed.invoiceNumber)
                        setNotes(parsed.notes)
                        setItems(parsed.items)
                        setPaymentMethod(parsed.paymentMethod)
                        setHasRestoredDraft(true)
                        toast.info("Đã khôi phục bản nháp phiếu nhập trước đó", {
                            description: `Phiếu lưu vào lúc ${new Date(parsed.timestamp).toLocaleString("vi-VN")}`,
                            duration: 5000,
                        })
                    } catch (e) {
                        console.error("Failed to parse draft", e)
                    }
                } else {
                    // Set default payment method if no draft
                    const defaultMethod = paymentMethods.find((m: PaymentMethod) => m.isDefault);
                    if (defaultMethod) {
                        setPaymentMethod(defaultMethod.name);
                    } else if (paymentMethods.length > 0) {
                        setPaymentMethod(paymentMethods[0].name);
                    }
                }
            } catch (error: unknown) {
                console.error("Error fetching data:", getErrorMessage(error));
                toast.error("Không thể tải dữ liệu: " + getErrorMessage(error));
            }
        };
        fetchData();
    }, []);

    const filteredSuggestions = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return []
        const query = debouncedSearchQuery.toLowerCase()
        return allProducts.filter(p =>
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.id && p.id.toLowerCase().includes(query))
        ).slice(0, 10)
    }, [debouncedSearchQuery, allProducts])

    const handleQuickAdd = useCallback((product: IProduct) => {
        const qty = 1
        const importPrice = product.importPrice || 0
        const total = qty * importPrice
        const vatPct = 5
        const vatAmt = Math.round(total * vatPct / 100)

        const newItem: IPurchaseOrderItem = {
            id: `new-${Date.now()}-${Math.random()}`,
            code: product.id || "",
            name: product.name || "",
            unit: product.unit || product.baseUnitName || "",
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
        setSelectedIndex(-1)
        toast.success(`Đã thêm nhanh: ${product.name}`)
    }, [])

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || filteredSuggestions.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
        } else if (e.key === "Enter") {
            e.preventDefault()
            const selected = selectedIndex >= 0 ? filteredSuggestions[selectedIndex] : filteredSuggestions[0]
            if (selected) {
                handleQuickAdd(selected)
            }
        } else if (e.key === "Escape") {
            setShowResults(false)
            setSelectedIndex(-1)
        }
    }

    const handleProductSaved = useCallback((savedProduct: IProduct, formData: ProductFormData) => {
        // Add to the search list immediately
        setAllProducts(prev => [savedProduct, ...prev])

        const firstUnit = formData.units?.[0]
        const qty = 1
        const importPrice = firstUnit?.importPrice || 0
        const retailPrice = firstUnit?.retailPrice || importPrice
        const vatPct = Number(formData.vatPercent) || 0
        const discountPct = Number(formData.discountPercent) || 0
        const total = qty * importPrice
        const discountAmt = Math.round(total * discountPct / 100)
        const vatAmt = Math.round((total - discountAmt) * vatPct / 100)

        const newItem: IPurchaseOrderItem = {
            id: `new-${Date.now()}-${Math.random()}`,
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

    const handleQuickSupplierAdded = useCallback(async (newSupplier: ISupplier) => {
        try {
            const data = await supplierService.create(newSupplier)
            setAllSuppliers(prev => [data, ...prev])
            setSupplierId(data.id || "")
            setSupplierName(data.name || "")
            toast.success("Đã thêm nhanh nhà cung cấp và tự động chọn!")
        } catch (error: unknown) {
            toast.error(`Lỗi khi thêm nhà cung cấp: ${getErrorMessage(error)}`)
        }
    }, [])

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
        toast.error("Đã xóa sản phẩm khỏi phiếu")
    }, [])

    const roundTo3 = (num: number) => {
        return Math.round((num + Number.EPSILON) * 1000) / 1000
    }

    const updateItemField = useCallback((id: string, field: keyof IPurchaseOrderItem, value: string | number | boolean) => {
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

    const handleSaveOrder = useCallback(async () => {
        // Validate date
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s(\d{1,2}):(\d{1,2})$/
        if (!dateValue || !dateRegex.test(dateValue)) {
            toast.error("Ngày nhập không hợp lệ (định dạng: dd/mm/yyyy HH:mm)")
            setDateError("Định dạng dd/mm/yyyy HH:mm")
            return
        }

        // Prepare data for validation
        const orderData = {
            id: orderId,
            importDate: parseVNDateTimeToISO(dateValue),
            supplierId,
            supplierName,
            totalAmount,
            discount: totalDiscount,
            vat: totalVat,
            grandTotal: amountToPay,
            notes,
            createdBy,
            invoiceNumber,
            paymentMethod,
            items: items.map(item => ({
                ...item,
                quantity: Number(item.quantity),
                importPrice: Number(item.importPrice),
                retailPrice: Number(item.retailPrice),
                totalAmount: Number(item.totalAmount),
                discountPercent: Number(item.discountPercent),
                discountAmount: Number(item.discountAmount),
                vatPercent: Number(item.vatPercent),
                vatAmount: Number(item.vatAmount),
                remainingAmount: Number(item.remainingAmount)
            }))
        }

        // Validate using centralized schema
        const validation = purchaseOrderSchema.safeParse(orderData)

        if (!validation.success) {
            const firstError = validation.error.issues[0]
            toast.error(firstError.message)

            // Log all errors for developer debugging
            console.error("Validation failed:", validation.error.format())
            return
        }

        const newOrder: IPurchaseOrder = {
            id: orderId,
            importDate: parseVNDateTimeToISO(dateValue),
            supplierId,
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

        try {
            await purchaseOrderService.create(newOrder)
            clearDraft()
            toast.success("Đã tạo phiếu nhập mới thành công")
            navigate("/purchase-orders")
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            if (errorMsg.includes("E11000") || errorMsg.includes("duplicate key")) {
                toast.error("Lỗi: Mã phiếu này đã tồn tại trong hệ thống. Đang tự động làm mới mã...");
                setOrderId(generateOrderId());
            } else {
                toast.error("Lỗi khi lưu đơn hàng: " + errorMsg)
            }
        }
    }, [items, supplierId, invoiceNumber, notes, dateValue, createdBy, paymentMethod, navigate, orderId, supplierName, totalAmount, totalDiscount, totalVat, amountToPay])

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
            {/* ── HEADER SECTION ── */}
            <div className="flex-none p-3 sm:p-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-[#5c9a38]" />
                        Tạo phiếu nhập mới
                    </h1>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {items.length > 0 && (
                            <button
                                onClick={() => {
                                    if (window.confirm("Bạn có chắc chắn muốn xóa bản nháp và làm mới phiếu này?")) {
                                        clearDraft()
                                        setItems([])
                                        setSupplierId("")
                                        setSupplierName("")
                                        setInvoiceNumber("")
                                        setNotes("")
                                        setOrderId(generateOrderId())
                                        toast.success("Đã xóa bản nháp")
                                    }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:text-red-400 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors border border-red-200 dark:border-red-900/30 flex-1 sm:flex-none"
                            >
                                <Trash2 className="w-4 h-4 inline mr-1" /> Xóa bản nháp
                            </button>
                        )}
                        <button
                            onClick={() => navigate("/purchase-orders")}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none"
                        >
                            <X className="w-4 h-4 inline mr-1" /> Thoát
                        </button>
                        <button
                            onClick={handleSaveOrder}
                            className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 sm:px-8 py-2 rounded text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                        >
                            <Save className="w-4 h-4 sm:w-5 sm:h-5" /> LƯU PHIẾU
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 border p-3 rounded-xl bg-white dark:bg-neutral-800 shadow-sm transition-all">
                    {/* Supplier Select */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nhà cung cấp *</label>
                        <div className="flex gap-2">
                            <select
                                value={supplierId}
                                onChange={(e) => {
                                    const s = allSuppliers.find(x => x.id === e.target.value)
                                    setSupplierId(e.target.value)
                                    setSupplierName(s?.name || "")
                                }}
                                className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                            >
                                <option value="">Chọn nhà cung cấp...</option>
                                {allSuppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowAddSupplierModal(true)}
                                className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-2 rounded border border-green-200 dark:border-green-800/50 hover:bg-green-100 transition-colors shadow-sm"
                                title="Thêm nhanh nhà cung cấp"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
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
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><CalendarIcon size={10} /> Ngày nhập</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={dateValue}
                                onChange={(e) => {
                                    setDateValue(formatDateTimeInput(e.target.value))
                                    if (dateError) setDateError("")
                                }}
                                placeholder="dd/mm/yyyy HH:mm"
                                className={`w-full bg-white dark:bg-neutral-900 border ${dateError ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'} px-3 py-2 pr-10 rounded text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono`}
                            />
                            <button
                                type="button"
                                onClick={() => dateInputRef.current?.showPicker()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                            >
                                <CalendarIcon size={16} />
                            </button>
                            <input
                                type="datetime-local"
                                ref={dateInputRef}
                                className="absolute opacity-0 pointer-events-none"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setDateValue(formatDateTimeToVN(new Date(e.target.value).toISOString()))
                                    }
                                }}
                            />
                            {dateError && <span className="absolute -bottom-4 left-0 text-[9px] text-red-500 font-bold">{dateError}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><CreditCard size={10} /> HTTT</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        >
                            {allPaymentMethods.map(m => (
                                <option key={m.id || m.name} value={m.name}>{m.name}</option>
                            ))}
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
                <div className="mt-3 relative group">
                    <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-green-500/10 focus-within:border-green-500 transition-all p-1">
                        <div className="pl-3 text-gray-400 group-focus-within:text-green-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm sản phẩm (F1)..."
                            className="flex-1 bg-transparent border-none outline-none text-sm py-1.5 px-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 font-medium"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowResults(true)
                                setSelectedIndex(-1)
                            }}
                            onFocus={() => setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            onKeyDown={handleSearchKeyDown}
                        />
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-green-800/50"
                        >
                            <PlusCircle size={16} />
                            <span>Thêm mới sản phẩm (F2)</span>
                        </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                            {filteredSuggestions.length > 0 ? (
                                <div className="max-h-[400px] overflow-y-auto p-2">
                                    {filteredSuggestions.map((product, index) => (
                                        <button
                                            key={product.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                handleQuickAdd(product)
                                            }}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-colors text-left group ${selectedIndex === index ? "bg-green-100 dark:bg-green-900/40 border-l-4 border-green-500" : "hover:bg-green-50 dark:hover:bg-green-900/20"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-base font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-600 transition-colors">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                                                    <span className="bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded-md font-mono text-[10px]">{product.id}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span>ĐVT: <b className="text-gray-700 dark:text-gray-300">{product.baseUnitName}</b></span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span className="text-green-600 dark:text-green-400 font-bold">Giá: {vnd(product.importPrice || 0)}</span>
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

            <AddSupplierModal
                isOpen={showAddSupplierModal}
                onClose={() => setShowAddSupplierModal(false)}
                onAdd={handleQuickSupplierAdded}
            />

            {/* ── LINE ITEMS DATA GRID ── */}
            <div className="flex-1 overflow-auto p-3 bg-gray-50/30 dark:bg-neutral-900">
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden min-w-fit">
                    <table className="w-full text-[11px] text-left whitespace-nowrap border-collapse">
                        <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-700 sticky top-0 ">
                            <tr>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 w-24">Mã SP</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 min-w-[200px]">Tên sản phẩm</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 w-16">ĐVT</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-center w-24">Số lô *</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-center w-28">Hạn dùng *</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right w-16">SL</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right w-24">Giá nhập *</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right w-24">Giá bán</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right">Tổng tiền</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right w-12">%CK</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right w-20">CK VNĐ</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right w-12">%VAT</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right w-20">VAT</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-right font-bold text-blue-600 dark:text-blue-400">Còn lại</th>
                                <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-700 text-center w-20">SĐK</th>
                                <th className="px-2 py-2 text-center w-8">#</th>
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
                                    <tr key={item.id} className="hover:bg-green-50/20 dark:hover:bg-green-900/5 transition-colors group border-b dark:border-neutral-700">
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-gray-500 dark:text-gray-400 font-medium">{item.code}</td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800">
                                            <div className="font-semibold text-gray-800 dark:text-gray-100 max-w-[200px] truncate" title={item.name}>{item.name}</div>
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-center text-gray-600 dark:text-gray-300 font-medium">{item.unit}</td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800">
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50/40 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-900/30 px-1 py-1 rounded text-center outline-none focus:ring-1 focus:ring-blue-500 text-[11px] font-semibold text-blue-800 dark:text-blue-300"
                                                value={item.batchNumber || ""}
                                                placeholder="..."
                                                onChange={(e) => updateItemField(item.id!, 'batchNumber', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800">
                                            <input
                                                type="text"
                                                className="w-full bg-blue-50/40 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-900/30 px-1 py-1 rounded text-center outline-none focus:ring-1 focus:ring-blue-500 text-[11px] font-semibold text-blue-800 dark:text-blue-300"
                                                value={item.expiryDate || ""}
                                                placeholder="DD/MM/YYYY"
                                                onChange={(e) => {
                                                    updateItemField(item.id!, 'expiryDate', formatDateInput(e.target.value));
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-full bg-gray-50 dark:bg-neutral-900/30 border border-gray-200 dark:border-neutral-700 px-1 py-1 rounded text-right outline-none focus:ring-1 focus:ring-green-500 font-bold text-gray-800 dark:text-gray-100"
                                                value={Number(item.quantity)}
                                                onChange={(v) => updateItemField(item.id!, 'quantity', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-full bg-transparent border-none px-1 py-1 text-right outline-none font-bold text-red-600 dark:text-red-400"
                                                value={Number(item.importPrice)}
                                                onChange={(v) => updateItemField(item.id!, 'importPrice', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-full bg-transparent border-none px-1 py-1 text-right outline-none font-bold text-gray-700 dark:text-gray-300"
                                                value={Number(item.retailPrice)}
                                                onChange={(v) => updateItemField(item.id!, 'retailPrice', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right font-semibold text-gray-600 dark:text-gray-300">{vnd(item.totalAmount)}</td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-full bg-transparent border-none text-right outline-none p-0 font-medium"
                                                value={Number(item.discountPercent)}
                                                onChange={(v) => updateItemField(item.id!, 'discountPercent', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right text-gray-400 dark:text-gray-500 font-medium">{vnd(item.discountAmount)}</td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right">
                                            <NumericInput
                                                className="w-full bg-transparent border-none text-right outline-none p-0 font-medium"
                                                value={Number(item.vatPercent)}
                                                onChange={(v) => updateItemField(item.id!, 'vatPercent', v)}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right text-gray-400 dark:text-gray-500 font-medium">{vnd(item.vatAmount)}</td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-right font-bold text-green-700 dark:text-green-400">{vnd(item.remainingAmount)}</td>
                                        <td className="px-2 py-1.5 border-r border-gray-100 dark:border-neutral-800 text-center">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent border-none px-1 py-0.5 text-center text-[11px] font-medium outline-none text-gray-500 dark:text-gray-400"
                                                value={item.registrationNumber || ""}
                                                placeholder="-"
                                                onChange={(e) => updateItemField(item.id!, 'registrationNumber', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 text-center">
                                            <button
                                                onClick={() => removeItem(item.id!)}
                                                className="text-gray-300 hover:text-red-400 transition-colors p-1"
                                                title="Xóa"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex-none p-2.5 sm:p-4 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="flex-1 flex flex-col gap-1 w-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Ghi chú phiếu nhập</label>
                        <textarea
                            placeholder="Nhập ghi chú thêm..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-gray-50/50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-2 rounded-xl text-xs dark:text-gray-100 min-h-[50px] lg:min-h-[80px] outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all resize-none italic"
                        />
                    </div>

                    <div className="w-full lg:w-[360px] bg-gray-50/30 dark:bg-neutral-800/50 p-4 rounded-xl border border-gray-100 dark:border-neutral-700 shadow-sm">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[11px] sm:text-xs">
                                <span className="text-gray-500 font-medium tracking-tight">Tổng tiền hàng:</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300 ml-auto">{vnd(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] sm:text-xs">
                                <span className="text-gray-500 font-medium tracking-tight">Tổng chiết khấu:</span>
                                <span className="font-bold text-orange-500 ml-auto">-{vnd(totalDiscount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] sm:text-xs">
                                <span className="text-gray-500 font-medium tracking-tight">Tổng thuế VAT:</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300 ml-auto">+{vnd(totalVat)}</span>
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-neutral-700 my-1"></div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Cần thanh toán</span>
                                <div className="text-xl sm:text-2xl font-black text-[#5c9a38] drop-shadow-sm flex items-baseline gap-1">
                                    {vnd(amountToPay)} <span className="text-[9px] sm:text-[10px] font-bold opacity-60">đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-50 dark:border-neutral-800">
                    <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="checkbox" className="rounded-md w-4 h-4 accent-[#5c9a38]" />
                            <span className="text-[11px] font-bold text-gray-500">Giá đã bao gồm VAT</span>
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate("/purchase-orders")}
                            className="flex items-center gap-1.5 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-neutral-800 transition text-gray-600 dark:text-gray-400 font-bold"
                        >
                            <AlertCircle size={14} /> Danh sách
                        </button>
                        <button
                            onClick={handleSaveOrder}
                            className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-8 py-2 rounded-lg text-xs font-black shadow-lg shadow-green-500/10 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Save size={16} /> LƯU PHIẾU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
