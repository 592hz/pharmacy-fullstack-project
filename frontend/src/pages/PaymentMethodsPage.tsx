import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import AddPaymentMethodModal from "@/components/add-payment-method-modal"

const initialPaymentMethods = [
    {
        id: "PM0001",
        name: "Chuyển khoản",
        notes: "",
        isDefault: false,
    },
    {
        id: "PM0002",
        name: "Tiền mặt",
        notes: "",
        isDefault: true,
    },
]

export default function PaymentMethodsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods)
    const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null)
    const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<any>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    const handleDeleteClick = (paymentMethod: any) => {
        setPaymentMethodToDelete(paymentMethod)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = () => {
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2) {
            setPaymentMethods(paymentMethods.filter(s => s.id !== paymentMethodToDelete.id))
            toast.success("Đã xóa phương thức thanh toán thành công!")
            setPaymentMethodToDelete(null)
            setDeleteConfirmCount(0)
        }
    }

    const cancelDelete = () => {
        setPaymentMethodToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleAddPaymentMethod = (newPaymentMethod: any) => {
        setPaymentMethods([newPaymentMethod, ...paymentMethods])
        toast.success("Đã thêm phương thức thanh toán mới thành công!")
    }

    const handleEditPaymentMethod = (updatedPaymentMethod: any) => {
        setPaymentMethods(paymentMethods.map(s => s.id === updatedPaymentMethod.id ? updatedPaymentMethod : s))
        toast.success("Cập nhật thông tin phương thức thanh toán thành công!")
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="rounded-xl border bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="border-b px-6 py-4">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Danh sách phương thức thanh toán</h1>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="flex flex-1">
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
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
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-neutral-800">
                        <table className="w-full text-sm text-left whitespace-nowrap lg:whitespace-normal">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-800/50 dark:text-gray-300 border-b border-gray-200 dark:border-neutral-800">
                                <tr>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold w-64 max-w-[250px] whitespace-normal">Tên phương thức thanh toán</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold min-w-[200px]">Ghi chú</th>
                                    <th className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-semibold w-32 text-center">Mặc định</th>
                                    <th className="px-3 py-2 w-[160px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                                {paymentMethods.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                ) : paymentMethods.map((pm) => (
                                    <tr key={pm.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-gray-300">
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 max-w-[250px] text-sm leading-relaxed whitespace-normal break-words">{pm.name}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 min-w-[200px] whitespace-normal break-words">{pm.notes}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 text-center">
                                            <input type="checkbox" checked={pm.isDefault} readOnly className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                        </td>
                                        <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    setEditingPaymentMethod(pm)
                                                    setIsAddModalOpen(true)
                                                }}
                                                className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-2 py-1.5 rounded text-[11px] font-semibold"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(pm)}
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
                            Tổng số bản ghi: {paymentMethods.length} - Tổng số trang: 1
                        </div>
                        <div className="flex items-center space-x-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &laquo;
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &lsaquo;
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 font-medium">
                                1
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &rsaquo;
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>
                                &raquo;
                            </button>
                            <select className="ml-4 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md text-sm px-2 py-1 h-8 focus:ring-green-500 focus:border-green-500 w-16 text-center appearance-none">
                                <option>1</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <AddPaymentMethodModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingPaymentMethod(null)
                }}
                onAdd={handleAddPaymentMethod}
                onEdit={handleEditPaymentMethod}
                initialData={editingPaymentMethod}
            />

            {/* Delete Confirmation Modal */}
            {paymentMethodToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa phương thức thanh toán
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {deleteConfirmCount === 1
                                ? `Bạn có chắc chắn muốn xóa phương thức thanh toán "${paymentMethodToDelete.name}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa phương thức thanh toán "${paymentMethodToDelete.name}"?`
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
