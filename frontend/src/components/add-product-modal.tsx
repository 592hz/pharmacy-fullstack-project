import { useState, useCallback, useEffect } from "react"
import { PlusCircle, X } from "lucide-react"
import { toast } from "sonner"
import { parseFloatSafe } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { type Product, type Unit, productSchema } from "@/lib/schemas"
import { getErrorMessage } from "@/lib/utils"
import { supplierService } from "@/services/supplier.service"
import { productCategoryService } from "@/services/product-category.service"
import { productService } from "@/services/product.service"
import { unitService } from "@/services/unit.service"
import type { IProduct } from "@/types/product"
import type { ISupplier } from "@/types/supplier"
import type { IProductCategory } from "@/types/category"

// dữ liệu được lấy từ database 
export interface ProductUnit {
    id: string
    unitName: string
    conversionRate: number
    importPrice: number
    retailPrice: number
    wholesalePrice: number
    isDefault: boolean
}

export interface Batch {
    batchNumber: string
    expiryDate: string
    quantity: number
}

export interface ProductFormData {
    // 1. Identification
    // 1. Mã sản phẩm
    productCode: string
    // 2. Tên sản phẩm
    productName: string
    // 5. Nhóm sản phẩm
    categoryId: string

    // 3. Organization
    // 4. Nhà cung cấp
    supplierId: string

    // 4. Financial & Stock
    // 4. Thuế VAT (%)
    vatPercent: number
    // 5. Chiết khấu (%)
    discountPercent: number

    // 6. Sub-table
    // 1. Đơn vị tính   
    units: ProductUnit[]

    // 7. Inventory
    initialQuantity: number
    baseUnitName: string
    batchNumber: string
    expiryDate: string
    batches: Batch[]
}

export interface AddProductModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (savedProduct: Product, formData: ProductFormData) => void
    initialData?: Product | null
}

interface InputFieldProps {
    label: string
    required?: boolean
    value: string | number
    onChange: (v: string | number) => void
    placeholder?: string
    type?: string
    disabled?: boolean
}

// Helper component for standard input with label
const InputField = ({ label, required, value, onChange, placeholder = "", type = "text", disabled = false }: InputFieldProps) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === 'number' ? (
                <NumericInput
                    value={Number(value)}
                    onChange={(v) => onChange(v)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] ${disabled ? 'bg-gray-100 dark:bg-neutral-800 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100'}`}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] ${disabled ? 'bg-gray-100 dark:bg-neutral-800 cursor-not-allowed text-gray-500' : 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100'}`}
                />
            )}
        </div>
    )
}

interface PopulatedEntity {
    _id?: string;
    id?: string;
}

const generateInitialFormData = (data?: Product | null): ProductFormData => {
    if (data) {
        const firstBatch = data.batches?.[0]
        return {
            productName: data.name || "",
            supplierId: typeof data.supplierId === 'object' 
                ? ((data.supplierId as unknown as PopulatedEntity)._id || (data.supplierId as unknown as PopulatedEntity).id || "") 
                : (data.supplierId || data.manufacturer || ""),
            categoryId: typeof data.categoryId === 'object' 
                ? ((data.categoryId as unknown as PopulatedEntity)._id || (data.categoryId as unknown as PopulatedEntity).id || "") 
                : (data.categoryId || ""),
            productCode: data.id || "",
            vatPercent: 0,
            discountPercent: 0,
            units: [{
                id: "1",
                unitName: data.unit || "",
                isDefault: true,
                conversionRate: data.conversionRate || 1,
                importPrice: data.importPrice || 0,
                retailPrice: data.retailPrice || 0,
                wholesalePrice: data.wholesalePrice || 0,
            }],
            initialQuantity: firstBatch ? firstBatch.quantity / (data.conversionRate || 1) : (data.baseQuantity || 0) / (data.conversionRate || 1),
            baseUnitName: data.baseUnitName || "Viên",
            batchNumber: firstBatch?.batchNumber || "",
            expiryDate: firstBatch?.expiryDate || data.expiryDate || "",
            batches: data.batches || []
        }
    }

    const newId = "SP" + Math.floor(100000 + Math.random() * 900000).toString()
    return {
        productName: "",
        supplierId: "",
        categoryId: "",
        productCode: newId,
        vatPercent: 0,
        discountPercent: 0,
        units: [{
            id: "1",
            unitName: "Viên",
            isDefault: true,
            conversionRate: 1,
            importPrice: 0,
            retailPrice: 0,
            wholesalePrice: 0,
        }],
        initialQuantity: 0,
        baseUnitName: "Viên",
        batchNumber: "",
        expiryDate: "",
        batches: []
    }
}

export function AddProductModal({ isOpen, onClose, onSuccess, initialData }: AddProductModalProps) {
    const [formData, setFormData] = useState<ProductFormData>(() => generateInitialFormData(initialData))

    const [categories, setCategories] = useState<IProductCategory[]>([])
    const [suppliers, setSuppliers] = useState<ISupplier[]>([])
    const [availableUnits, setAvailableUnits] = useState<Unit[]>([])

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [cats, sups, unts] = await Promise.all([
                        productCategoryService.getAll(),
                        supplierService.getAll(),
                        unitService.getAll()
                    ])
                    setCategories(cats)
                    setSuppliers(sups as ISupplier[])
                    setAvailableUnits(unts)
                } catch {
                    console.error("Error fetching data")
                    toast.error("Không thể tải dữ liệu danh mục/nhà cung cấp")
                }
            }
            fetchData()
        }
    }, [isOpen])

    // Helper to update basic string/number/boolean fields
    // Các hàm hỗ trợ sử lý dữ liệu
    const handleInputChange = useCallback((field: keyof ProductFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }, [])

    // Helper for table unit changes
    // Các hàm hỗ trợ sử lý dữ liệu
    const handleUnitChange = (id: string, field: keyof ProductUnit, value: string | number | boolean) => {
        setFormData(prev => ({
            ...prev,
            units: prev.units.map(u => {
                if (u.id === id) {
                    // if setting default, uncheck others
                    // Nếu đặt làm đơn vị mặc định, bỏ chọn các đơn vị khác
                    if (field === 'isDefault' && value === true) {
                        // handled separately below
                        // xử lý riêng bên dưới
                    }

                    const updatedUnit = { ...u, [field]: (field === 'importPrice' || field === 'retailPrice' || field === 'wholesalePrice' || field === 'conversionRate') ? parseFloatSafe(value) : value }

                    // If this is the default unit and its name is changing, sync with baseUnitName
                    if (u.isDefault && field === 'unitName') {
                        setFormData(prev => ({ ...prev, baseUnitName: value as string }))
                    }

                    return updatedUnit
                }
                return u
            })
        }))
    }

    const setUnitDefault = (id: string) => {
        setFormData(prev => ({
            ...prev,
            units: prev.units.map(u => ({
                ...u,
                isDefault: u.id === id
            }))
        }))
    }

    const addUnitRow = () => {
        setFormData(prev => ({
            ...prev,
            units: [
                ...prev.units,
                {
                    id: Date.now().toString(),
                    unitName: "",
                    conversionRate: 1,
                    importPrice: 0,
                    retailPrice: 0,
                    wholesalePrice: 0,
                    isDefault: false
                }
            ]
        }))
    }

    const removeUnitRow = (id: string) => {
        if (formData.units.length <= 1) return // Keep at least one
        // Giữ lại ít nhất một đơn vị
        setFormData(prev => ({
            ...prev,
            units: prev.units.filter(u => u.id !== id)
        }))
    }

    const handleBatchExpiryChange = (batchNumber: string, newExpiry: string) => {
        setFormData(prev => ({
            ...prev,
            batches: prev.batches.map(b =>
                b.batchNumber === batchNumber ? { ...b, expiryDate: newExpiry } : b
            )
        }))
    }

    const handleBatchQuantityChange = (batchNumber: string, newQty: number) => {
        const conversionRate = initialData?.conversionRate || 1
        setFormData(prev => ({
            ...prev,
            batches: prev.batches.map(b =>
                b.batchNumber === batchNumber ? { ...b, quantity: newQty * conversionRate } : b
            )
        }))
    }

    const handleSubmit = async (action: 'save' | 'save_new') => {
        const validation = productSchema.safeParse(formData)

        if (!validation.success) {
            const firstError = validation.error.issues[0]
            toast.error(firstError.message)
            return
        }

        try {
            const firstUnit = formData.units[0]
            const conversionRate = firstUnit?.conversionRate || 1

            const productData: Omit<Product, "id"> & { id?: string } = {
                id: formData.productCode,
                name: formData.productName,
                productCode: formData.productCode, // Add required field
                productName: formData.productName, // Add required field
                unit: firstUnit?.unitName || "",
                importPrice: Number(firstUnit?.importPrice) || 0,
                retailPrice: Number(firstUnit?.retailPrice) || 0,
                wholesalePrice: Number(firstUnit?.wholesalePrice) || 0,
                registrationNo: initialData?.registrationNo || ".",
                isDQG: initialData?.isDQG || false,
                manufacturer: initialData?.manufacturer || ".",
                categoryId: formData.categoryId,
                supplierId: formData.supplierId && formData.supplierId.trim() !== "" ? formData.supplierId : undefined,
                baseQuantity: initialData && formData.batches.length > 0
                    ? formData.batches.reduce((sum, b) => sum + b.quantity, 0)
                    : Number(formData.initialQuantity) * conversionRate,
                baseUnitName: formData.baseUnitName || "",
                conversionRate: conversionRate,
                vatPercent: formData.vatPercent,
                discountPercent: formData.discountPercent,
                initialQuantity: formData.initialQuantity,
                units: formData.units.map(u => ({
                    id: u.id,
                    unitName: u.unitName,
                    conversionRate: u.conversionRate,
                    importPrice: u.importPrice,
                    retailPrice: u.retailPrice,
                    wholesalePrice: u.wholesalePrice,
                    isDefault: u.isDefault
                })),
                batches: initialData && formData.batches.length > 0
                    ? formData.batches
                    : [
                        {
                            batchNumber: formData.batchNumber || (initialData ? "MỚI" : "LÔ ĐẦU"),
                            expiryDate: (formData.expiryDate && formData.expiryDate !== ".") ? formData.expiryDate : "2099-01-01",
                            quantity: Number(formData.initialQuantity) * conversionRate
                        }
                    ]
            }

            let savedProduct: IProduct
            if (initialData) {
                savedProduct = await productService.update(initialData.id, productData as unknown as IProduct)
                toast.success("Cập nhật sản phẩm thành công!")
            } else {
                savedProduct = await productService.create(productData as unknown as IProduct)
                toast.success("Thêm mới sản phẩm thành công!")
            }

            if (action === 'save') {
                onSuccess(savedProduct as unknown as Product, formData)
                onClose()
            } else if (action === 'save_new') {
                onSuccess(savedProduct as unknown as Product, formData)
                // Use the helper to generate a completely fresh state with a new ID
                setFormData(generateInitialFormData())
            }
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 md:p-8">
            <div className="bg-white dark:bg-neutral-900 w-full h-full max-w-[1400px] flex flex-col rounded shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                {/* HEADERS & TABS */}
                <div className="flex flex-col border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 pt-2">
                    <div className="flex items-center justify-between px-3 sm:px-4 pb-2">
                        <h2 className="text-base sm:text-xl font-bold text-gray-800 dark:text-gray-100">{initialData ? "Cập nhật thông tin hàng hóa" : "Thêm mới hàng hóa"}</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                    <div className="flex px-3 sm:px-4 gap-1">
                        <button
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold rounded-t-lg transition-colors bg-[#5c9a38] text-white"
                        >
                            Thông tin sản phẩm
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT BODY */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 p-3 sm:p-4">
                    <div className="flex flex-col gap-4 sm:gap-6 w-full mx-auto">

                        {/* --- GRID FORM --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 sm:gap-y-4">
                            {/* Row 1 */}
                            <InputField label="Tên hàng hóa" required value={formData.productName} onChange={(v) => handleInputChange('productName', v)} />

                            {/* Custom Searchable Select for Supplier */}
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">Nhà cung cấp</label>
                                <select
                                    className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 h-[34px]"
                                    value={formData.supplierId}
                                    onChange={(e) => handleInputChange('supplierId', e.target.value)}
                                >
                                    <option value="">Chọn nhà cung cấp...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 2 */}
                            {/* Custom Searchable Select for Category */}
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">Nhóm hàng hóa <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border border-blue-500 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 h-[34px]"
                                    value={formData.categoryId}
                                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                >
                                    <option value="">Chọn nhóm...</option>
                                    {categories.map(c => (
                                        <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">%VAT</label>
                                    <NumericInput
                                        className="h-[34px] text-xs sm:text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700"
                                        value={formData.vatPercent}
                                        onChange={(v) => handleInputChange('vatPercent', v)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">%CK</label>
                                    <NumericInput
                                        className="h-[34px] text-xs sm:text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700"
                                        value={formData.discountPercent}
                                        onChange={(v) => handleInputChange('discountPercent', v)}
                                    />
                                </div>
                            </div>

                            {/* Row 3 */}
                            <InputField label="Mã hàng hóa" disabled value={formData.productCode} onChange={(v) => handleInputChange('productCode', v)} placeholder="SP000294" />

                            {/* Inventory Section */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">Tồn kho hiện tại</label>
                                    <NumericInput
                                        className="h-[34px] text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                                        value={formData.initialQuantity}
                                        onChange={(v) => handleInputChange('initialQuantity', v)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">Đơn vị cơ bản</label>
                                    <input
                                        type="text"
                                        value={formData.baseUnitName}
                                        onChange={(e) => handleInputChange('baseUnitName', e.target.value)}
                                        className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                                        placeholder="Viên, Chai..."
                                    />
                                </div>
                            </div>

                            {/* Batch & Expiry Section */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">Số lô {initialData && "(Lô mới)"}</label>
                                    <input
                                        type="text"
                                        value={formData.batchNumber}
                                        onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                                        className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 font-mono"
                                        placeholder="Nhập số lô..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">Hạn dùng (DD-MM-YYYY)</label>
                                    <input
                                        type="text"
                                        value={formData.expiryDate}
                                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                        className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 font-mono"
                                        placeholder="31-12-2025"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- BATCHES TABLE (Only for Edit Mode) --- */}
                        {initialData && formData.batches && formData.batches.length > 0 && (
                            <div className="mt-2 border-t border-gray-100 pt-4">
                                <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-3 sm:w-1.5 sm:h-4 bg-[#5c9a38] rounded-full"></span>
                                    Quản lý lô hàng hiện tại
                                </h3>
                                <div className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-x-auto bg-gray-50/30 dark:bg-neutral-800/20">
                                    <table className="w-full text-[10px] sm:text-xs text-left min-w-[500px]">
                                        <thead className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-3 sm:px-4 py-2 border-r border-gray-200 dark:border-neutral-700">Số lô</th>
                                                <th className="px-3 sm:px-4 py-2 border-r border-gray-200 dark:border-neutral-700 text-center">Hạn dùng</th>
                                                <th className="px-3 sm:px-4 py-2 text-right">Số lượng tồn</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                                            {formData.batches.map((batch, idx) => (
                                                <tr key={`${batch.batchNumber}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                                                    <td className="px-3 sm:px-4 py-2 border-r border-gray-200 dark:border-neutral-700 font-medium text-gray-700 dark:text-gray-300">
                                                        {batch.batchNumber}
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 border-r border-gray-200 dark:border-neutral-700">
                                                        <input
                                                            type="text"
                                                            value={batch.expiryDate || ""}
                                                            onChange={(e) => handleBatchExpiryChange(batch.batchNumber, e.target.value)}
                                                            className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 text-center focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 font-mono"
                                                            placeholder="DD-MM-YYYY"
                                                        />
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 text-right">
                                                        <NumericInput
                                                            value={batch.quantity / (initialData.conversionRate || 1)}
                                                            onChange={(v) => handleBatchQuantityChange(batch.batchNumber, v)}
                                                            className="w-[80px] sm:w-[100px] ml-auto text-right border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- UNIT ADD --- */}
                        <div className="flex items-center pt-2">
                            <button
                                onClick={addUnitRow}
                                className="bg-[#5c9a38] text-white px-4 sm:px-6 py-2 rounded text-xs sm:text-sm font-medium hover:bg-[#5c9a38]/90 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <PlusCircle className="w-4 h-4" /> Thêm đơn vị tính
                            </button>
                        </div>
                        {/* --- UNITS TABLE --- */}
                        <div className="mt-2 border-t border-gray-200 dark:border-neutral-800 pt-2 lg:pt-4">
                            <div className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-x-auto bg-white dark:bg-neutral-900 shadow-sm">
                                <table className="w-full text-[10px] sm:text-sm text-left min-w-[700px]">
                                    <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-neutral-700">
                                        <tr>
                                            <th className="px-3 sm:px-4 py-3">Tên đơn vị tính</th>
                                            <th className="px-1 sm:px-4 py-3 text-center">Tỉ lệ quy<br />đổi</th>
                                            <th className="px-1 sm:px-4 py-3 text-center">Giá nhập</th>
                                            <th className="px-1 sm:px-4 py-3 text-center">Giá bán lẻ</th>
                                            <th className="px-1 sm:px-4 py-3 text-center">Giá bán buôn</th>
                                            <th className="px-1 sm:px-4 py-3 text-center">Mặc định</th>
                                            <th className="w-8 sm:w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                        {formData.units.map((unit) => (
                                            <tr key={unit.id} className="hover:bg-gray-50/50">
                                                <td className="px-3 sm:px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={unit.unitName}
                                                        list={`unit-list-${unit.id}`}
                                                        onChange={(e) => handleUnitChange(unit.id, 'unitName', e.target.value)}
                                                        className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[32px] sm:h-[34px] bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                                                        placeholder="Vỉ, Hộp..."
                                                    />
                                                    <datalist id={`unit-list-${unit.id}`}>
                                                        {availableUnits.map(mu => (
                                                            <option key={mu.id} value={mu.name} />
                                                        ))}
                                                    </datalist>
                                                </td>
                                                <td className="px-1 sm:px-4 py-2">
                                                    <NumericInput
                                                        value={unit.conversionRate}
                                                        onChange={(v) => handleUnitChange(unit.id, 'conversionRate', v)}
                                                        className="w-[50px] sm:w-[80px] mx-auto text-center border-transparent hover:border-gray-200 focus:border-[#5c9a38] focus:bg-white bg-transparent rounded px-1 py-1 text-xs sm:text-sm outline-none block"
                                                    />
                                                </td>
                                                <td className="px-1 sm:px-4 py-2">
                                                    <NumericInput
                                                        value={unit.importPrice}
                                                        onChange={(v) => handleUnitChange(unit.id, 'importPrice', v)}
                                                        className="w-[80px] sm:w-[120px] mx-auto text-center border-transparent hover:border-gray-200 focus:border-[#5c9a38] focus:bg-white bg-transparent rounded px-1 py-1 text-xs sm:text-sm outline-none text-[#5c9a38] font-bold block"
                                                    />
                                                </td>
                                                <td className="px-1 sm:px-4 py-2">
                                                    <NumericInput
                                                        value={unit.retailPrice}
                                                        onChange={(v) => handleUnitChange(unit.id, 'retailPrice', v)}
                                                        className="w-[80px] sm:w-[120px] mx-auto text-center border-transparent hover:border-gray-200 dark:hover:border-neutral-700 focus:border-[#5c9a38] focus:bg-white dark:focus:bg-neutral-900 bg-transparent rounded px-1 py-1 text-xs sm:text-sm outline-none font-bold block text-gray-800 dark:text-gray-100"
                                                    />
                                                </td>
                                                <td className="px-1 sm:px-4 py-2">
                                                    <NumericInput
                                                        value={unit.wholesalePrice}
                                                        onChange={(v) => handleUnitChange(unit.id, 'wholesalePrice', v)}
                                                        className="w-[80px] sm:w-[120px] mx-auto text-center border-transparent hover:border-gray-200 focus:border-[#5c9a38] focus:bg-white bg-transparent rounded px-1 py-1 text-xs sm:text-sm outline-none font-medium text-gray-500 block"
                                                    />
                                                </td>
                                                <td className="px-1 sm:px-4 py-2 text-center">
                                                    <input
                                                        type="radio"
                                                        checked={unit.isDefault}
                                                        onChange={() => setUnitDefault(unit.id)}
                                                        className="w-4 h-4 text-[#5c9a38] border-gray-300 focus:ring-[#5c9a38] mx-auto block cursor-pointer accent-[#5c9a38]"
                                                    />
                                                </td>
                                                <td className="px-1 sm:px-2 py-2 text-center">
                                                    {formData.units.length > 1 && (
                                                        <button
                                                            onClick={() => removeUnitRow(unit.id)}
                                                            className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                                            title="Xóa dòng"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Empty space at bottom to ensure scroll reaches end smoothly */}
                        <div className="h-6 sm:h-4"></div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex flex-wrap items-center justify-end px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 gap-2">
                    <button
                        onClick={() => handleSubmit('save_new')}
                        className="bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-[#5c9a38] border border-[#5c9a38] px-3 sm:px-4 py-2 rounded text-[11px] sm:text-sm font-bold transition-all active:scale-95 flex-1 sm:flex-none"
                    >
                        ✓ Lưu & Thêm mới
                    </button>
                    <button
                        onClick={() => handleSubmit('save')}
                        className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 sm:px-8 py-2 rounded text-[11px] sm:text-sm font-black transition-all active:scale-95 shadow-lg shadow-green-500/10 flex-1 sm:flex-none"
                    >
                        ✓ LƯU HÀNG HÓA
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 px-3 sm:px-4 py-2 rounded text-[11px] sm:text-sm font-bold transition-all flex items-center justify-center gap-1 flex-1 sm:flex-none border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
                    >
                        <X className="w-4 h-4" /> Thoát
                    </button>
                </div>
            </div>
        </div>
    )
}
