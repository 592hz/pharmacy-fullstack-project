import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import AddProductCategoryModal from "@/components/add-product-category-modal"
import { type ProductCategory } from "@/lib/schemas"
import { productCategoryService } from "@/services/product-category.service"
import { getErrorMessage } from "@/lib/utils"

export default function ProductCategoriesPage() {
    const [categories, setCategories] = useState<ProductCategory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null)

    const fetchCategories = async () => {
        setIsLoading(true)
        try {
            const data = await productCategoryService.getAll()
            setCategories(data)
        } catch (error: unknown) {
            toast.error("Không thể tải danh sách nhóm sản phẩm: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleDeleteClick = (category: ProductCategory) => {
        setCategoryToDelete(category)
    }

    const confirmDelete = async () => {
        if (!categoryToDelete || !categoryToDelete.id) return
        try {
            await productCategoryService.delete(categoryToDelete.id)
            setCategories(categories.filter(c => c.id !== categoryToDelete.id))
            toast.success("Đã xóa nhóm hàng hóa thành công!")
            setCategoryToDelete(null)
        } catch (error: unknown) {
            toast.error(`Lỗi khi xóa: ${getErrorMessage(error)}`)
        }
    }

    const cancelDelete = () => {
        setCategoryToDelete(null)
    }

    const handleAddCategory = async (newCategory: ProductCategory) => {
        try {
            const data = await productCategoryService.create(newCategory)
            setCategories([data, ...categories])
            toast.success("Đã thêm nhóm hàng hóa mới thành công!")
            setIsAddModalOpen(false)
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const handleEditCategory = async (updatedCategory: ProductCategory) => {
        try {
            if (!updatedCategory.id) return
            const data = await productCategoryService.update(updatedCategory.id, updatedCategory)
            setCategories(categories.map(c => c.id === data.id ? data : c))
            toast.success("Cập nhật thông tin nhóm hàng hóa thành công!")
            setIsAddModalOpen(false)
            setEditingCategory(null)
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (cat.code && cat.code.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-[#f4f7f6] dark:bg-neutral-950 min-h-screen">
            <div className="rounded-xl border border-gray-100 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                    <h1 className="text-[22px] font-bold text-[#1a3352] dark:text-gray-100 mb-6">Danh sách nhóm sản phẩm</h1>

                    {/* Actions & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select className="w-full sm:w-[124px] rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50">
                                <option>Tất cả</option>
                            </select>
                            <div className="flex flex-1 sm:w-[320px]">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-l-md border border-gray-200 border-r-0 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50"
                                />
                                <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-6 py-2 rounded-r-md font-medium transition-colors text-sm whitespace-nowrap">
                                    Tìm kiếm
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm w-full sm:w-auto justify-center"
                        >
                            <Plus size={18} /> Thêm mới
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border rounded-sm border-gray-100 dark:border-neutral-800">
                        <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal border-collapse">
                            <thead className="text-[11px] text-gray-600 uppercase bg-[#f8faf9] dark:bg-neutral-800/50 dark:text-gray-300 border-y border-gray-100 dark:border-neutral-800">
                                <tr className="divide-x divide-gray-100 dark:divide-neutral-800">
                                    <th className="px-4 py-3 font-bold w-[180px]">MÃ NHÓM</th>
                                    <th className="px-4 py-3 font-bold w-[300px]">TÊN NHÓM</th>
                                    <th className="px-4 py-3 font-bold min-w-[300px]">GHI CHÚ</th>
                                    <th className="px-4 py-3 font-bold w-[140px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">
                                            {isLoading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
                                        </td>
                                    </tr>
                                ) : filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 text-[#4a5568] dark:text-gray-300 divide-x divide-gray-100 dark:divide-neutral-800">
                                        <td className="px-4 py-3 font-medium text-[#2d3748]">{cat.code}</td>
                                        <td className="px-4 py-3 text-[#2d3748] font-medium">{cat.name}</td>
                                        <td className="px-4 py-3 text-sm">{cat.notes}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5 focus-within:z-10">
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(cat)
                                                        setIsAddModalOpen(true)
                                                    }}
                                                    className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-3 py-1.5 rounded-sm text-[11px] font-bold transition-colors min-w-[50px]"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(cat)}
                                                    className="bg-[#ef4444] hover:bg-red-600 text-white px-3 py-1.5 rounded-sm text-[11px] font-bold transition-colors min-w-[50px]"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                        <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                            Tổng số bản ghi: {filteredCategories.length} - Tổng số trang: 1
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded-sm text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &laquo;
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-sm text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &lsaquo;
                            </button>
                            <button className="min-w-[32px] h-8 flex items-center justify-center rounded-md bg-[#e3f2fd] text-[#1976d2] font-bold text-sm px-2">
                                1
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-sm text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &rsaquo;
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-sm text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &raquo;
                            </button>
                            
                            <div className="relative ml-2">
                                <select className="appearance-none border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md text-[13px] text-[#1976d2] font-bold px-3 py-1 h-8 focus:outline-none pr-8">
                                    <option>1</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddProductCategoryModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingCategory(null)
                }}
                onAdd={handleAddCategory}
                onEdit={handleEditCategory}
                initialData={editingCategory}
            />

            {/* Delete Confirmation Modal */}
            {categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                                <span className="text-red-600 dark:text-red-400 text-lg font-bold">!</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#1a3352] dark:text-white">
                                Xác nhận xóa
                            </h3>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn xóa nhóm sản phẩm <span className="font-bold text-gray-800 dark:text-gray-200">"{categoryToDelete.name}"</span>? Thao tác này sẽ không thể khôi phục.
                        </p>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={cancelDelete}
                                className="rounded-md px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-md bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 shadow-sm transition-colors"
                            >
                                Xóa bỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
