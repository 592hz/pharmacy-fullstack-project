import { useState, useEffect } from "react"
import { Download, Upload, Plus, Bell } from "lucide-react"
import { toast } from "sonner"
import AddCustomerModal from "@/components/add-customer-modal"
import { mockCustomers, setMockCustomers, type Customer } from "@/lib/mock-data"


export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
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

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm overflow-hidden flex flex-col flex-1 h-full min-h-0 border border-gray-200 dark:border-neutral-800">
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Filter Section */}
                    <div className="w-64 bg-gray-100 dark:bg-neutral-800/50 p-4 border-r border-gray-200 dark:border-neutral-800 flex flex-col gap-4 shrink-0 overflow-y-auto">
                        <div className="relative">
                            <select className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm rounded appearance-none focus:outline-none focus:ring-1 focus:ring-green-500">
                                <option>Tìm kiếm</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        <div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
                                className="w-full border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/80 px-3 py-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500 bg-white" />
                                Đã tải App tích điểm
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500 bg-white" />
                                Xem khách còn nợ
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500 bg-white" />
                                Sắp xếp tích điểm KH
                            </label>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900">
                        {/* Action Bar */}
                        <div className="p-3 border-b border-gray-200 dark:border-neutral-800 flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-neutral-800/30">
                            <button className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                                Tìm kiếm
                            </button>

                            <button className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-gray-200 px-3 py-1.5 rounded text-sm transition-colors border border-gray-300 dark:border-neutral-600 mr-2">
                                <Bell size={14} /> Gửi thông báo
                            </button>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1.5 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                                <Plus size={14} /> Thêm mới
                            </button>

                            <div className="flex gap-1">
                                <button className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-7 h-7 flex items-center justify-center rounded transition-colors" title="Export">
                                    <Download size={14} />
                                </button>
                                <button className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-7 h-7 flex items-center justify-center rounded transition-colors" title="Import">
                                    <Upload size={14} />
                                </button>
                                <button className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-7 h-7 flex items-center justify-center rounded transition-colors flex-col gap-0.5 px-1">
                                    <div className="h-[2px] w-full bg-white"></div>
                                    <div className="h-[2px] w-full bg-white"></div>
                                </button>
                                <button className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-7 h-7 flex items-center justify-center rounded transition-colors" title="Print">
                                    <Download size={14} /> {/* Placeholder for other icon */}
                                </button>
                            </div>

                            <div className="ml-auto text-sm font-bold text-gray-700 dark:text-gray-200">
                                Danh sách khách hàng
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto bg-[#ffff] dark:bg-neutral-900/50 p-2">
                            <div className="bg-white dark:bg-neutral-900 rounded border border-gray-300 dark:border-neutral-700 overflow-hidden shadow">
                                <table className="w-full text-xs text-left whitespace-nowrap table-fixed">
                                    <thead className="bg-[#e6e6e6] dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-300 dark:border-neutral-700">
                                        <tr>
                                            <th className="w-8 px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-center">
                                                <input type="checkbox" className="rounded-sm border-gray-400" />
                                            </th>
                                            <th className="w-32 px-2 py-2 border-r border-gray-300 dark:border-neutral-700">Mã khách hàng</th>
                                            <th className="w-56 px-2 py-2 border-r border-gray-300 dark:border-neutral-700">Tên khách hàng</th>
                                            <th className="w-28 px-2 py-2 border-r border-gray-300 dark:border-neutral-700">SĐT</th>
                                            <th className="w-24 px-2 py-2 border-r border-gray-300 dark:border-neutral-700">Ngày sinh</th>
                                            <th className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700">Địa chỉ</th>
                                            <th className="w-24 px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">Điểm tích lũy</th>
                                            <th className="w-24 px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">Điểm còn lại</th>
                                            <th className="w-24 px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">Công nợ</th>
                                            <th className="w-28 px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-center">App tích điểm</th>
                                            <th className="w-[180px] px-2 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#e6e6e6] dark:bg-neutral-800/50 divide-y divide-gray-300 dark:divide-neutral-700 text-gray-700 dark:text-gray-300">
                                        {customers.map((customer, idx) => (
                                            <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-center">
                                                    <input type="checkbox" className="rounded-sm border-gray-400" />
                                                </td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700 font-medium truncate" title={customer.id}>{customer.id}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700 font-medium truncate" title={customer.name}>{customer.name}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700">{customer.phone}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700">{customer.dob}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700">{customer.address}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">{customer.accumulatedPoints}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">{customer.remainingPoints}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-right">{customer.debt}</td>
                                                <td className="px-2 py-2 border-r border-gray-300 dark:border-neutral-700 text-center">
                                                    <label className="inline-flex items-center gap-1 bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-gray-300 dark:border-neutral-600">
                                                        <input type="checkbox" checked={customer.hasApp} readOnly className="w-3 h-3 text-blue-600 rounded-sm" />
                                                        <span className="text-[10px]">Đã cài</span>
                                                    </label>
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-0.5 rounded text-[10px] font-medium leading-tight">
                                                            Công nợ ban đầu
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingCustomer(customer)
                                                                setIsAddModalOpen(true)
                                                            }}
                                                            className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-2 py-0.5 rounded text-[10px] font-medium leading-tight"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(customer)}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-medium leading-tight"
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
                        </div>

                        {/* Pagination Bar */}
                        <div className="bg-[#ffff] dark:bg-neutral-900/50 p-2 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 gap-4 mt-auto">
                            <span>Tổng số bản ghi: {customers.length} - Tổng số trang: 1</span>
                            <div className="flex items-center gap-1">
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&laquo;</button>
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&lsaquo;</button>
                                <button className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">1</button>
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&rsaquo;</button>
                                <button className="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50" disabled>&raquo;</button>
                                <select className="ml-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-1 py-0.5 rounded text-xs">
                                    <option>1</option>
                                </select>
                            </div>
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
                                ? `Bạn có chắc chắn muốn xóa khách hàng "${customerToDelete.name}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa khách hàng "${customerToDelete.name}"?`
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
