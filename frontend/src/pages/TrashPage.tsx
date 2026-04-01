import { useState, useEffect } from "react"
import { Trash2, RotateCcw, Trash as TrashIcon } from "lucide-react"
import { toast } from "sonner"
import { productService } from "@/services/product.service"
import { productCategoryService } from "@/services/product-category.service"
import { getErrorMessage } from "@/lib/utils"

export default function TrashPage() {
    const [activeTab, setActiveTab] = useState<"categories" | "products">("categories")
    const [categories, setCategories] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [itemToPermanentDelete, setItemToPermanentDelete] = useState<{ id: string, name: string, type: "category" | "product" } | null>(null)

    const fetchDeletedItems = async () => {
        setIsLoading(true)
        try {
            if (activeTab === "categories") {
                const data = await productCategoryService.getDeleted()
                setCategories(data)
            } else {
                const data = await productService.getDeleted()
                setProducts(data)
            }
        } catch (error: unknown) {
            toast.error("Không thể tải danh sách thùng rác: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDeletedItems()
    }, [activeTab])

    const handleRestore = async (id: string, type: "category" | "product") => {
        try {
            if (type === "category") {
                await productCategoryService.restore(id)
                setCategories(prev => prev.filter(c => c.id !== id && (c as any)._id !== id))
                toast.success("Đã khôi phục nhóm sản phẩm và các sản phẩm liên quan!")
            } else {
                await productService.restore(id)
                setProducts(prev => prev.filter(p => p.id !== id))
                toast.success("Đã khôi phục sản phẩm!")
            }
        } catch (error: unknown) {
            toast.error("Lỗi khi khôi phục: " + getErrorMessage(error))
        }
    }

    const confirmPermanentDelete = async () => {
        if (!itemToPermanentDelete) return
        try {
            if (itemToPermanentDelete.type === "category") {
                await productCategoryService.permanentDelete(itemToPermanentDelete.id)
                setCategories(prev => prev.filter(c => c.id !== itemToPermanentDelete.id && (c as any)._id !== itemToPermanentDelete.id))
            } else {
                await productService.permanentDelete(itemToPermanentDelete.id)
                setProducts(prev => prev.filter(p => p.id !== itemToPermanentDelete.id))
            }
            toast.success("Đã xóa vĩnh viễn!")
            setItemToPermanentDelete(null)
        } catch (error: unknown) {
            toast.error("Lỗi khi xóa vĩnh viễn: " + getErrorMessage(error))
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-[#f4f7f6] dark:bg-neutral-950 min-h-screen">
            <div className="rounded-xl border border-gray-100 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-6">
                        <Trash2 className="text-[#ef4444]" size={28} />
                        <h1 className="text-[22px] font-bold text-[#1a3352] dark:text-gray-100">Thùng rác</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-neutral-800 mb-6">
                        <button
                            onClick={() => setActiveTab("categories")}
                            className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
                                activeTab === "categories" 
                                ? "border-[#5c9a38] text-[#5c9a38]" 
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Nhóm sản phẩm ({categories.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
                                activeTab === "products" 
                                ? "border-[#5c9a38] text-[#5c9a38]" 
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Sản phẩm ({products.length})
                        </button>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto border rounded-sm border-gray-100 dark:border-neutral-800">
                        <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal border-collapse">
                            <thead className="text-[11px] text-gray-600 uppercase bg-[#f8faf9] dark:bg-neutral-800/50 dark:text-gray-300 border-y border-gray-100 dark:border-neutral-800">
                                <tr className="divide-x divide-gray-100 dark:divide-neutral-800">
                                    <th className="px-4 py-3 font-bold w-[120px]">MÃ</th>
                                    <th className="px-4 py-3 font-bold">TÊN HÀNG HÓA / NHÓM</th>
                                    <th className="px-4 py-3 font-bold w-[180px]">NGÀY XÓA</th>
                                    <th className="px-4 py-3 font-bold w-[160px]">THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : (activeTab === "categories" ? categories : products).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">Thùng rác trống</td>
                                    </tr>
                                ) : (activeTab === "categories" ? categories : products).map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 text-[#4a5568] dark:text-gray-300 divide-x divide-gray-100 dark:divide-neutral-800">
                                        <td className="px-4 py-3 font-medium text-[#2d3748] dark:text-gray-200">{item.code || item.id}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-[#2d3748] dark:text-gray-200">{item.name}</div>
                                            {activeTab === "products" && item.categoryId?.name && (
                                                <div className="text-[11px] text-gray-400 uppercase italic">Nhóm: {item.categoryId.name}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : '---'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(item.id, activeTab === "categories" ? "category" : "product")}
                                                    className="flex items-center gap-1.5 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#2e7d32] px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                                                    title="Khôi phục"
                                                >
                                                    <RotateCcw size={14} /> Khôi phục
                                                </button>
                                                <button
                                                    onClick={() => setItemToPermanentDelete({ id: item.id, name: item.name, type: activeTab === "categories" ? "category" : "product" })}
                                                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <TrashIcon size={14} /> Xóa HV
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

            {/* Permanent Delete Confirmation Modal */}
            {itemToPermanentDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                                <TrashIcon size={20} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1a3352] dark:text-white">Xác nhận xóa vĩnh viễn</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Bạn có chắc muốn xóa vĩnh viễn <span className="font-bold text-gray-800 dark:text-gray-200">"{itemToPermanentDelete.name}"</span>? 
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
