import { useState, useEffect } from "react"
import { Download, Upload, Plus, Bell, FileText } from "lucide-react"
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="rounded-xl border bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="border-b px-6 py-4">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Danh sách khách hàng</h1>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="flex flex-1">
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full sm:max-w-md rounded-l-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            />
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-6 py-2 rounded-r-md font-medium transition-colors text-sm">
                                Tìm kiếm
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-gray-200 px-4 py-2 rounded-md font-medium transition-colors text-sm border border-gray-200 dark:border-neutral-700 mr-1">
                                <Bell size={16} /> Gửi thông báo
                            </button>
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
                                <FileText size={18} />
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-10 h-10 rounded-md transition-colors" title="Print/Export file">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-neutral-800">
                        <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-800/50 dark:text-gray-300 border-b border-gray-200 dark:border-neutral-800 font-semibold">
                                <tr>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 w-24">Mã KH</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 w-64 max-w-[200px] whitespace-normal break-words">Tên khách hàng</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 w-32">SĐT</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 w-32">Ngày sinh</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 min-w-[150px]">Địa chỉ</th>
                                    <th className="px-3 py-2 w-[180px]"></th>
                                </tr>
                            </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                                        {displayedCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                    Không có dữ liệu
                                                </td>
                                            </tr>
                                        ) : displayedCustomers.map((customer, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-gray-300 transition-colors">
                                                <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-medium">{customer.id}</td>
                                                <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-medium max-w-[200px] whitespace-normal break-words">{customer.name}</td>
                                                <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800">{customer.phone}</td>
                                                <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 text-xs">{customer.dob}</td>
                                                <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 text-xs whitespace-normal break-words">{customer.address}</td>
                                                <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCustomer(customer)
                                                            setIsAddModalOpen(true)
                                                        }}
                                                        className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-2 py-1.5 rounded text-[11px] font-semibold"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(customer)}
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
                                Tổng số bản ghi: {filteredCustomers.length} - Trang {currentPage}/{totalPages}
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
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-md font-medium transition-colors ${
                                                        currentPage === pageNum
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
                                        setItemsPerPage(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    className="ml-4 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md text-sm px-2 py-1 h-8 focus:ring-green-500 focus:border-green-500 min-w-16 text-center appearance-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa khách hàng
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {deleteConfirmCount === 1
                                ? `Bạn có chắc chắn muốn xóa khách hàng "${customerToDelete?.name}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa khách hàng "${customerToDelete?.name}"?`
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
