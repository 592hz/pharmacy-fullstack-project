import { useState, useEffect } from "react"
import { Download, Upload, Plus, Bell, FileText, X } from "lucide-react"
import { toast } from "sonner"
import AddCustomerModal from "@/components/add-customer-modal"
import { mockCustomers, setMockCustomers, type Customer } from "@/lib/mock-data"


export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    useEffect(() => {
        setMockCustomers(customers)
    }, [customers])

    const handleDeleteClick = (customer: Customer) => {
        setCustomerToDelete(customer)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = () => {
        if (!customerToDelete) return
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2) {
            setCustomers(customers.filter(c => c.id !== customerToDelete.id))
            toast.success("Đã xóa khách hàng thành công!")
            setCustomerToDelete(null)
            setDeleteConfirmCount(0)
        }
    }

    const cancelDelete = () => {
        setCustomerToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleAddCustomer = (newCustomer: Customer) => {
        setCustomers([newCustomer, ...customers])
        toast.success("Đã thêm khách hàng mới thành công!")
        setIsAddModalOpen(false)
    }

    const handleEditCustomer = (updatedCustomer: Customer) => {
        setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c))
        toast.success("Cập nhật thông tin khách hàng thành công!")
        setIsAddModalOpen(false)
        setEditingCustomer(null)
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    )

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen font-sans">
            <div className="rounded-xl border bg-white dark:bg-neutral-900 shadow-sm overflow-hidden text-gray-800 dark:text-gray-100">
                <div className="border-b px-6 py-4 bg-white dark:bg-neutral-900">
                    <h1 className="text-xl font-bold">Danh sách khách hàng</h1>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Header Actions */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6">
                        <div className="flex flex-1">
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full lg:max-w-md rounded-l-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/50 transition-all"
                            />
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 sm:px-6 py-2 rounded-r-md font-medium transition-colors text-sm shrink-0 shadow-sm">
                                Tìm kiếm
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-gray-200 px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm border border-gray-200 dark:border-neutral-700">
                                <Bell size={16} /> <span className="hidden sm:inline">Gửi thông báo</span>
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm shadow-sm"
                            >
                                <Plus size={16} /> <span className="hidden sm:inline">Thêm mới</span><span className="sm:hidden text-xs">Thêm</span>
                            </button>
                            <div className="flex gap-1 items-center ml-auto lg:ml-0">
                                <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-9 h-9 rounded-md transition-colors shadow-sm" title="Xuất file">
                                    <Download size={16} />
                                </button>
                                <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-9 h-9 rounded-md transition-colors shadow-sm" title="Nhập file">
                                    <Upload size={16} />
                                </button>
                                <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-9 h-9 rounded-md transition-colors shadow-sm" title="Hiển thị cột">
                                    <FileText size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-800/50 dark:text-gray-300 border-b border-gray-200 dark:border-neutral-800 font-semibold">
                                <tr>
                                    <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 w-24 hidden md:table-cell text-center">ID</th>
                                    <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800">Khách hàng</th>
                                    <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 w-32 text-center">SĐT</th>
                                    <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 w-32 hidden sm:table-cell text-center">Ngày sinh</th>
                                    <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 min-w-[150px] hidden lg:table-cell">Địa chỉ</th>
                                    <th className="px-3 py-3 w-[100px] text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                                {displayedCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                            Không tìm thấy khách hàng nào
                                        </td>
                                    </tr>
                                ) : displayedCustomers.map((customer, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-neutral-800/30 text-gray-700 dark:text-gray-300 transition-colors">
                                        <td className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-medium hidden md:table-cell text-center text-xs">{customer.id}</td>
                                        <td className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-sm">{customer.name}</span>
                                                <span className="text-[10px] text-gray-400 md:hidden">{customer.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 text-center text-xs">{customer.phone}</td>
                                        <td className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 hidden sm:table-cell text-xs text-center">{customer.dob}</td>
                                        <td className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 text-[11px] hidden lg:table-cell leading-relaxed">{customer.address}</td>
                                        <td className="px-3 py-3 text-center space-x-2 whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    setEditingCustomer(customer)
                                                    setIsAddModalOpen(true)
                                                }}
                                                className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white p-1.5 rounded transition-transform active:scale-95"
                                                title="Sửa"
                                            >
                                                <FileText size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(customer)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-transform active:scale-95"
                                                title="Xóa"
                                            >
                                                <X size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="order-2 sm:order-1 flex items-center gap-2">
                            <span>Tổng cộng: <span className="font-bold text-gray-700 dark:text-gray-200">{filteredCustomers.length}</span></span>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <span>Trang <span className="font-medium text-gray-700 dark:text-gray-200">{currentPage}</span> / {totalPages}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 order-1 sm:order-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                                title="Trang đầu"
                            >
                                &laquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                            >
                                <span className="hidden sm:inline text-xs">Trước</span>
                                <span className="sm:hidden">&lsaquo;</span>
                            </button>

                            <div className="hidden md:flex items-center gap-1 mx-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 flex items-center justify-center rounded font-medium transition-all ${currentPage === pageNum
                                                        ? "bg-[#5c9a38] text-white border-[#5c9a38]"
                                                        : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-800"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        (pageNum === 2 && currentPage > 3) ||
                                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return <span key={pageNum} className="px-1 text-gray-400 select-none">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                            >
                                <span className="hidden sm:inline text-xs">Sau</span>
                                <span className="sm:hidden">&rsaquo;</span>
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                                title="Trang cuối"
                            >
                                &raquo;
                            </button>

                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="ml-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-xs px-2 h-8 focus:ring-1 focus:ring-[#5c9a38] outline-none cursor-pointer"
                            >
                                <option value={10}>10 / Trang</option>
                                <option value={20}>20 / Trang</option>
                                <option value={50}>50 / Trang</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <AddCustomerModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingCustomer(null)
                }}
                onAdd={handleAddCustomer}
                onEdit={handleEditCustomer}
                initialData={editingCustomer}
            />

            {/* Delete Confirmation Modal */}
            {customerToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 transition-opacity animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-neutral-900 p-6 text-center transform animate-in zoom-in duration-200">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 mb-4 border border-red-100 dark:border-red-900/30">
                            <X size={28} className="text-red-600 dark:text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            {deleteConfirmCount === 1
                                ? `Hành động này sẽ xóa vĩnh viễn khách hàng "${customerToDelete?.name}". Bạn có chắc chắn?`
                                : `Vui lòng xác nhận lại: Bạn thực sự muốn xóa khách hàng "${customerToDelete?.name}"?`
                            }
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-sm transition-colors"
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
