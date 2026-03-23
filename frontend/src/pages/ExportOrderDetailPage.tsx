import { useState, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AlertCircle, Search, PlusCircle, Trash2, Save, X, Printer } from "lucide-react"
import { toast } from "sonner"
import { mockExportSlips, mockProducts, type ExportSlipItem, type Product } from "@/lib/mock-data"
import { AddProductModal, type ProductFormData } from "@/components/add-product-modal"
import { parseFloatSafe } from "@/lib/utils"
import { NumericInput } from "@/components/ui/numeric-input"

export default function ExportOrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // Find the slip
    const originalSlip = useMemo(() => mockExportSlips.find(s => s.id === id) || null, [id])

    const slip = originalSlip
    const [items, setItems] = useState<ExportSlipItem[]>(originalSlip?.items || [])
    const [showAddModal, setShowAddModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Reset items when order changes (e.g. navigation between orders)
    const [prevId, setPrevId] = useState(id)
    if (id !== prevId) {
        setPrevId(id)
        setItems(originalSlip?.items || [])
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

    const handleQuickAdd = useCallback((product: Product) => {
        const qty = 1
        const retailPrice = product.retailPrice || 0
        const importPrice = product.importPrice || 0
        const total = qty * retailPrice

        // Pick the earliest expiring batch if available
        const firstBatch = product.batches && product.batches.length > 0
            ? [...product.batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0]
            : null

        const newItem: ExportSlipItem = {
            id: `new-${Date.now()}-${Math.random()}`,
            code: product.id,
            name: product.name,
            unit: product.unit,
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

    const formattedExportDate = useMemo(() => {
        if (!slip) return ""
        try {
            return new Date(slip.exportDate).toLocaleString("vi-VN").replace(/,/g, "")
        } catch {
            return ""
        }
    }, [slip])

    const handleProductSaved = useCallback((formData: ProductFormData) => {
        const firstUnit = formData.units?.[0]
        const qty = 1
        const retailPrice = firstUnit?.retailPrice || 0
        const importPrice = firstUnit?.importPrice || 0
        const total = qty * retailPrice

        const newItem: ExportSlipItem = {
            id: `new-${Date.now()}-${Math.random()}`,
            code: formData.productCode || "",
            name: formData.productName,
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
        toast.success(`Đã thêm: ${newItem.name}`)
    }, [])

    const handleCancelEdit = () => {
        setItems(originalSlip?.items || [])
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

    const updateItemField = useCallback((id: string, field: keyof ExportSlipItem, value: string | number | boolean) => {
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

    const handleSaveOrder = () => {
        setIsEditing(false)
        toast.success("Đã lưu thay đổi phiếu xuất")
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
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
            {/* ── HEADER SECTION ── */}
            <div className="flex-none p-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                            {slip.isPrescription ? "Bệnh nhân / Khách hàng" : "Tên khách hàng"}
                        </label>
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
                                value={slip.customerName}
                                disabled
                                className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-800 dark:text-gray-300 outline-none"
                            />
                        </div>
                    </div>

                    {slip.isPrescription && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Bác sĩ chỉ định</label>
                            <input
                                type="text"
                                value={slip.doctorName || ""}
                                disabled
                                className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-800 dark:text-gray-300"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Số phiếu</label>
                        <input
                            type="text"
                            value={slip.id}
                            disabled
                            className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-800 dark:text-gray-300"
                        />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Ghi chú</label>
                        <input
                            type="text"
                            value={slip.notes || ""}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">HTTT</label>
                        <input
                            type="text"
                            value={slip.paymentMethod || "Tiền mặt"}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Trạng thái TT</label>
                        <span className={`px-2 py-1 rounded text-xs font-bold text-center border ${slip.paymentStatus === 'Đã thanh toán' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {slip.paymentStatus || "Chưa thanh toán"}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Ngày xuất</label>
                        <input
                            type="text"
                            value={formattedExportDate}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Người tạo</label>
                        <input
                            type="text"
                            value={slip.createdBy}
                            disabled
                            className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded text-sm text-gray-500"
                        />
                    </div>
                </div>

                {/* ── SEARCH BAR ── */}
                <div className="mt-4 relative group">
                    <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-1">
                        <div className="pl-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Gõ tên hoặc mã sản phẩm để thêm vào phiếu xuất..."
                            className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-1 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors mr-1"
                        >
                            <PlusCircle size={16} />
                            <span>Thêm mới</span>
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
            <div className="flex-1 overflow-auto">
                <table className="w-full text-[12px] text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-neutral-800 sticky top-0 z-10 border-b border-gray-300 dark:border-neutral-700">
                        <tr>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700 w-24">Mã SP</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700">Tên sản phẩm</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700">ĐVT</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700">Số lô</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700">Hạn dùng</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">Số lượng</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">Giá nhập</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">Giá bán</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700 text-right font-bold">Thành tiền</th>
                            <th className="px-3 py-2 border-r border-gray-300 dark:border-neutral-700 text-right font-bold text-blue-600">Lợi nhuận</th>
                            {isEditing && <th className="px-3 py-2 text-center w-10">Xóa</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="py-10 text-center text-gray-400">Chưa có sản phẩm nào.</td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">{item.code}</td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 font-medium">{item.name}</td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">{item.unit}</td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">
                                        {isEditing ? (
                                            <input type="text" className="w-full border rounded px-1" value={item.batchNumber} onChange={(e) => updateItemField(item.id, 'batchNumber', e.target.value)} />
                                        ) : item.batchNumber}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700">
                                        {isEditing ? (
                                            <input type="text" className="w-full border rounded px-1" value={item.expiryDate} onChange={(e) => updateItemField(item.id, 'expiryDate', e.target.value)} />
                                        ) : item.expiryDate}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right font-medium">
                                        {isEditing ? (
                                            <NumericInput className="w-16 border rounded px-1 text-right" value={Number(item.quantity)} onChange={(v) => updateItemField(item.id, 'quantity', v)} />
                                        ) : item.quantity}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right text-gray-500">
                                        {isEditing ? (
                                            <NumericInput className="w-24 border rounded px-1 text-right text-[11px]" value={Number(item.importPrice)} onChange={(v) => updateItemField(item.id, 'importPrice', v)} />
                                        ) : vnd(item.importPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right font-medium">
                                        {isEditing ? (
                                            <NumericInput className="w-24 border rounded px-1 text-right" value={Number(item.retailPrice)} onChange={(v) => updateItemField(item.id, 'retailPrice', v)} />
                                        ) : vnd(item.retailPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right font-bold">{vnd(item.remainingAmount)}</td>
                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-700 text-right font-bold text-blue-600">
                                        {vnd(item.remainingAmount - (item.quantity * item.importPrice))}
                                    </td>
                                    {isEditing && (
                                        <td className="px-3 py-2 text-center">
                                            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── FOOTER TOTALS ── */}
            <div className="flex-none p-4 border-t-2 border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/80">
                <div className="flex justify-end gap-10 text-sm font-semibold">
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 uppercase text-[10px]">Tổng giá nhập</span>
                        <span className="text-xl text-gray-700 dark:text-gray-300 font-bold">{vnd(totalImport)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[#5c9a38] uppercase text-[10px]">Tổng lợi nhuận</span>
                        <span className="text-xl text-[#5c9a38] font-bold">{vnd(totalProfit)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 uppercase text-[10px]">Tổng tiền bán</span>
                        <span className="text-2xl text-green-600 font-bold">{vnd(amountToPay)}</span>
                    </div>
                </div>

                <div className="mt-4 flex justify-between gap-2">
                    <button onClick={() => navigate("/export-manage")} className="flex items-center gap-1 border px-4 py-2 rounded text-sm hover:bg-gray-100 transition">
                        <AlertCircle size={16} /> Quay lại danh sách
                    </button>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                            <Printer size={16} /> In phiếu
                        </button>
                        <button onClick={handleSaveOrder} className="bg-[#5c9a38] text-white px-6 py-2 rounded text-sm font-bold hover:bg-[#4d822f]">
                            LƯU THAY ĐỔI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
