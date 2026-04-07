import { useState, useEffect, useCallback } from "react"
import { Trash2, RotateCcw, Trash as TrashIcon, CheckSquare, Square, X } from "lucide-react"
import { toast } from "sonner"
import { productService } from "@/services/product.service"
import { productCategoryService } from "@/services/product-category.service"
import { supplierService } from "@/services/supplier.service"
import { purchaseOrderService } from "@/services/purchase-order.service"
import { getErrorMessage } from "@/lib/utils"
import type { IProduct } from "@/types/product"
import type { IProductCategory } from "@/types/category"
import type { ISupplier } from "@/types/supplier"
import type { IPurchaseOrder } from "@/types/purchase-order"

type TrashItemType = "categories" | "products" | "suppliers" | "orders"

interface TrashItem {
    id: string
    code: string
    name: string
    deletedAt?: string
    details?: string
}

export default function TrashPage() {
    const [activeTab, setActiveTab] = useState<TrashItemType>("categories")
    const [items, setItems] = useState<TrashItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [itemToPermanentDelete, setItemToPermanentDelete] = useState<{ id?: string, ids?: string[], name?: string, type: TrashItemType, mode: 'single' | 'bulk' | 'empty' } | null>(null)

    const fetchDeletedItems = useCallback(async () => {
        setIsLoading(true)
        setSelectedIds([])
        try {
            let data: TrashItem[] = []
            if (activeTab === "categories") {
                const res = await productCategoryService.getDeleted()
                data = res.map((c: IProductCategory) => ({
                    id: c.id || "",
                    code: c.code,
                    name: c.name,
                    deletedAt: c.deletedAt
                }))
            } else if (activeTab === "products") {
                const res = await productService.getDeleted()
                data = res.map((p: IProduct) => ({
                    id: p.id,
                    code: p.id,
                    name: p.name,
                    deletedAt: p.deletedAt,
                    details: p.categoryId && typeof p.categoryId === 'object' ? `Nhóm: ${p.categoryId.name}` : undefined
                }))
            } else if (activeTab === "suppliers") {
                const res = await supplierService.getDeleted()
                data = res.map((s: ISupplier) => ({
                    id: s.id || s._id || "",
                    code: s.code,
                    name: s.name,
                    deletedAt: s.deletedAt
                }))
            } else if (activeTab === "orders") {
                const res = await purchaseOrderService.getDeleted()
                data = res.map((o: IPurchaseOrder) => ({
                    id: o.id,
                    code: o.id,
                    name: `Phiếu nhập ${o.id} - ${o.supplierName}`,
                    deletedAt: o.deletedAt
                }))
            }
            setItems(data)
        } catch (error: unknown) {
            toast.error("Không thể tải danh sách thùng rác: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }, [activeTab])

    useEffect(() => {
        fetchDeletedItems()
    }, [fetchDeletedItems])

    const handleRestore = async (id: string, type: TrashItemType) => {
        try {
            if (type === "categories") {
                await productCategoryService.restore(id)
            } else if (type === "products") {
                await productService.restore(id)
            } else if (type === "suppliers") {
                await supplierService.restore(id)
            } else if (type === "orders") {
                await purchaseOrderService.restore(id)
            }
            toast.success("Đã khôi phục thành công!")
            setItems(prev => prev.filter(item => item.id !== id))
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
        } catch (error: unknown) {
            toast.error("Lỗi khi khôi phục: " + getErrorMessage(error))
        }
    }

    const handleBulkRestore = async () => {
        if (selectedIds.length === 0) return
        try {
            if (activeTab === "categories") {
                await productCategoryService.bulkRestore(selectedIds)
            } else if (activeTab === "products") {
                await productService.bulkRestore(selectedIds)
            } else if (activeTab === "suppliers") {
                await supplierService.bulkRestore(selectedIds)
            } else if (activeTab === "orders") {
                await purchaseOrderService.bulkRestore(selectedIds)
            }
            toast.success(`Đã khôi phục ${selectedIds.length} mục thành công!`)
            setItems(prev => prev.filter(item => !selectedIds.includes(item.id)))
            setSelectedIds([])
        } catch (error: unknown) {
            toast.error("Lỗi khi khôi phục hàng loạt: " + getErrorMessage(error))
        }
    }

    const confirmPermanentDelete = async () => {
        if (!itemToPermanentDelete) return
        try {
            const { id, ids, type, mode } = itemToPermanentDelete
            
            if (mode === 'single' && id) {
                if (type === "categories") await productCategoryService.permanentDelete(id)
                else if (type === "products") await productService.permanentDelete(id)
                else if (type === "suppliers") await supplierService.permanentDelete(id)
                else if (type === "orders") await purchaseOrderService.permanentDelete(id)
                setItems(prev => prev.filter(item => item.id !== id))
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
            } else if (mode === 'bulk' && ids) {
                if (type === "categories") await productCategoryService.bulkPermanentDelete(ids)
                else if (type === "products") await productService.bulkPermanentDelete(ids)
                else if (type === "suppliers") await supplierService.bulkPermanentDelete(ids)
                else if (type === "orders") await purchaseOrderService.bulkPermanentDelete(ids)
                setItems(prev => prev.filter(item => !ids.includes(item.id)))
                setSelectedIds([])
            } else if (mode === 'empty') {
                if (type === "categories") await productCategoryService.emptyTrash()
                else if (type === "products") await productService.emptyTrash()
                else if (type === "suppliers") await supplierService.emptyTrash()
                else if (type === "orders") await purchaseOrderService.emptyTrash()
                setItems([])
                setSelectedIds([])
            }

            toast.success("Đã xóa vĩnh viễn!")
            setItemToPermanentDelete(null)
        } catch (error: unknown) {
            toast.error("Lỗi khi xóa vĩnh viễn: " + getErrorMessage(error))
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(items.map(item => item.id))
        }
    }

    const toggleSelectItem = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id) 
                : [...prev, id]
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-[#f4f7f6] dark:bg-neutral-950 min-h-screen pb-24">
            <div className="rounded-xl border border-gray-100 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Trash2 className="text-[#ef4444]" size={28} />
                            <h1 className="text-[22px] font-bold text-[#1a3352] dark:text-gray-100">Thùng rác hệ thống</h1>
                        </div>
                        <button 
                            onClick={() => setItemToPermanentDelete({ type: activeTab, mode: 'empty' })}
                            disabled={items.length === 0}
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <TrashIcon size={16} /> Dọn sạch thùng rác
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-neutral-800 mb-6 overflow-x-auto">
                        {(["categories", "products", "suppliers", "orders"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab
                                        ? "border-[#5c9a38] text-[#5c9a38]"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab === "categories" ? "Nhóm sản phẩm" : 
                                 tab === "products" ? "Sản phẩm" : 
                                 tab === "suppliers" ? "Nhà cung cấp" : "Phiếu nhập hàng"}
                            </button>
                        ))}
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto border rounded-sm border-gray-100 dark:border-neutral-800">
                        <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal border-collapse">
                            <thead className="text-[11px] text-gray-600 uppercase bg-[#f8faf9] dark:bg-neutral-800/50 dark:text-gray-300 border-y border-gray-100 dark:border-neutral-800">
                                <tr className="divide-x divide-gray-100 dark:divide-neutral-800">
                                    <th className="px-4 py-3 w-[40px] text-center">
                                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#5c9a38] transition-colors">
                                            {items.length > 0 && selectedIds.length === items.length ? (
                                                <CheckSquare size={18} className="text-[#5c9a38]" />
                                            ) : (
                                                <Square size={18} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-bold w-[120px]">MÃ</th>
                                    <th className="px-4 py-3 font-bold">TÊN / THÔNG TIN</th>
                                    <th className="px-4 py-3 font-bold w-[180px]">NGÀY XÓA</th>
                                    <th className="px-4 py-3 font-bold w-[160px]">THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">Thùng rác trống</td>
                                    </tr>
                                ) : items.map((item) => (
                                    <tr 
                                        key={item.id} 
                                        className={`hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 text-[#4a5568] dark:text-gray-300 divide-x divide-gray-100 dark:divide-neutral-800 transition-colors ${selectedIds.includes(item.id) ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => toggleSelectItem(item.id)} className="text-gray-400 hover:text-[#5c9a38] transition-colors">
                                                {selectedIds.includes(item.id) ? (
                                                    <CheckSquare size={18} className="text-[#5c9a38]" />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-[#2d3748] dark:text-gray-200">{item.code || item.id}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-[#2d3748] dark:text-gray-200">{item.name}</div>
                                            {item.details && (
                                                <div className="text-[11px] text-gray-400 uppercase italic">{item.details}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(item.id, activeTab)}
                                                    className="flex items-center gap-1.5 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#2e7d32] px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                                                    title="Khôi phục"
                                                >
                                                    <RotateCcw size={14} /> Khôi phục
                                                </button>
                                                <button
                                                    onClick={() => setItemToPermanentDelete({ id: item.id, name: item.name, type: activeTab, mode: 'single' })}
                                                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <TrashIcon size={14} /> Xóa vv
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1a3352] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 pr-6 border-r border-white/20">
                        <span className="bg-[#5c9a38] text-white text-[12px] font-bold h-6 w-6 flex items-center justify-center rounded-full">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-medium">mục được chọn</span>
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            title="Hủy chọn"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleBulkRestore}
                            className="flex items-center gap-2 hover:text-[#c8e6c9] transition-colors text-sm font-bold"
                        >
                            <RotateCcw size={18} /> Khôi phục tất cả
                        </button>
                        <button 
                            onClick={() => setItemToPermanentDelete({ ids: selectedIds, type: activeTab, mode: 'bulk' })}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-bold"
                        >
                            <TrashIcon size={18} /> Xóa vĩnh viễn
                        </button>
                    </div>
                </div>
            )}

            {/* Permanent Delete Confirmation Modal */}
            {itemToPermanentDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                                <TrashIcon size={20} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1a3352] dark:text-white">
                                {itemToPermanentDelete.mode === 'empty' ? 'Dọn sạch thùng rác' : 'Xác nhận xóa vĩnh viễn'}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            {itemToPermanentDelete.mode === 'empty' 
                                ? "Bạn có chắc chắn muốn xóa toàn bộ mục trong tab hiện tại? " 
                                : itemToPermanentDelete.mode === 'bulk'
                                    ? `Bạn có chắc muốn xóa vĩnh viễn ${itemToPermanentDelete.ids?.length} mục đã chọn? `
                                    : `Bạn có chắc muốn xóa vĩnh viễn "${itemToPermanentDelete.name}"? `
                            }
                            Hành động này <span className="text-red-500 font-bold">không thể khôi phục</span>.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setItemToPermanentDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">Hủy</button>
                            <button onClick={confirmPermanentDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">Xóa vĩnh viễn</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
