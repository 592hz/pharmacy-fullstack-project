import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, PlusCircle, Trash2, Save, X, Calendar, User, CreditCard, TrendingUp, Plus } from "lucide-react"
import { toast } from "sonner"
import { type ExportOrder, type ExportOrderItem, type Product, type Customer, exportOrderSchema } from "@/lib/schemas"
import { exportSlipService } from "@/services/export-slip.service"
import { productService } from "@/services/product.service"
import { customerService } from "@/services/customer.service"
import { paymentMethodService } from "@/services/payment-method.service"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"
import AddCustomerModal from "@/components/add-customer-modal"
import { parseFloatSafe, getErrorMessage } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { type PaymentMethod } from "@/lib/schemas"
import { useDebounce } from "@/hooks/use-debounce"

export default function CreateExportOrderPage() {
    const navigate = useNavigate()

    // Form state
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<ExportOrderItem[]>([])
    const [paymentMethod, setPaymentMethod] = useState("Tiền mặt")
    const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>([])
    const [isPrescription, setIsPrescription] = useState(false)
    const [doctorName, setDoctorName] = useState("")
    const [customerId, setCustomerId] = useState<string>("")
    const [customerName, setCustomerName] = useState("Khách lẻ")
    const [symptoms, setSymptoms] = useState("")

    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [allCustomers, setAllCustomers] = useState<Customer[]>([])
    const [isLoading, setIsLoading] = useState(true)

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

                // Set default payment method
                const defaultMethod = paymentMethodsData.find((m: PaymentMethod) => m.isDefault);
                if (defaultMethod) {
                    setPaymentMethod(defaultMethod.name);
                } else if (paymentMethodsData.length > 0) {
                    setPaymentMethod(paymentMethodsData[0].name);
                }
            } catch (error: unknown) {
                toast.error("Không thể tải dữ liệu: " + getErrorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    // Metadata
    const [orderId] = useState(() => `PX${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`)
    const exportDate = new Date().toISOString()

    const [showAddModal, setShowAddModal] = useState(false)
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)

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

    const handleQuickAdd = useCallback((product: Product) => {
        const qty = 1
        const retailPrice = product.retailPrice || 0
        const importPrice = product.importPrice || 0
        const total = qty * retailPrice

        // Try to pick the first available batch with stock
        const firstValidBatch = product.batches?.find(b => b.quantity > 0) || product.batches?.[0];

        const newItem: ExportOrderItem = {
            id: `new-${Date.now()}-${Math.random()}`,
            code: product.id || "",
            name: product.name || "",
            unit: product.unit || product.baseUnitName || "",
            batchNumber: firstValidBatch?.batchNumber || "",
            expiryDate: firstValidBatch?.expiryDate || "",
            quantity: qty,
            retailPrice: retailPrice,
            importPrice: importPrice,
            totalAmount: total,
            discountPercent: 0,
            discountAmount: 0,
            remainingAmount: total,
        }

        setItems(prev => [newItem, ...prev])
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

    const handleProductSaved = useCallback((savedProduct: Product, formData: ProductFormData) => {
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

    const handleCustomerAdded = useCallback((customer: Customer) => {
        setAllCustomers(prev => [customer, ...prev])
        setCustomerId(customer.id || "")
        setCustomerName(customer.name)
        toast.success(`Đã thêm và chọn khách hàng: ${customer.name}`)
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

    const handleSaveOrder = async () => {
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
            exportDate: new Date().toISOString(),
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
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <TrendingUp size={24} className="text-[#5c9a38]" />
                            Tạo phiếu bán hàng mới
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate("/export-manage")}
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

                <div className="grid grid-cols-12 gap-4 border p-4 rounded-xl bg-white dark:bg-neutral-800 shadow-sm items-center">
                    {/* Customer Info */}
                    <div className="col-span-3 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><User size={10} /> Khách hàng *</label>
                        <div className="flex gap-1">
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Tên khách hàng..."
                                className="flex-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-semibold"
                            />
                            <button
                                onClick={() => setShowAddCustomerModal(true)}
                                className="p-2 bg-green-50 dark:bg-green-900/20 text-[#5c9a38] rounded border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                title="Thêm khách hàng mới"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="col-span-1 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Số phiếu</label>
                        <input
                            type="text"
                            value={orderId}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 px-2 py-2 rounded text-[11px] text-gray-400 font-mono"
                        />
                    </div>

                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Calendar size={10} /> Ngày bán</label>
                        <input
                            type="text"
                            value={new Date(exportDate).toLocaleString("vi-VN").replace(/,/g, "")}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 px-2 py-2 rounded text-[11px] text-gray-400 font-mono"
                        />
                    </div>

                    <div className="col-span-1 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><CreditCard size={10} /> HTTT</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-2 py-2 rounded text-sm outline-none"
                        >
                            {allPaymentMethods.map(m => (
                                <option key={m.id || m.name} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Triệu chứng</label>
                        <input
                            type="text"
                            placeholder="Triệu chứng..."
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded text-sm outline-none font-bold text-red-600"
                        />
                    </div>

                    <div className="col-span-1 flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isPrescription}
                                onChange={(e) => setIsPrescription(e.target.checked)}
                                className="rounded w-4 h-4 accent-[#5c9a38]"
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-red-600 uppercase italic leading-none">Toa thuốc</span>
                                {isPrescription && (
                                    <input
                                        type="text"
                                        placeholder="Bác sĩ..."
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                        className="mt-1 bg-transparent border-b border-gray-300 dark:border-neutral-700 w-16 text-[10px] outline-none"
                                    />
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Total Amount Display - Prominent Box */}
                    <div className="col-span-2 flex justify-end">
                        <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-2xl border-2 border-green-100 dark:border-green-800/30 flex flex-col items-end shadow-sm">
                            <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest leading-none mb-1">Khách thanh toán</span>
                            <span className="text-xl font-black text-[#5c9a38] tabular-nums leading-none">
                                {vnd(amountToPay)} <span className="text-[10px] font-bold opacity-60">đ</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── SEARCH BAR ── */}
                <div className="mt-6 relative group">
                    <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-md focus-within:ring-4 focus-within:ring-[#5c9a38]/10 focus-within:border-[#5c9a38] transition-all p-1.5">
                        <div className="pl-4 text-gray-400 group-focus-within:text-[#5c9a38] transition-colors">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Gõ tên hoặc mã sản phẩm để bán..."
                            className="flex-1 bg-transparent border-none outline-none text-base py-2 px-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
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
                            className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-green-800/50"
                        >
                            <PlusCircle size={18} />
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
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">Giá bán: {vnd(product.retailPrice || 0)}</span>
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
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <table className="w-full text-[12px] text-left border-collapse whitespace-nowrap">
                        <thead className="bg-[#5c9a38]/5 dark:bg-[#5c9a38]/10 text-[#5c9a38] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-neutral-700 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 w-24">Mã SP</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 min-w-[200px]">Tên sản phẩm</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700">ĐVT</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700">Số lô</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 text-center">Hạn dùng</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-24">Số lượng</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-32 bg-gray-50/50 dark:bg-neutral-800/50">Giá nhập</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-32 bg-green-50/30 dark:bg-green-900/10">Giá bán</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-32 font-bold">Thành tiền</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-700 text-right w-32 font-bold text-blue-600 dark:text-blue-400">Lợi nhuận</th>
                                <th className="px-3 py-4 text-center w-12">#</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Search size={64} className="text-gray-400" />
                                            <p className="text-base font-medium text-gray-500">Tìm & Chọn sản phẩm để bắt đầu bán hàng</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const profitPerItem = item.remainingAmount - (item.quantity * item.importPrice)
                                    return (
                                        <tr key={item.id} className="hover:bg-green-50/20 dark:hover:bg-green-900/5 transition-colors group">
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800 font-mono text-gray-400 group-hover:text-gray-600 transition-colors">{item.code}</td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <div className="font-bold text-gray-800 dark:text-gray-100">{item.name}</div>
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800 text-gray-600">{item.unit}</td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-neutral-600 px-2 py-1.5 rounded text-center outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] font-semibold transition-all"
                                                    value={item.batchNumber || ""}
                                                    onChange={(e) => updateItemField(item.id!, 'batchNumber', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-neutral-600 px-2 py-1.5 rounded text-center outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] font-semibold transition-all"
                                                    value={item.expiryDate || ""}
                                                    onChange={(e) => updateItemField(item.id!, 'expiryDate', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800">
                                                <NumericInput
                                                    className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-1.5 rounded text-right outline-none focus:ring-2 focus:ring-[#5c9a38]/20 focus:border-[#5c9a38] font-black text-blue-600 dark:text-blue-400 transition-all"
                                                    value={Number(item.quantity)}
                                                    onChange={(v) => updateItemField(item.id!, 'quantity', v)}
                                                />
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800 text-right text-gray-400 font-medium italic bg-gray-50/30 dark:bg-neutral-800/20">
                                                {vnd(item.importPrice)}
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800 bg-green-50/10 dark:bg-green-900/5">
                                                <NumericInput
                                                    className="w-full bg-transparent border border-transparent hover:border-green-300 dark:hover:border-green-600/50 px-2 py-1.5 rounded text-right outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] font-black text-[#5c9a38] transition-all"
                                                    value={Number(item.retailPrice)}
                                                    onChange={(v) => updateItemField(item.id!, 'retailPrice', v)}
                                                />
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800 text-right font-black text-gray-700 dark:text-gray-200">
                                                {vnd(item.totalAmount)}
                                            </td>
                                            <td className="px-3 py-4 border-r border-gray-100 dark:border-neutral-800 text-right font-black text-blue-600 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-900/5">
                                                {vnd(profitPerItem)}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <button
                                                    onClick={() => removeItem(item.id!)}
                                                    className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                                    title="Xóa sản phẩm"
                                                >
                                                    <Trash2 size={16} />
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
            <div className="flex-none p-6 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl">
                <div className="flex gap-10 items-start max-w-7xl mx-auto">
                    <div className="flex-1 flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none">Ghi chú phiếu bán</label>
                        <textarea
                            placeholder="Nhập ghi chú thêm cho đơn hàng này..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-4 py-3 rounded-2xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-[#5c9a38]/20 focus:border-[#5c9a38] transition-all resize-none shadow-inner"
                        />
                    </div>

                    <div className="w-[500px] bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-xl relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#5c9a38]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Tổng tiền hàng</span>
                                <span className="text-lg font-black text-gray-800 dark:text-gray-100">{vnd(totalAmount)} <span className="text-xs font-normal">đ</span></span>
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-neutral-700 to-transparent my-4"></div>
                            <div className="flex justify-between items-center group">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest group-hover:text-blue-500 transition-colors">Lợi nhuận dự kiến</span>
                                <span className="text-base font-bold text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">+{vnd(totalProfit)}</span>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Khách thanh toán</span>
                                <div className="flex flex-col items-end">
                                    <div className="text-4xl font-black text-[#65a34e] leading-none drop-shadow-md">
                                        {vnd(amountToPay)}
                                    </div>
                                    <span className="text-xs font-bold text-[#65a34e]/70 mt-1 uppercase tracking-widest">Việt Nam Đồng</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
