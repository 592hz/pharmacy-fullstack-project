import { useState, useEffect } from "react"
import { Download, Upload, SlidersHorizontal, FileText, Plus } from "lucide-react"
import { toast } from "sonner"
import AddSupplierModal from "@/components/add-supplier-modal"
import { type Supplier } from "@/lib/schemas"
import { supplierService } from "@/services/supplier.service"
import { getErrorMessage } from "@/lib/utils"

export default function SuppliersPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    const fetchSuppliers = async () => {
        setIsLoading(true)
        try {
            const data = await supplierService.getAll()
            setSuppliers(data)
        } catch (error: unknown) {
            toast.error("Không thể tải danh sách nhà cung cấp: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.includes(searchTerm))
    )

    const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const displayedSuppliers = filteredSuppliers.slice(startIndex, startIndex + itemsPerPage)

    const handleDeleteClick = (supplier: Supplier) => {
        setSupplierToDelete(supplier)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = async () => {
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2 && supplierToDelete && supplierToDelete.id) {
            try {
                await supplierService.delete(supplierToDelete.id)
                setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id))
                toast.success("Đã xóa nhà cung cấp thành công!")
                setSupplierToDelete(null)
                setDeleteConfirmCount(0)
            } catch (error: unknown) {
                toast.error(`Lỗi khi xóa: ${getErrorMessage(error)}`)
            }
        }
    }

    const cancelDelete = () => {
        setSupplierToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleAddSupplier = async (newSupplier: Supplier) => {
        try {
            const data = await supplierService.create(newSupplier)
            setSuppliers([data, ...suppliers])
            toast.success("Đã thêm nhà cung cấp mới thành công!")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    const handleEditSupplier = async (updatedSupplier: Supplier) => {
        try {
            if (!updatedSupplier.id) return;
            const data = await supplierService.update(updatedSupplier.id, updatedSupplier)
            setSuppliers(suppliers.map(s => s.id === data.id ? data : s))
            toast.success("Cập nhật thông tin nhà cung cấp thành công!")
        } catch (error: unknown) {
            toast.error(`Lỗi: ${getErrorMessage(error)}`)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="rounded-xl border bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="border-b px-6 py-4">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Danh sách nhà cung cấp</h1>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="flex flex-1">
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:max-w-md rounded-l-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            />
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-6 py-2 rounded-r-md font-medium transition-colors text-sm">
                                Tìm kiếm
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                            >
                                <Plus size={16} /> Thêm mới
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-10 h-10 rounded-md transition-colors" title="Export">
                                <Download size={18} />
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-10 h-10 rounded-md transition-colors" title="Import">
                                <Upload size={18} />
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-10 h-10 rounded-md transition-colors" title="Columns">
                                <SlidersHorizontal size={18} />
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-10 h-10 rounded-md transition-colors" title="Print/Export file">
                                <FileText size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-neutral-800">
                        <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-800/50 dark:text-gray-300 border-b border-gray-200 dark:border-neutral-800">
                                <tr>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold w-24">Mã NCC</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold w-64 max-w-[250px] whitespace-normal break-words">Tên NCC</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold max-w-[150px]">Địa chỉ</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold w-32">Điện thoại</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold w-24 text-right">Công nợ</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold min-w-[200px]">Ghi chú</th>
                                    <th className="px-3 py-2 w-[240px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                                {suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                ) : displayedSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-gray-300">
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-medium">{supplier.code}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 max-w-[250px] text-xs leading-relaxed whitespace-normal break-words">{supplier.name}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 text-xs leading-relaxed max-w-[180px] break-words whitespace-normal">{supplier.address}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800">{supplier.phone}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 text-right">
                                            {new Intl.NumberFormat('vi-VN').format(supplier.debt)}
                                        </td>
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 min-w-[200px] whitespace-normal break-words">{supplier.notes}</td>
                                        <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    setEditingSupplier(supplier)
                                                    setIsAddModalOpen(true)
                                                }}
                                                className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-2 py-1.5 rounded text-[11px] font-semibold"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(supplier)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded text-[11px] font-semibold"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                            Tổng số bản ghi: {filteredSuppliers.length} - Trang {currentPage}/{totalPages}
                            {isLoading && <span className="text-[#5c9a38] animate-pulse ml-2">Đang tải...</span>}
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                title="Trang đầu"
                            >
                                &laquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                title="Trang trước"
                            >
                                &lsaquo;
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Only show a few page numbers around the current page
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-md font-medium transition-colors ${currentPage === pageNum
                                                    ? "bg-blue-100 text-blue-600"
                                                    : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        (pageNum === 2 && currentPage > 3) ||
                                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                title="Trang sau"
                            >
                                &rsaquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                title="Trang cuối"
                            >
                                &raquo;
                            </button>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="ml-4 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md text-sm px-2 py-1 h-8 focus:ring-green-500 focus:border-green-500 min-w-16 text-center appearance-none"
                            >
                                <option value={1}>1</option>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <AddSupplierModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingSupplier(null)
                }}
                onAdd={handleAddSupplier}
                onEdit={handleEditSupplier}
                initialData={editingSupplier}
            />

            {/* Delete Confirmation Modal */}
            {supplierToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa nhà cung cấp
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {deleteConfirmCount === 1
                                ? `Bạn có chắc chắn muốn xóa nhà cung cấp "${supplierToDelete.name}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa nhà cung cấp "${supplierToDelete.name}"?`
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
