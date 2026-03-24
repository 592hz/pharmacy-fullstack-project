import { useState, useCallback } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { type Product } from "@/lib/mock-data"
import { parseFloatSafe } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"
import { productSchema } from "@/lib/schemas"
import { supplierService } from "@/services/supplier.service"
import { useEffect } from "react"
import { productCategoryService } from "@/services/product-category.service"
import { productService } from "@/services/product.service"
import { type Category as ProductCategory, type Supplier } from "@/lib/schemas"

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
}

const initialFormData: ProductFormData = {
    productCode: "",
    productName: "",
    categoryId: "",
    supplierId: "",
    vatPercent: 0,
    discountPercent: 0,
    // 6. Đơn vị tính   
    units: [
        // Default empty row
        // 1. Đơn vị tính
        {
            id: "1",
            unitName: "",
            conversionRate: 1,
            importPrice: 0,
            retailPrice: 0,
            wholesalePrice: 0,
            isDefault: true
        }
    ],
    initialQuantity: 0,
    baseUnitName: "Viên",
    batchNumber: "",
    expiryDate: "",
}

// 3. Đơn vị tính
const mockUnits = [
    { id: "u1", name: "Viên" },
    { id: "u2", name: "Vỉ" },
    { id: "u3", name: "Hộp" },
    { id: "u4", name: "Lọ" },
    { id: "u5", name: "Tuýp" },
    { id: "u6", name: "Gói" },
    { id: "u7", name: "Chai" },
    { id: "u8", name: "Ống" }
]

export interface AddProductModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (data: ProductFormData) => void
    initialData?: Product | null // To support editing
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
            <label className="text-xs font-semibold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === 'number' ? (
                <NumericInput
                    value={Number(value)}
                    onChange={(v) => onChange(v)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
            )}
        </div>
    )
}

export function AddProductModal({ isOpen, onClose, onSuccess, initialData }: AddProductModalProps) {
    const [categories, setCategories] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [cats, sups] = await Promise.all([
                        productCategoryService.getAll(),
                        supplierService.getAll()
                    ])
                    setCategories(cats)
                    setSuppliers(sups)
                } catch (error) {
                    console.error("Error fetching data:", error)
                    toast.error("Không thể tải dữ liệu danh mục/nhà cung cấp")
                }
            }
            fetchData()
        }
    }, [isOpen])

    const [formData, setFormData] = useState<ProductFormData>(() => {
        if (initialData) {
            const firstBatch = initialData.batches?.[0]
            // Mapping from Product (mock-data.ts) to ProductFormData
            return {
                productName: initialData.name || "",
                supplierId: initialData.supplierId || initialData.manufacturer || "",
                categoryId: initialData.categoryId || "",
                productCode: initialData.id || "",
                vatPercent: 10, // Default for mock data
                discountPercent: 0,
                units: [{
                    id: "1",
                    unitName: initialData.unit || "",
                    isDefault: true,
                    conversionRate: initialData.conversionRate || 1,
                    importPrice: initialData.importPrice || 0,
                    retailPrice: initialData.retailPrice || 0,
                    wholesalePrice: initialData.wholesalePrice || 0,
                }],
                initialQuantity: firstBatch ? firstBatch.quantity / (initialData.conversionRate || 1) : initialData.baseQuantity / (initialData.conversionRate || 1),
                baseUnitName: initialData.baseUnitName || "Viên",
                batchNumber: firstBatch?.batchNumber || "",
                expiryDate: firstBatch?.expiryDate || initialData.expiryDate || "",
            }
        }

        // New random ID for new products
        // State initializers are allowed to be "impure" as they only run once on mount
        const newId = "SP" + Math.floor(100000 + Math.random() * 900000).toString()
        return {
            productName: "",
            supplierId: "",
            categoryId: "",
            productCode: newId,
            vatPercent: 10,
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
        }
    })

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
    const handleSubmit = (action: 'save' | 'save_new') => {
        const validation = productSchema.safeParse(formData)

        if (!validation.success) {
            const firstError = validation.error.issues[0]
            toast.error(firstError.message)
            return
        }

        console.log("Saving exactly matching Database Schema:", formData)
        toast.success(initialData ? "Cập nhật sản phẩm thành công!" : "Thêm mới sản phẩm thành công!")

        if (action === 'save') {
            onSuccess(formData)
            onClose()
        } else if (action === 'save_new') {
            onSuccess(formData)
            setFormData(initialFormData) 
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 md:p-8">
            <div className="bg-white w-full h-full max-w-[1400px] flex flex-col rounded shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">

                {/* HEADERS & TABS */}
                <div className="flex flex-col border-b border-gray-200 bg-white pt-2">
                    <div className="flex items-center justify-between px-4 pb-2">
                        <h2 className="text-xl font-bold text-gray-800">{initialData ? "Cập nhật thông tin hàng hóa" : "Thêm mới hàng hóa"}</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex px-4 gap-1">
                        <button
                            className="px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors bg-[#5c9a38] text-white"
                        >
                            Thông tin sản phẩm
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT BODY */}
                <div className="flex-1 overflow-y-auto bg-white p-4">
                    <div className="flex flex-col gap-6 w-full mx-auto">

                        {/* --- GRID FORM --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Row 1 */}
                            <InputField label="Tên hàng hóa" required value={formData.productName} onChange={(v) => handleInputChange('productName', v)} />

                            {/* Custom Searchable Select for Supplier */}
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-xs font-semibold text-gray-700">Nhà cung cấp</label>
                                <select
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] bg-white h-[34px]"
                                    value={formData.supplierId}
                                    onChange={(e) => handleInputChange('supplierId', e.target.value)}
                                >
                                    <option value="">Chọn nhà cung cấp...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 2 */}
                            {/* Custom Searchable Select for Category */}
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-xs font-semibold text-gray-700">Nhóm hàng hóa <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border border-blue-500 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white h-[34px]"
                                    value={formData.categoryId}
                                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                >
                                    <option value="">Chọn nhóm...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">%VAT</label>
                                    <NumericInput
                                        value={formData.vatPercent}
                                        onChange={(v) => handleInputChange('vatPercent', v)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">%CK</label>
                                    <NumericInput
                                        value={formData.discountPercent}
                                        onChange={(v) => handleInputChange('discountPercent', v)}
                                    />
                                </div>
                            </div>

                            {/* Row 3 */}
                            <InputField label="Mã hàng hóa" disabled value={formData.productCode} onChange={(v) => handleInputChange('productCode', v)} placeholder="SP000294" />

                            {/* Inventory Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Số lượng tồn kho</label>
                                    <NumericInput
                                        value={formData.initialQuantity}
                                        onChange={(v) => handleInputChange('initialQuantity', v)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Đơn vị cơ bản (nhỏ nhất)</label>
                                    <input
                                        type="text"
                                        value={formData.baseUnitName}
                                        onChange={(e) => handleInputChange('baseUnitName', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] bg-white"
                                        placeholder="Ví dụ: Viên, Chai..."
                                    />
                                </div>
                            </div>

                            {/* Batch & Expiry Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Số lô</label>
                                    <input
                                        type="text"
                                        value={formData.batchNumber}
                                        onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] bg-white"
                                        placeholder="Nhập số lô..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700">Hạn dùng (DD-MM-YYYY)</label>
                                    <input
                                        type="text"
                                        value={formData.expiryDate}
                                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] bg-white"
                                        placeholder="Ví dụ: 31-12-2025"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- UNIT ADD --- */}
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
                            <button
                                onClick={addUnitRow}
                                className="bg-[#5c9a38] text-white px-6 py-2 rounded text-sm font-medium hover:bg-[#5c9a38]/90 transition-colors"
                            >
                                Thêm đơn vị tính
                            </button>
                        </div>
                        {/* --- UNITS TABLE --- */}
                        <div className="mt-2 border-t border-gray-200 pt-4">
                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-700 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3">Tên đơn vị tính</th>
                                            <th className="px-4 py-3 text-center">Tỉ lệ quy<br />đổi</th>
                                            <th className="px-4 py-3 text-center">Giá nhập</th>
                                            <th className="px-4 py-3 text-center">Giá bán lẻ</th>
                                            <th className="px-4 py-3 text-center">Giá bán buôn</th>
                                            <th className="px-4 py-3 text-center">Mặc định<br />bán</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {formData.units.map((unit) => (
                                            <tr key={unit.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={unit.unitName}
                                                        list={`unit-list-${unit.id}`}
                                                        onChange={(e) => handleUnitChange(unit.id, 'unitName', e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#5c9a38] focus:ring-1 focus:ring-[#5c9a38] h-[34px] bg-white"
                                                        placeholder="Chọn/Nhập đơn vị tính *"
                                                    />
                                                    <datalist id={`unit-list-${unit.id}`}>
                                                        {mockUnits.map(mu => (
                                                            <option key={mu.id} value={mu.name} />
                                                        ))}
                                                    </datalist>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <NumericInput
                                                        value={unit.conversionRate}
                                                        onChange={(v) => handleUnitChange(unit.id, 'conversionRate', v)}
                                                        className="w-[80px] mx-auto text-center border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white bg-transparent rounded px-2 py-1 text-sm outline-none block"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <NumericInput
                                                        value={unit.importPrice}
                                                        onChange={(v) => handleUnitChange(unit.id, 'importPrice', v)}
                                                        className="w-[120px] mx-auto text-center border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white bg-transparent rounded px-2 py-1 text-sm outline-none text-[#5c9a38] font-medium block"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <NumericInput
                                                        value={unit.retailPrice}
                                                        onChange={(v) => handleUnitChange(unit.id, 'retailPrice', v)}
                                                        className="w-[120px] mx-auto text-center border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white bg-transparent rounded px-2 py-1 text-sm outline-none font-semibold block"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <NumericInput
                                                        value={unit.wholesalePrice}
                                                        onChange={(v) => handleUnitChange(unit.id, 'wholesalePrice', v)}
                                                        className="w-[120px] mx-auto text-center border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white bg-transparent rounded px-2 py-1 text-sm outline-none font-semibold text-gray-600 block"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <input
                                                        type="radio"
                                                        checked={unit.isDefault}
                                                        onChange={() => setUnitDefault(unit.id)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mx-auto block cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    {formData.units.length > 1 && (
                                                        <button
                                                            onClick={() => removeUnitRow(unit.id)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                            title="Xóa dòng"
                                                        >
                                                            <X size={16} />
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
                        <div className="h-4"></div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200 bg-white gap-2">
                    <button
                        onClick={() => handleSubmit('save_new')}
                        className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded text-sm font-medium transition-colors border-l border-white/20"
                    >
                        ✓ Lưu và Thêm mới
                    </button>
                    <button
                        onClick={() => handleSubmit('save')}
                        className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded text-sm font-medium transition-colors border-l border-white/20"
                    >
                        ✓ Lưu và Đóng
                    </button>
                    <button
                        onClick={onClose}
                        className="text-[#000000] hover:bg-gray-200 px-4 py-2 rounded text-sm font-bold ml-2 transition-colors flex items-center gap-1"
                    >
                        <X size={16} className="text-[#000000]" /> Thoát
                    </button>
                </div>
            </div>
        </div>
    )
}
