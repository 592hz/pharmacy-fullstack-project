import { useState, useMemo } from "react"
import { Search, X, Plus, Trash2, Pill, Activity, ChevronRight, Check, AlertCircle } from "lucide-react"
import { type ExportOrderItem } from "@/lib/schemas"
import { type IProduct } from "@/types/product"
import { parseFloatSafe, sortBatchesFEFO } from "@/lib/utils"
import { NumericInput } from "./ui/numeric-input"
import { toast } from "sonner"
import { AddProductModal } from "./add-product-modal"

interface AddDoseModalProps {
    isOpen: boolean
    onClose: () => void
    allProducts: IProduct[]
    onAdd: (doseItem: ExportOrderItem, components: ExportOrderItem[]) => void
}

const PRESET_PRICES = [
    { label: "Liều nhẹ", value: 20000 },
    { label: "Liều thường", value: 25000 },
    { label: "Liều nặng", value: 30000 },
    { label: "Liều đặc biệt", value: 40000 },
]

export default function AddDoseModal({ isOpen, onClose, allProducts, onAdd }: AddDoseModalProps) {
    const [doseName, setDoseName] = useState("")
    const [selectedPrice, setSelectedPrice] = useState<number>(20000)
    const [customPrice, setCustomPrice] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")
    const [showAddProductModal, setShowAddProductModal] = useState(false)
    const [selectedComponents, setSelectedComponents] = useState<{
        product: IProduct;
        quantity: number;
    }[]>([])

    // Price handling
    const finalPrice = customPrice ? parseFloatSafe(customPrice) : selectedPrice

    // Search logic
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        return allProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
        ).slice(0, 10)
    }, [searchQuery, allProducts])

    const handleAddComponent = (product: IProduct) => {
        setSelectedComponents(prev => {
            const existing = prev.find(c => c.product.id === product.id)
            if (existing) {
                return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
            }
            return [...prev, { product, quantity: 1 }]
        })
        setSearchQuery("")
    }

    const removeComponent = (productId: string) => {
        setSelectedComponents(prev => prev.filter(c => c.product.id !== productId))
    }

    const updateComponentQty = (productId: string, qty: number) => {
        setSelectedComponents(prev => prev.map(c => c.product.id === productId ? { ...c, quantity: qty } : c))
    }

    // Calculations
    const totalImportPrice = selectedComponents.reduce((sum, c) => {
        return sum + (c.quantity * (c.product.importPrice || 0))
    }, 0)

    const profit = finalPrice - totalImportPrice

    const handleConfirm = () => {
        if (!doseName) {
            toast.error("Vui lòng nhập tên liều (ví dụ: Liều Cảm sốt)")
            return
        }
        if (selectedComponents.length === 0) {
            toast.error("Vui lòng chọn ít nhất một loại thuốc cho liều này")
            return
        }

        const doseId = `DOSE-${Date.now()}`
        
        // 1. Create the main Dose item (the one that carries the retail price)
        const mainDoseItem: ExportOrderItem = {
            id: doseId,
            code: "LIÊU", // Generic code or specific
            name: `Liều: ${doseName}`,
            unit: "Liều",
            batchNumber: "LÔ-LIÊU",
            expiryDate: "31/12/2099",
            quantity: 1,
            retailPrice: finalPrice,
            importPrice: 0, // We put the import price on the components for stock/profit calculation consistency
            totalAmount: finalPrice,
            discountPercent: 0,
            discountAmount: 0,
            remainingAmount: finalPrice,
            parentDoseId: doseId
        }

        // 2. Create component items (these carry the import price and reduce stock)
        const componentItems: ExportOrderItem[] = selectedComponents.flatMap(comp => {
            const product = comp.product
            const totalQty = comp.quantity
            const sortedBatches = sortBatchesFEFO(product.batches?.filter(b => b.quantity > 0) || [])
            
            const rows: ExportOrderItem[] = []
            let remaining = totalQty

            if (sortedBatches.length > 0) {
                for (const batch of sortedBatches) {
                    if (remaining <= 0) break
                    const qtyFromBatch = Math.min(batch.quantity, remaining)
                    rows.push({
                        id: `comp-${Date.now()}-${Math.random()}`,
                        code: product.id || "",
                        name: `[Trong liều] ${product.name}`,
                        unit: product.unit || "",
                        batchNumber: batch.batchNumber,
                        expiryDate: batch.expiryDate || "",
                        quantity: qtyFromBatch,
                        retailPrice: 0, // Components are bundled, price is 0
                        importPrice: product.importPrice || 0,
                        totalAmount: 0,
                        discountPercent: 0,
                        discountAmount: 0,
                        remainingAmount: 0,
                        parentDoseId: doseId
                    })
                    remaining -= qtyFromBatch
                }
            }

            // Fallback if no batches or remaining qty
            if (remaining > 0) {
                const defaultBatch = product.batches?.[0]
                rows.push({
                    id: `comp-${Date.now()}-${Math.random()}`,
                    code: product.id || "",
                    name: `[Trong liều] ${product.name}`,
                    unit: product.unit || "",
                    batchNumber: defaultBatch?.batchNumber || "CHƯA-LÔ",
                    expiryDate: defaultBatch?.expiryDate || "31/12/2029",
                    quantity: remaining,
                    retailPrice: 0,
                    importPrice: product.importPrice || 0,
                    totalAmount: 0,
                    discountPercent: 0,
                    discountAmount: 0,
                    remainingAmount: 0,
                    parentDoseId: doseId
                })
            }

            return rows
        })

        onAdd(mainDoseItem, componentItems)
        onClose()
        toast.success(`Đã thêm liều: ${doseName}`)
        
        // Reset state
        setDoseName("")
        setSelectedComponents([])
        setSearchQuery("")
    }

    const handleProductCreated = (newProduct: IProduct) => {
        // Add to selected components
        setSelectedComponents(prev => [
            ...prev,
            { product: newProduct, quantity: 1 }
        ])
        
        setShowAddProductModal(false)
        toast.success(`Đã thêm sản phẩm mới vào liều: ${newProduct.name}`)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-neutral-800 scale-in-center">
                
                {/* Header */}
                <div className="flex-none p-6 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-green-50/50 to-white dark:from-green-900/10 dark:to-neutral-900">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Thiết lập liều thuốc</h2>
                            <p className="text-sm text-gray-500 font-medium">Kết hợp nhiều loại thuốc thành một liều bán lẻ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Panel: Settings */}
                    <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-gray-100 dark:border-neutral-800 space-y-6">
                        
                        {/* Dose Name */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tên liều thuốc (ví dụ: Sốt xuất huyết, Cảm cúm...)</label>
                            <input 
                                type="text"
                                value={doseName}
                                onChange={(e) => setDoseName(e.target.value)}
                                placeholder="Nhập tên liều..."
                                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-4 py-3 rounded-2xl text-lg font-bold text-gray-800 dark:text-gray-100 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                            />
                        </div>

                        {/* Price Selection */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Chọn mức giá bán</label>
                            <div className="grid grid-cols-2 gap-2">
                                {PRESET_PRICES.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => {
                                            setSelectedPrice(p.value)
                                            setCustomPrice("")
                                        }}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                            selectedPrice === p.value && !customPrice 
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/10" 
                                            : "border-gray-100 dark:border-neutral-800 hover:border-green-200 dark:hover:border-green-900/40 bg-white dark:bg-neutral-900"
                                        }`}
                                    >
                                        <span className="text-xs font-bold text-gray-500 uppercase">{p.label}</span>
                                        <span className="text-lg font-black text-gray-800 dark:text-gray-100">{(p.value / 1000).toLocaleString()}k</span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative group">
                                <input 
                                    type="text"
                                    placeholder="Hoặc nhập giá tùy chỉnh..."
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-4 py-3 pl-12 rounded-2xl text-base font-bold text-gray-800 dark:text-gray-100 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">đ</div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 text-white space-y-4 shadow-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tổng giá nhập</span>
                                <span className="text-lg font-mono font-bold text-blue-400">{totalImportPrice.toLocaleString("vi-VN")} đ</span>
                            </div>
                            <div className="h-px bg-white/10"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Giá bán liều</span>
                                <span className="text-2xl font-black text-green-400">{finalPrice.toLocaleString("vi-VN")} đ</span>
                            </div>
                            <div className="pt-2">
                                <div className={`flex items-center gap-2 p-3 rounded-xl ${profit >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {profit >= 0 ? <Check size={18} /> : <AlertCircle size={18} />}
                                    <span className="text-sm font-bold">Lợi nhuận: {profit.toLocaleString("vi-VN")} đ ({((profit/finalPrice)*100 || 0).toFixed(1)}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Components */}
                    <div className="w-full lg:w-1/2 flex flex-col bg-gray-50/50 dark:bg-neutral-800/30">
                        {/* Search components */}
                        <div className="p-6 pb-0">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Thành phần thuốc trong liều</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text"
                                        placeholder="Tìm thuốc thêm vào liều..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 pl-12 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowAddProductModal(true)}
                                    className="p-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                                    title="Thêm sản phẩm mới"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {searchQuery && (
                                <div className="relative">
                                    <div className="absolute top-2 left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto p-2 animate-in slide-in-from-top-2">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleAddComponent(p)}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 text-left transition-colors group"
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-600">{p.name}</div>
                                                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                                            <span className={`${p.baseQuantity && p.baseQuantity > 0 ? "text-blue-500" : "text-red-500 font-bold"}`}>
                                                                Tồn: {p.baseQuantity || 0} {p.unit}
                                                                {(!p.baseQuantity || p.baseQuantity <= 0) && " (Hết/Mới)"}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="text-gray-400">Giá nhập: {p.importPrice?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <Plus size={16} className="text-gray-300 group-hover:text-green-500" />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-400 text-sm">Không tìm thấy sản phẩm</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected List */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            {selectedComponents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 opacity-50">
                                    <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-full">
                                        <Pill size={32} />
                                    </div>
                                    <p className="text-sm font-medium">Chưa có thuốc nào trong liều</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedComponents.map(comp => (
                                        <div key={comp.product.id} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex items-center justify-between group">
                                            <div className="flex-1 mr-4">
                                                <div className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight mb-1">{comp.product.name}</div>
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                                        <span>Cost: {comp.product.importPrice?.toLocaleString()} đ</span>
                                                        <ChevronRight size={10} />
                                                        <span className="text-blue-600 font-bold">Total: {(comp.quantity * (comp.product.importPrice || 0)).toLocaleString()} đ</span>
                                                    </div>
                                                    {(!comp.product.batches || comp.product.batches.length === 0) && (
                                                        <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Thiếu Lô/HSD</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <NumericInput
                                                    value={comp.quantity}
                                                    onChange={(v) => updateComponentQty(comp.product.id, v)}
                                                    className="w-16 h-10 bg-gray-50 dark:bg-neutral-800 border-none text-center font-black text-gray-800 dark:text-gray-100 rounded-xl"
                                                />
                                                <button 
                                                    onClick={() => removeComponent(comp.product.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none p-6 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300 font-bold transition-all"
                    >
                        HỦY BỎ
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="flex-[2] px-6 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        XÁC NHẬN THÊM LIỀU
                    </button>
                </div>
            </div>

            <AddProductModal
                isOpen={showAddProductModal}
                onClose={() => setShowAddProductModal(false)}
                onSuccess={handleProductCreated}
            />
        </div>
    )
}
