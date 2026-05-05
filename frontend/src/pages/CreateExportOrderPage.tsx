import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, PlusCircle, Trash2, Save, X, User, CreditCard, TrendingUp, Plus } from "lucide-react"
import { toast } from "sonner"
import { type ExportOrder, type ExportOrderItem, type Customer, exportOrderSchema } from "@/lib/schemas"
import { exportSlipService } from "@/services/export-slip.service"
import { productService } from "@/services/product.service"
import { customerService } from "@/services/customer.service"
import { paymentMethodService } from "@/services/payment-method.service"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"
import AddCustomerModal from "@/components/add-customer-modal"
import { parseFloatSafe, getErrorMessage, formatDateInput, formatDateTimeInput } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { type PaymentMethod } from "@/lib/schemas"
import type { IProduct } from "@/types/product"
import { useDebounce } from "@/hooks/use-debounce"
import { cacheService } from "@/services/cache.service"
import { Calendar as CalendarIcon } from "lucide-react"
import { sortBatchesFEFO } from "@/lib/utils"

const DRAFT_STORAGE_KEY = "export_order_draft"

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

export default function CreateExportOrderPage() {
    const navigate = useNavigate()

    // Form state
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<ExportOrderItem[]>([])
    const [paymentMethod, setPaymentMethod] = useState("Tiền mặt")
    const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>(() => cacheService.get("payment_methods") || [])
    const [isPrescription, setIsPrescription] = useState(false)
    const [doctorName, setDoctorName] = useState("")
    const [customerId, setCustomerId] = useState<string>("")
    const [customerName, setCustomerName] = useState("Khách lẻ")
    const [symptoms, setSymptoms] = useState("")

    const [allProducts, setAllProducts] = useState<IProduct[]>(() => cacheService.get("products") || [])
    const [allCustomers, setAllCustomers] = useState<Customer[]>(() => cacheService.get("customers") || [])
    const [isLoading, setIsLoading] = useState(!allProducts.length)

    // Metadata
    const [orderId] = useState(() => `PX${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`)
    const [dateValue, setDateValue] = useState(() => formatDateTimeToVN(new Date().toISOString()))
    const [dateError, setDateError] = useState("")

    const [showAddModal, setShowAddModal] = useState(false)
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
    const dateInputRef = useRef<HTMLInputElement>(null)

    // Draft handling
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

    const clearDraft = useCallback(() => {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
    }, [])

    const saveDraft = useCallback(() => {
        const draftData = {
            notes,
            items,
            paymentMethod,
            isPrescription,
            doctorName,
            customerId,
            customerName,
            symptoms,
            dateValue,
            timestamp: new Date().getTime()
        }
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
    }, [notes, items, paymentMethod, isPrescription, doctorName, customerId, customerName, symptoms, dateValue])

    // Auto-save useEffect
    useEffect(() => {
        if (items.length > 0 || customerId || (customerName !== "Khách lẻ" && customerName !== "") || notes || symptoms) {
            saveDraft()
        }
    }, [items, customerId, customerName, notes, paymentMethod, dateValue, symptoms, isPrescription, doctorName, saveDraft])

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [productsData, customersData, paymentMethodsData] = await Promise.all([
                    productService.getAll(),
                    customerService.getAll(),
                    paymentMethodService.getAll()
                ])
                setAllProducts(productsData)
                setAllCustomers(customersData)
                setAllPaymentMethods(paymentMethodsData)

                // Save to cache
                cacheService.set("products", productsData)
                cacheService.set("customers", customersData)
                cacheService.set("payment_methods", paymentMethodsData)

                // Load draft if exists
                const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
                if (savedDraft && !hasRestoredDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft)
                        setNotes(parsed.notes || "")
                        setItems(parsed.items || [])
                        setPaymentMethod(parsed.paymentMethod || "Tiền mặt")
                        setIsPrescription(parsed.isPrescription || false)
                        setDoctorName(parsed.doctorName || "")
                        setCustomerId(parsed.customerId || "")
                        setCustomerName(parsed.customerName || "Khách lẻ")
                        setSymptoms(parsed.symptoms || "")
                        if (parsed.dateValue) setDateValue(parsed.dateValue)
                        setHasRestoredDraft(true)
                        toast.info("Đã khôi phục bản nháp phiếu bán hàng trước đó", {
                            description: `Phiếu lưu vào lúc ${new Date(parsed.timestamp).toLocaleString("vi-VN")}`,
                            duration: 5000,
                        })
                    } catch (e) {
                        console.error("Failed to parse draft", e)
                    }
                } else {
                    // Set default payment method if no draft
                    const defaultMethod = paymentMethodsData.find((m: PaymentMethod) => m.isDefault);
                    if (defaultMethod) {
                        setPaymentMethod(defaultMethod.name);
                    } else if (paymentMethodsData.length > 0) {
                        setPaymentMethod(paymentMethodsData[0].name);
                    }
                }
            } catch (error: unknown) {
                toast.error("Không thể tải dữ liệu: " + getErrorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [showResults, setShowResults] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)

    const filteredSuggestions = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return []
        const query = debouncedSearchQuery.toLowerCase()
        return allProducts.filter(p =>
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.id && p.id.toLowerCase().includes(query))
        ).slice(0, 10)
    }, [debouncedSearchQuery, allProducts])

    // Customer search state
    const debouncedCustomerName = useDebounce(customerName, 300)
    const [showCustomerResults, setShowCustomerResults] = useState(false)
    const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1)

    const filteredCustomers = useMemo(() => {
        if (!debouncedCustomerName.trim() || customerName === "Khách lẻ") return []
        const query = debouncedCustomerName.toLowerCase()
        return allCustomers.filter(c =>
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.phone && c.phone.includes(query)) ||
            (c.id && c.id.toLowerCase().includes(query))
        ).slice(0, 8)
    }, [debouncedCustomerName, allCustomers])

    const handleSelectCustomer = useCallback((customer: Customer) => {
        setCustomerId(customer.id || "")
        setCustomerName(customer.name)
        setShowCustomerResults(false)
        setSelectedCustomerIndex(-1)
        toast.success(`Đã chọn khách hàng: ${customer.name}`)
    }, [])

    const handleQuickAdd = useCallback((product: IProduct) => {
        setItems(prev => {
            const existingQty = prev.filter(i => i.code === product.id).reduce((sum, curr) => sum + curr.quantity, 0)
            const newTotalQty = existingQty + 1;

            const sortedBatches = sortBatchesFEFO(product.batches?.filter(b => b.quantity > 0) || [])

            const retailPrice = product.retailPrice || 0
            const importPrice = product.importPrice || 0
            const unit = product.unit || product.baseUnitName || ""

            const newRows: ExportOrderItem[] = [];
            let remaining = newTotalQty;

            if (sortedBatches.length > 0) {
                for (const batch of sortedBatches) {
                    if (remaining <= 0) break;
                    const qtyFromBatch = Math.min(batch.quantity, remaining);
                    newRows.push({
                        id: `new-${Date.now()}-${Math.random()}`,
                        code: product.id || "",
                        name: product.name || "",
                        unit,
                        batchNumber: batch.batchNumber,
                        expiryDate: batch.expiryDate || "",
                        quantity: qtyFromBatch,
                        retailPrice,
                        importPrice,
                        totalAmount: qtyFromBatch * retailPrice,
                        discountPercent: 0,
                        discountAmount: 0,
                        remainingAmount: qtyFromBatch * retailPrice
                    });
                    remaining -= qtyFromBatch;
                }
            }

            if (remaining > 0) {
                if (newRows.length > 0) {
                    const last = newRows[newRows.length - 1];
                    last.quantity += remaining;
                    last.totalAmount = last.quantity * last.retailPrice;
                    last.remainingAmount = last.quantity * last.retailPrice;
                } else {
                    const defaultBatch = product.batches?.[0]
                    newRows.push({
                        id: `new-${Date.now()}-${Math.random()}`,
                        code: product.id || "",
                        name: product.name || "",
                        unit,
                        batchNumber: defaultBatch?.batchNumber || "",
                        expiryDate: defaultBatch?.expiryDate || "",
                        quantity: remaining,
                        retailPrice,
                        importPrice,
                        totalAmount: remaining * retailPrice,
                        discountPercent: 0,
                        discountAmount: 0,
                        remainingAmount: remaining * retailPrice
                    });
                }
            }

            const otherItems = prev.filter(i => i.code !== product.id)
            return [...newRows, ...otherItems];
        })

        setSearchQuery("")
        setShowResults(false)
        setSelectedIndex(-1)
        toast.success(`Đã thêm: ${product.name}`)
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

    const handleCustomerSearchKeyDown = (e: React.KeyboardEvent) => {
        if (!showCustomerResults || filteredCustomers.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedCustomerIndex(prev => (prev < filteredCustomers.length - 1 ? prev + 1 : prev))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedCustomerIndex(prev => (prev > 0 ? prev - 1 : prev))
        } else if (e.key === "Enter") {
            e.preventDefault()
            const selected = selectedCustomerIndex >= 0 ? filteredCustomers[selectedCustomerIndex] : filteredCustomers[0]
            if (selected) {
                handleSelectCustomer(selected)
            }
        } else if (e.key === "Escape") {
            setShowCustomerResults(false)
            setSelectedCustomerIndex(-1)
        }
    }

    const handleProductSaved = useCallback((savedProduct: IProduct, formData: ProductFormData) => {
        // Add to the search list immediately
        setAllProducts(prev => [savedProduct, ...prev])

        const firstUnit = formData.units?.[0]
        const qty = 1
        const retailPrice = firstUnit?.retailPrice || 0
        const importPrice = firstUnit?.importPrice || 0
        const total = qty * retailPrice

        const newItem: ExportOrderItem = {
            id: `new-${Date.now()}-${Math.random()}`,
            code: savedProduct.id || formData.productCode || "",
            name: savedProduct.name || formData.productName,
            unit: firstUnit?.unitName || "Viên",
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
        setItems(prev => [newItem, ...prev])
    }, [])

    const handleCustomerAdded = useCallback(async (customer: Customer) => {
        try {
            const savedCustomer = await customerService.create(customer)
            setAllCustomers(prev => [savedCustomer, ...prev])
            setCustomerId(savedCustomer.id || "")
            setCustomerName(savedCustomer.name)
            toast.success(`Đã thêm và chọn khách hàng: ${savedCustomer.name}`)
        } catch (error) {
            toast.error("Lỗi khi lưu khách hàng mới: " + getErrorMessage(error))
        }
    }, [])

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
        toast.error("Đã xóa sản phẩm khỏi phiếu")
    }

    const updateItemField = useCallback((id: string, field: keyof ExportOrderItem, value: string | number | boolean) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item

            const updatedItem = { ...item, [field]: value }

            if (['quantity', 'retailPrice', 'discountPercent'].includes(field as string)) {
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

    const handleQuantityBlur = useCallback((code: string) => {
        setItems(prev => {
            const productItems = prev.filter(i => i.code === code)
            if (productItems.length === 0) return prev

            const product = allProducts.find(p => p.id === code)
            if (!product || !product.batches || product.batches.length === 0) return prev

            const totalQty = productItems.reduce((acc, item) => acc + Number(item.quantity), 0)
            const templateItem = productItems[0]

            const sortedBatches = sortBatchesFEFO(product.batches.filter(b => b.quantity > 0))
            if (sortedBatches.length === 0) return prev

            let remaining = totalQty;
            const newRows: ExportOrderItem[] = [];

            for (const batch of sortedBatches) {
                if (remaining <= 0) break;

                const qtyFromBatch = Math.min(batch.quantity, remaining);

                const newItem: ExportOrderItem = {
                    ...templateItem,
                    id: `fefo-${Date.now()}-${Math.random()}`,
                    batchNumber: batch.batchNumber,
                    expiryDate: batch.expiryDate || "",
                    quantity: qtyFromBatch,
                    totalAmount: qtyFromBatch * templateItem.retailPrice,
                    discountAmount: (qtyFromBatch * templateItem.retailPrice) * (templateItem.discountPercent / 100),
                    remainingAmount: (qtyFromBatch * templateItem.retailPrice) * (1 - templateItem.discountPercent / 100)
                };

                newRows.push(newItem);
                remaining -= qtyFromBatch;
            }

            if (remaining > 0) {
                if (newRows.length > 0) {
                    const last = newRows[newRows.length - 1];
                    last.quantity += remaining;
                    last.totalAmount = last.quantity * last.retailPrice;
                    last.discountAmount = last.totalAmount * (last.discountPercent / 100);
                    last.remainingAmount = last.totalAmount - last.discountAmount;
                } else {
                    const fallbackItem: ExportOrderItem = {
                        ...templateItem,
                        id: `fefo-${Date.now()}-${Math.random()}`,
                        quantity: remaining,
                        totalAmount: remaining * templateItem.retailPrice,
                        discountAmount: (remaining * templateItem.retailPrice) * (templateItem.discountPercent / 100),
                        remainingAmount: (remaining * templateItem.retailPrice) * (1 - templateItem.discountPercent / 100)
                    };
                    newRows.push(fallbackItem);
                }
            }

            const firstIndex = prev.findIndex(i => i.code === code)
            const remainingPrev = prev.filter(i => i.code !== code)
            remainingPrev.splice(firstIndex, 0, ...newRows)

            return remainingPrev
        })
    }, [allProducts])

    const handleSaveOrder = async () => {
        const vnDate = dateValue
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s(\d{1,2}):(\d{1,2})$/
        if (!vnDate || !dateRegex.test(vnDate)) {
            toast.error("Ngày bán không hợp lệ (định dạng: dd/mm/yyyy HH:mm)")
            setDateError("Định dạng dd/mm/yyyy HH:mm")
            return
        }

        const parts = vnDate.match(dateRegex)
        if (parts) {
            const d = parseInt(parts[1], 10)
            const m = parseInt(parts[2], 10) - 1
            const y = parseInt(parts[3], 10)
            const h = parseInt(parts[4], 10)
            const min = parseInt(parts[5], 10)
            const checkDate = new Date(y, m, d, h, min)
            if (checkDate.getFullYear() !== y || checkDate.getMonth() !== m || checkDate.getDate() !== d || checkDate.getHours() !== h || checkDate.getMinutes() !== min) {
                toast.error("Ngày tháng này không có trong lịch!")
                setDateError("Ngày không hợp lệ")
                return
            }
        }

        const finalExportDate = parseVNDateTimeToISO(vnDate)
        const selectedCustomer = allCustomers.find(c => c.id === customerId)
        const finalCustomerName = customerName || "Khách lẻ";
        let finalCustomerId = customerId || "KHLE";

        // Auto-create customer if it's a manual entry and not 'Khách lẻ'
        if ((!customerId || customerId === "KHLE") && finalCustomerName !== "Khách lẻ") {
            try {
                const timestamp = Date.now().toString().slice(-6)
                const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase()
                const newId = `KH${timestamp}${randomStr}`

                const newCustomer: Customer = {
                    id: newId,
                    name: finalCustomerName,
                    phone: "",
                    gender: "Nam",
                    dob: "",
                    address: "",
                    notes: "Tự động tạo từ phiếu bán hàng"
                }

                await customerService.create(newCustomer)
                finalCustomerId = newId
                toast.success(`Đã tự động thêm khách hàng: ${finalCustomerName}`)
            } catch (err) {
                console.error("Auto-customer creation failed:", err)
            }
        }

        const newSlip: ExportOrder = {
            id: orderId,
            exportDate: finalExportDate,
            customerId: finalCustomerId,
            customerName: finalCustomerName,
            customerPhone: selectedCustomer?.phone || "",
            notes,
            createdBy: "Quản trị viên",
            paymentMethod,
            paymentStatus: "Đã thanh toán",
            isPrescription,
            doctorName: isPrescription ? doctorName : undefined,
            symptoms,
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
            totalAmount: amountToPay,
            grandTotal: amountToPay
        }

        // Validate using schema
        const validation = exportOrderSchema.safeParse(newSlip)
        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        try {
            await exportSlipService.create(newSlip)
            clearDraft()
            toast.success("Tạo phiếu bán hàng thành công!")
            navigate("/export-manage")
        } catch (error: unknown) {
            toast.error("Lỗi khi tạo phiếu bán hàng: " + getErrorMessage(error))
        }
    }

    const vnd = (val: number) => val.toLocaleString("vi-VN")

    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0)
    const amountToPay = totalAmount
    const totalImportPrice = items.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0)
    const totalProfit = amountToPay - totalImportPrice

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-[#5c9a38] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
            {/* ── HEADER SECTION ── */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 sm:gap-6">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#5c9a38]" />
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                            Tạo phiếu bán hàng
                        </h1>
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                        {items.length > 0 && (
                            <button
                                onClick={() => {
                                    if (window.confirm("Bạn có chắc chắn muốn xóa bản nháp và làm mới phiếu này?")) {
                                        clearDraft()
                                        setItems([])
                                        setCustomerId("")
                                        setCustomerName("Khách lẻ")
                                        setNotes("")
                                        setSymptoms("")
                                        setDoctorName("")
                                        setIsPrescription(false)
                                        toast.success("Đã xóa bản nháp")
                                    }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:text-red-400 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors border border-red-200 dark:border-red-900/30 flex-1 sm:flex-none"
                            >
                                <Trash2 className="w-4 h-4 inline mr-1" /> Xóa bản nháp
                            </button>
                        )}
                        <button
                            onClick={() => navigate("/export-manage")}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4" /> Thoát
                        </button>
                        <button
                            onClick={handleSaveOrder}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 sm:px-6 py-2 rounded text-xs sm:text-sm font-bold shadow-sm transition-all"
                        >
                            <Save className="w-4 h-4 sm:w-5 sm:h-5" /> LƯU PHIẾU
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 border p-3 sm:p-4 rounded-xl bg-white dark:bg-neutral-800 shadow-sm items-end">
                    {/* Customer Info */}
                    <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1.5">
                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><User size={10} /> Khách hàng *</label>
                        <div className="flex gap-1 relative">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value)
                                        setShowCustomerResults(true)
                                        setSelectedCustomerIndex(-1)
                                        if (customerId && customerId !== "KHLE") {
                                            setCustomerId("") // Reset ID if user starts typing a new name
                                        }
                                    }}
                                    onFocus={() => setShowCustomerResults(true)}
                                    onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                                    onKeyDown={handleCustomerSearchKeyDown}
                                    placeholder="Tên khách hàng..."
                                    className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-semibold"
                                />

                                {showCustomerResults && filteredCustomers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl z-[60] overflow-hidden max-h-[300px] overflow-y-auto">
                                        {filteredCustomers.map((customer, index) => (
                                            <button
                                                key={customer.id}
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    handleSelectCustomer(customer)
                                                }}
                                                className={`w-full flex flex-col items-start p-2.5 transition-colors border-b last:border-0 border-gray-50 dark:border-neutral-700/50 ${selectedCustomerIndex === index ? "bg-green-50 dark:bg-green-900/20" : "hover:bg-gray-50 dark:hover:bg-neutral-700/30"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm">
                                                        {customer.name}
                                                    </span>
                                                    <span className="text-[10px] bg-gray-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded font-mono text-gray-500">
                                                        {customer.id}
                                                    </span>
                                                </div>
                                                {customer.phone && (
                                                    <div className="text-[10px] sm:text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <span>SĐT: {customer.phone}</span>
                                                        {customer.address && <span className="opacity-30">•</span>}
                                                        {customer.address && <span className="truncate max-w-[150px]">{customer.address}</span>}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowAddCustomerModal(true)}
                                className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/20 text-[#5c9a38] rounded border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors h-[34px] sm:h-[40px] flex items-center justify-center"
                                title="Thêm khách hàng mới"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-1.5">
                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Số phiếu</label>
                        <input
                            type="text"
                            value={orderId}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 px-2 py-1.5 sm:py-2 rounded text-[10px] sm:text-[11px] text-gray-400 font-mono"
                        />
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><CalendarIcon size={10} /> Ngày bán</label>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setDateValue(formatDateTimeToVN(new Date().toISOString()))}
                                    className="text-[9px] font-black text-[#5c9a38] hover:underline uppercase"
                                >
                                    Bây giờ
                                </button>
                                <button
                                    onClick={() => {
                                        const morning = new Date()
                                        morning.setHours(8, 0, 0, 0)
                                        setDateValue(formatDateTimeToVN(morning.toISOString()))
                                    }}
                                    className="text-[9px] font-black text-blue-500 hover:underline uppercase"
                                >
                                    8h Sáng
                                </button>
                            </div>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={dateValue}
                                onChange={(e) => {
                                    setDateValue(formatDateTimeInput(e.target.value))
                                    if (dateError) setDateError("")
                                }}
                                placeholder="dd/mm/yyyy HH:mm"
                                className={`w-full bg-white dark:bg-neutral-900 border ${dateError ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700'} px-2 py-1.5 sm:py-2 pr-8 rounded text-[10px] sm:text-[11px] text-gray-800 dark:text-gray-200 font-mono focus:ring-2 focus:ring-[#5c9a38]/20 focus:border-[#5c9a38] outline-none transition-all shadow-sm`}
                            />
                            <button
                                onClick={() => dateInputRef.current?.showPicker()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5c9a38] transition-colors"
                            >
                                <CalendarIcon size={14} />
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

                    <div className="lg:col-span-1 flex flex-col gap-1.5">
                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><CreditCard size={10} /> HTTT</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-2 py-1.5 sm:py-2 rounded text-xs sm:text-sm text-gray-900 dark:text-gray-100 outline-none"
                        >
                            {allPaymentMethods.map(m => (
                                <option key={m.id || m.name} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] sm:text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Triệu chứng</label>
                        <input
                            type="text"
                            placeholder="Triệu chứng..."
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm outline-none font-bold text-red-600 dark:text-red-400"
                        />
                    </div>

                    <div className="lg:col-span-1 flex items-center h-[38px] sm:h-auto mb-[2px]">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isPrescription}
                                onChange={(e) => setIsPrescription(e.target.checked)}
                                className="rounded w-4 h-4 accent-[#5c9a38]"
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase italic leading-none">Toa thuốc</span>
                                {isPrescription && (
                                    <input
                                        type="text"
                                        placeholder="Bác sĩ..."
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                        className="mt-1 bg-transparent border-b border-gray-300 dark:border-neutral-700 w-16 text-[10px] text-gray-900 dark:text-gray-100 outline-none"
                                    />
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Total Amount Display - Prominent Box */}
                    <div className="sm:col-span-2 lg:col-span-2 flex justify-start sm:justify-end">
                        <div className="w-full sm:w-auto bg-green-50 dark:bg-green-900/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-green-100 dark:border-green-800/30 flex flex-col items-start sm:items-end shadow-sm">
                            <span className="text-[8px] sm:text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest leading-none mb-1">Khách thanh toán</span>
                            <span className="text-lg sm:text-xl font-black text-[#5c9a38] tabular-nums leading-none">
                                {vnd(amountToPay)} <span className="text-[10px] font-bold opacity-60">đ</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── SEARCH BAR ── */}
                <div className="mt-4 sm:mt-6 relative group">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl sm:rounded-2xl shadow-md focus-within:ring-4 focus-within:ring-[#5c9a38]/10 focus-within:border-[#5c9a38] transition-all p-1.5">
                        <div className="hidden sm:flex pl-4 text-gray-400 group-focus-within:text-[#5c9a38] transition-colors">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tên hoặc mã sản phẩm..."
                            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base py-2 px-3 sm:px-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
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
                            className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 sm:px-5 py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-green-800/50"
                        >
                            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Thêm mới sản phẩm</span>
                        </button>
                    </div>

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
                                                    <span>ĐVT: <b className="text-gray-700 dark:text-gray-300">{product.unit}</b></span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span>Tồn: <b className={product.baseQuantity && product.baseQuantity > 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500 font-black"}>{product.baseQuantity || 0} {product.unit}</b></span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span className="text-[#5c9a38] font-bold font-mono">Giá bán: {vnd(product.retailPrice || 0)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-[#5c9a38] text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all shadow-lg">
                                                CHỌN BÁN
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <Search size={48} className="mx-auto text-gray-200 mb-4" />
                                    <div className="text-gray-500 font-medium">Không tìm thấy sản phẩm "{searchQuery}"</div>
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

            <AddCustomerModal
                isOpen={showAddCustomerModal}
                onClose={() => setShowAddCustomerModal(false)}
                onAdd={handleCustomerAdded}
            />

            {/* ── PRODUCTS TABLE ── */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50/30 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] sm:text-[12px] text-left border-collapse whitespace-nowrap lg:whitespace-normal">
                        <thead className="bg-[#5c9a38]/5 dark:bg-[#5c9a38]/10 text-[#5c9a38] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-700 sticky top-0 z-10">
                            <tr>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 w-16 sm:w-24">Mã SP</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 min-w-[150px] sm:min-w-[200px]">Tên sản phẩm</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 w-12 sm:w-20 text-center">ĐVT</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 w-20 text-center">Số lô</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 text-center w-32">Hạn dùng</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-16 sm:w-24">Số lượng</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-24 sm:w-32 bg-gray-50/50 dark:bg-neutral-800/50 hidden lg:table-cell">Giá nhập</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-24 sm:w-32 bg-green-50/30 dark:bg-green-900/10">Giá bán</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-24 sm:w-32 font-bold">Thành tiền</th>
                                <th className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-24 sm:w-32 font-bold text-blue-600 dark:text-blue-400 hidden xl:table-cell">Lợi nhuận</th>
                                <th className="px-2 py-3 sm:py-4 text-center w-10 sm:w-12">#</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-12 sm:py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                                            <p className="text-sm sm:text-base font-medium text-gray-500">Tìm & Chọn sản phẩm để bắt đầu</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const profitPerItem = item.remainingAmount - (item.quantity * item.importPrice)
                                    return (
                                        <tr key={item.id} className="hover:bg-green-50/20 dark:hover:bg-green-900/5 transition-colors group">
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800 font-mono text-gray-400 dark:text-gray-500 text-[10px] group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{item.code}</td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <div className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm">{item.name}</div>
                                            </td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800 text-gray-600 dark:text-gray-300 text-xs sm:text-sm text-center">{item.unit}</td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-neutral-600 px-1 py-1 rounded text-center outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#5c9a38] text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 transition-all"
                                                    value={item.batchNumber || ""}
                                                    onChange={(e) => updateItemField(item.id!, 'batchNumber', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-neutral-600 px-1 py-1 rounded text-center outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#5c9a38] text-[10px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 transition-all"
                                                    placeholder="DD/MM/YYYY"
                                                    value={item.expiryDate || ""}
                                                    onChange={(e) => updateItemField(item.id!, 'expiryDate', formatDateInput(e.target.value))}
                                                />
                                            </td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <NumericInput
                                                    className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-1 py-1 rounded text-right outline-none focus:ring-2 focus:ring-[#5c9a38]/20 focus:border-[#5c9a38] font-black text-blue-600 dark:text-blue-400 text-xs sm:text-sm transition-all"
                                                    value={Number(item.quantity)}
                                                    onChange={(v) => updateItemField(item.id!, 'quantity', v)}
                                                    onBlur={() => handleQuantityBlur(item.code)}
                                                />
                                            </td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800 text-right text-gray-400 font-medium italic bg-gray-50/30 dark:bg-neutral-800/20 hidden lg:table-cell">
                                                {vnd(item.importPrice)}
                                            </td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800 bg-green-50/10 dark:bg-green-900/5">
                                                <NumericInput
                                                    className="w-full bg-transparent border border-transparent hover:border-green-300 dark:hover:border-green-600/50 px-1 py-1 rounded text-right outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#5c9a38] font-black text-[#5c9a38] text-xs sm:text-sm transition-all"
                                                    value={Number(item.retailPrice)}
                                                    onChange={(v) => updateItemField(item.id!, 'retailPrice', v)}
                                                />
                                            </td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800 text-right font-black text-gray-700 dark:text-gray-200 text-xs sm:text-sm">
                                                {vnd(item.totalAmount)}
                                            </td>
                                            <td className="px-2 sm:px-3 py-3 sm:py-4 border-r border-gray-100 dark:border-neutral-800 text-right font-black text-blue-600 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-900/5 hidden xl:table-cell">
                                                {vnd(profitPerItem)}
                                            </td>
                                            <td className="px-2 py-3 sm:py-4 text-center">
                                                <button
                                                    onClick={() => removeItem(item.id!)}
                                                    className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                                    title="Xóa sản phẩm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── FOOTER TOTALS ── */}
            <div className="flex-none p-4 sm:p-6 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch lg:items-start max-w-7xl mx-auto">
                    <div className="flex-1 flex flex-col gap-3">
                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none">Ghi chú phiếu bán</label>
                        <textarea
                            placeholder="Nhập ghi chú thêm cho đơn hàng này..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-4 py-3 rounded-2xl text-sm text-gray-900 dark:text-gray-100 min-h-[80px] sm:min-h-[100px] outline-none focus:ring-2 focus:ring-[#5c9a38]/20 focus:border-[#5c9a38] transition-all resize-none shadow-inner"
                        />
                    </div>

                    <div className="w-full lg:w-[400px] xl:w-[500px] bg-gray-50 dark:bg-neutral-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-xl relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#5c9a38]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="space-y-3 sm:space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest">Tổng tiền hàng</span>
                                <span className="text-base sm:text-lg font-black text-gray-800 dark:text-gray-100">{vnd(totalAmount)} <span className="text-xs font-normal">đ</span></span>
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-neutral-700 to-transparent my-2 sm:my-4"></div>
                            <div className="flex justify-between items-center group">
                                <span className="text-gray-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest group-hover:text-blue-500 transition-colors">Lợi nhuận dự kiến</span>
                                <span className="text-sm sm:text-base font-bold text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">+{vnd(totalProfit)}</span>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Khách thanh toán</span>
                                <div className="flex flex-col items-end">
                                    <div className="text-2xl sm:text-4xl font-black text-[#65a34e] leading-none drop-shadow-md">
                                        {vnd(amountToPay)}
                                    </div>
                                    <span className="text-[10px] font-bold text-[#65a34e]/70 mt-1 uppercase tracking-widest">Việt Nam Đồng</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
