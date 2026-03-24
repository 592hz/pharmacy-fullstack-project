import { useState, useEffect, useMemo } from "react"
import { Plus, ArrowLeft, ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import AddCategoryModal from "@/components/add-category-modal"
import { type Category } from "@/lib/schemas"
import { categoryService } from "@/services/category.service"

export default function IncomeExpenseCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    
    // View state
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    const fetchCategories = async () => {
        setIsLoading(true)
        try {
            const data = await categoryService.getAll()
            setCategories(data)
        } catch (error) {
            toast.error("Không thể tải danh sách thu chi")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    // Grouping logic for the year view
    const statsByMonth = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            income: 0,
            expense: 0,
            count: 0
        }))

        categories.forEach(c => {
            if (!c.date) return
            const date = new Date(c.date)
            if (date.getFullYear() === selectedYear) {
                const monthIdx = date.getMonth()
                if (c.type === 'Thu') {
                    months[monthIdx].income += c.amount
                } else {
                    months[monthIdx].expense += c.amount
                }
                months[monthIdx].count++
            }
        })

        return months
    }, [categories, selectedYear])

    // Filtered data for detail view
    const filteredCategories = useMemo(() => {
        if (viewMode === 'list') return []
        return categories.filter(c => {
            if (!c.date) return false
            const date = new Date(c.date)
            return date.getFullYear() === selectedYear && (date.getMonth() + 1) === selectedMonth
        }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    }, [categories, viewMode, selectedYear, selectedMonth])


    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = async () => {
        if (!categoryToDelete || !categoryToDelete.id) return
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2) {
            try {
                await categoryService.delete(categoryToDelete.id)
                setCategories(categories.filter(c => c.id !== categoryToDelete.id))
                toast.success("Đã xóa nhóm thu chi thành công!")
                setCategoryToDelete(null)
                setDeleteConfirmCount(0)
            } catch (error: any) {
                toast.error(`Lỗi: ${error.message}`)
            }
        }
    }

    const cancelDelete = () => {
        setCategoryToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleAddCategory = async (newCategory: Category) => {
        try {
            const data = await categoryService.create(newCategory)
            setCategories([data, ...categories])
            toast.success("Đã thêm mới thành công!")
            setIsAddModalOpen(false)
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`)
        }
    }

    const handleEditCategory = async (updatedCategory: Category) => {
        try {
            if (!updatedCategory.id) return
            const data = await categoryService.update(updatedCategory.id, updatedCategory)
            setCategories(categories.map(c => c.id === data.id ? data : c))
            toast.success("Cập nhật thành công!")
            setIsAddModalOpen(false)
            setEditingCategory(null)
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`)
        }
    }

    const vnd = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    const getMonthName = (m: number) => `Tháng ${m < 10 ? '0' + m : m}`

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="flex flex-col gap-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {viewMode === 'detail' && (
                            <button 
                                onClick={() => setViewMode('list')}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {viewMode === 'list' ? `Quản lý Thu Chi ${selectedYear}` : `${getMonthName(selectedMonth!)} / ${selectedYear}`}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {viewMode === 'list' ? "Chọn tháng để xem chi tiết các khoản thu chi" : "Danh sách các khoản thu chi trong tháng"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                         {viewMode === 'list' && (
                            <div className="flex items-center bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-1 mr-2 shadow-sm">
                                <button 
                                    onClick={() => setSelectedYear(prev => prev - 1)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="px-4 font-bold text-gray-700 dark:text-gray-200">{selectedYear}</span>
                                <button 
                                     onClick={() => setSelectedYear(prev => prev + 1)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-md"
                        >
                            <Plus size={16} /> Thêm mới
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="animate-spin text-[#5c9a38]" size={40} />
                    </div>
                )}

                {!isLoading && viewMode === 'list' ? (
                    /* ── MONTH GRID VIEW ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                        {statsByMonth.map((m) => (
                            <div 
                                key={m.month}
                                className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                                onClick={() => {
                                    setSelectedMonth(m.month)
                                    setViewMode('detail')
                                }}
                            >
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                                            {m.count} bản ghi
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Tháng {m.month < 10 ? '0' + m.month : m.month}</h3>
                                        <p className="text-xs text-gray-500">Sơ lược thu chi trong tháng</p>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                                                <TrendingUp size={14} /> Thu
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300">{m.income > 0 ? vnd(m.income) : "—"}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                                                <TrendingDown size={14} /> Chi
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300">{m.expense > 0 ? vnd(m.expense) : "—"}</span>
                                        </div>
                                    </div>

                                    <button className="mt-2 w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !isLoading && (
                    /* ── DETAIL TABLE VIEW ── */
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-0 overflow-auto">
                             <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-neutral-700">
                                    <tr>
                                        <th className="px-6 py-4 w-32">Ngày</th>
                                        <th className="px-6 py-4">Tên nhóm / Diễn giải</th>
                                        <th className="px-6 py-4 w-32 text-center">Loại</th>
                                        <th className="px-6 py-4 w-40 text-right">Số tiền</th>
                                        <th className="px-6 py-4">Ghi chú</th>
                                        <th className="px-6 py-4 w-28 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                    {filteredCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                                                Không có dữ liệu thu chi cho tháng này.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCategories.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                    {c.date ? new Date(c.date).toLocaleDateString('vi-VN') : "—"}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                                                    {c.name}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${c.type === "Thu" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                        {c.type === "Thu" ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                                        {c.type === "Thu" ? "THU" : "CHI"}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${c.type === "Thu" ? "text-green-600" : "text-red-600"}`}>
                                                    {vnd(c.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                                                    {c.notes}
                                                </td>
                                                <td className="px-6 py-4 flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingCategory(c)
                                                            setIsAddModalOpen(true)
                                                        }}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(c)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                             </table>
                        </div>
                        
                        {/* Summary for detail view */}
                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-6 flex flex-wrap gap-10 justify-end border-t border-gray-200 dark:border-neutral-800">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tổng Thu</span>
                                <span className="text-xl font-bold text-green-600">{vnd(filteredCategories.filter((c: Category) => c.type === 'Thu').reduce((a: number, b: Category) => a + b.amount, 0))}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tổng Chi</span>
                                <span className="text-xl font-bold text-red-600">{vnd(filteredCategories.filter((c: Category) => c.type === 'Chi').reduce((a: number, b: Category) => a + b.amount, 0))}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Số dư tháng</span>
                                <span className="text-xl font-bold text-blue-600">
                                    {vnd(filteredCategories.reduce((acc: number, c: Category) => acc + (c.type === 'Thu' ? c.amount : -c.amount), 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-neutral-900 p-6 text-center border border-gray-100 dark:border-neutral-800">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4 animate-pulse">
                            <TrendingDown className="text-red-600 dark:text-red-400" size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa giao dịch
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
                            {deleteConfirmCount === 1
                                ? `Bạn có chắc chắn muốn xóa "${categoryToDelete.name}" vào ngày ${categoryToDelete.date ? new Date(categoryToDelete.date).toLocaleDateString('vi-VN') : "—"}?`
                                : `Đây là xác nhận lần cuối. Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống!`
                            }
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                            >
                                {deleteConfirmCount === 1 ? 'Tiếp tục xóa' : 'Xác nhận xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
