import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import AddCategoryModal from "@/components/add-category-modal"
import { mockCategories, setMockCategories, type Category } from "@/lib/mock-data"

export default function IncomeExpenseCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>(mockCategories)
    const [searchQuery, setSearchQuery] = useState("")

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<any>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    useEffect(() => {
        setMockCategories(categories)
    }, [categories])

    const handleDeleteClick = (category: any) => {
        setCategoryToDelete(category)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = () => {
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2) {
            setCategories(categories.filter(c => c.id !== categoryToDelete.id))
            toast.success("Đã xóa nhóm thu chi thành công!")
            setCategoryToDelete(null)
            setDeleteConfirmCount(0)
        }
    }

    const cancelDelete = () => {
        setCategoryToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleAddCategory = (newCategory: any) => {
        setCategories([newCategory, ...categories])
        toast.success("Đã thêm nhóm thu chi mới thành công!")
        setIsAddModalOpen(false)
    }

    const handleEditCategory = (updatedCategory: any) => {
        setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c))
        toast.success("Cập nhật thông tin nhóm thu chi thành công!")
        setIsAddModalOpen(false)
        setEditingCategory(null)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="grid auto-rows-min gap-4 md:grid-cols-1">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-120px)]">
                    <div className="p-4 flex-1 flex flex-col relative z-10 w-full overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Danh sách nhóm thu chi</h2>

                        {/* Search and Action Bar */}
                        <div className="flex items-center gap-2 mb-4 bg-white dark:bg-neutral-800 p-3 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm">
                            <div className="relative flex-1 max-w-2xl">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-3 pr-4 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-900 dark:text-white"
                                />
                            </div>
                            <button className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                                Tìm kiếm
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1.5 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm ml-2"
                            >
                                <Plus size={16} /> Thêm mới
                            </button>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto bg-[#ffff] dark:bg-neutral-900/50 p-2">
                            <div className="bg-white dark:bg-neutral-900 rounded border border-gray-300 dark:border-neutral-700 overflow-hidden shadow">
                                <table className="w-full text-sm text-left whitespace-nowrap table-fixed">
                                    <thead className="bg-[#e6e6e6] dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-300 dark:border-neutral-700">
                                        <tr>
                                            <th className="px-4 py-3 border-r border-gray-300 dark:border-neutral-700 w-1/4">Tên nhóm</th>
                                            <th className="px-4 py-3 border-r border-gray-300 dark:border-neutral-700 w-[100px] text-center">Loại</th>
                                            <th className="px-4 py-3 border-r border-gray-300 dark:border-neutral-700 w-[150px] text-right">Số tiền</th>
                                            <th className="px-4 py-3 border-r border-gray-300 dark:border-neutral-700 flex-1">Ghi chú</th>
                                            <th className="px-4 py-3 text-center w-[120px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                        {categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-4 py-3 truncate text-gray-800 dark:text-gray-200 font-medium">
                                                    {category.name}
                                                </td>
                                                <td className="px-4 py-3 text-center border-l border-gray-200 dark:border-neutral-700">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.type === "Thu" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                        {category.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-200 border-l border-gray-200 dark:border-neutral-700">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(category.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate border-l border-gray-200 dark:border-neutral-700">
                                                    {category.notes}
                                                </td>
                                                <td className="px-4 py-3 text-center border-l flex justify-center gap-2 border-gray-200 dark:border-neutral-700">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategory(category)
                                                            setIsAddModalOpen(true)
                                                        }}
                                                        className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-3 py-1 rounded text-xs font-medium leading-tight shadow-sm"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(category)}
                                                        className="bg-[#d9433e] hover:bg-[#c23b37] text-white px-3 py-1 rounded text-xs font-medium leading-tight shadow-sm"
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination Bar */}
                        <div className="bg-[#ffff] dark:bg-neutral-900/50 p-2 flex items-center justify-center text-sm text-gray-700 dark:text-gray-300 gap-4 mt-auto border-t border-gray-200 dark:border-neutral-800">
                            <span>Tổng số bản ghi: {categories.length} - Tổng số trang: 1</span>
                            <div className="flex items-center gap-1">
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&laquo;</button>
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&lsaquo;</button>
                                <button className="px-3 py-1 bg-[#e6eaf5] dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full font-medium">1</button>
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&rsaquo;</button>
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&raquo;</button>
                                <div className="flex items-center ml-2">
                                    <input type="text" defaultValue="1" className="w-10 text-center border border-gray-300 dark:border-neutral-600 rounded px-1 py-1 mr-2 text-sm dark:bg-neutral-800" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <AddCategoryModal
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
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa nhóm thu chi
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {deleteConfirmCount === 1
                                ? `Bạn có chắc chắn muốn xóa nhóm thu chi "${categoryToDelete.name}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa nhóm thu chi "${categoryToDelete.name}"?`
                            }
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={cancelDelete}
                                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700 dark:hover:bg-neutral-700"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                {deleteConfirmCount === 1 ? 'Xóa bỏ' : 'Xác nhận xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
