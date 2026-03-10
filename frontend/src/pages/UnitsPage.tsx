import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import AddUnitModal from "@/components/add-unit-modal"

const initialUnits = [
    { id: "1", name: "Que" },
    { id: "2", name: "Miếng" },
    { id: "3", name: "Bịch" },
    { id: "4", name: "Lốc" },
    { id: "5", name: "Bánh" },
    { id: "6", name: "Can" }
]

export default function UnitsPage() {
    const [units, setUnits] = useState(initialUnits)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<any>(null)
    const [unitToDelete, setUnitToDelete] = useState<any>(null)

    const handleDeleteClick = (unit: any) => {
        setUnitToDelete(unit)
    }

    const confirmDelete = () => {
        setUnits(units.filter(u => u.id !== unitToDelete.id))
        toast.success("Đã xóa đơn vị tính thành công!")
        setUnitToDelete(null)
    }

    const cancelDelete = () => {
        setUnitToDelete(null)
    }

    const handleAddUnit = (newUnit: any) => {
        setUnits([newUnit, ...units])
        toast.success("Đã thêm đơn vị tính mới thành công!")
        setIsAddModalOpen(false)
    }

    const handleEditUnit = (updatedUnit: any) => {
        setUnits(units.map(u => u.id === updatedUnit.id ? updatedUnit : u))
        toast.success("Cập nhật thông tin đơn vị tính thành công!")
        setIsAddModalOpen(false)
        setEditingUnit(null)
    }

    const filteredUnits = units.filter(unit =>
        unit.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4">
                <h1 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Danh sách đơn vị tính</h1>

                {/* Actions & Search */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 max-w-2xl relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 px-3 py-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <button className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                        Tìm kiếm
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        <Plus size={16} /> Thêm mới
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded border border-gray-300 dark:border-neutral-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f0f0f0] dark:bg-neutral-800 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-300 dark:border-neutral-700">
                            <tr>
                                <th className="px-4 py-3 border-r border-gray-300 dark:border-neutral-700">Tên đơn vị tính</th>
                                <th className="w-24 px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 dark:divide-neutral-700 bg-white dark:bg-neutral-900">
                            {filteredUnits.length > 0 ? (
                                filteredUnits.map((unit) => (
                                    <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                                        <td className="px-4 py-3 border-r border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300">
                                            {unit.name}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingUnit(unit)
                                                        setIsAddModalOpen(true)
                                                    }}
                                                    className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-3 py-1 rounded text-xs font-medium"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(unit)}
                                                    className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-3 py-1 rounded text-xs font-medium"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                                        Không tìm thấy đơn vị tính nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AddUnitModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingUnit(null)
                }}
                onAdd={handleAddUnit}
                onEdit={handleEditUnit}
                initialData={editingUnit}
            />

            {unitToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-sm rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Bạn có chắc chắn muốn xóa đơn vị tính "{unitToDelete.name}"?
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={cancelDelete}
                                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
