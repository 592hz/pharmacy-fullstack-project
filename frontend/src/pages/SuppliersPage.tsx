import { useState } from "react"
import { Download, Upload, SlidersHorizontal, FileText, Plus } from "lucide-react"
import { toast } from "sonner"
import AddSupplierModal from "@/components/add-supplier-modal"

const initialSuppliers = [
    {
        id: "NCC00006",
        name: "CÔNG TY CP DƯỢC PHẨM MEDX",
        address: "Tầng 3, số 164 Phan Văn Trị, Phường Bình Thạnh, TP Hồ Chí Minh",
        phone: "02873008840",
        debt: -30542,
        notes: "",
    },
    {
        id: "NCC00010",
        name: "CÔNG TY TNHH UMED VIỆT NAM",
        address: "373/1/171J Lý Thường Kiệt, Phường Tân Hòa, Thành phố Hồ Chí Minh, Việt Nam",
        phone: "0898850086",
        debt: 5,
        notes: "",
    },
    {
        id: "NCC00014",
        name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ DƯỢC CHÂU THỊNH PHÁT",
        address: "27C Đường Nguyễn Hiền, Khu phố Thắng Lợi 2, Phường Dĩ An, Thành Phố Hồ Chí Minh, Việt Nam",
        phone: "0972288139",
        debt: 0,
        notes: "",
    },
    {
        id: "NCC00015",
        name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI DƯỢC VƯƠNG",
        address: "Số 62, ngõ 5, đường Vũ Trọng Phụng, Phường Thanh Xuân, Thành phố Hà Nội, Việt Nam",
        phone: "",
        debt: -33114,
        notes: "",
    },
    {
        id: "NCC00004",
        name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI THIẾT BỊ KHÁNH AN",
        address: "Số C9/5A, Khu phố Bình Thuận II, Phường Thuận Giao, Thành phố Hồ Chí Minh, Việt Nam",
        phone: "0903964865",
        debt: 0,
        notes: "",
    },
    {
        id: "NCC00008",
        name: "CÔNG TY CỔ PHẦN DƯỢC PHẨM MEDX",
        address: "Tầng 3, số 164 Phan Văn Trị, Phường Bình Thạnh, TP Hồ Chí Minh",
        phone: "02873008840",
        debt: 0,
        notes: "",
    },
    {
        id: "NCC00013",
        name: "CÔNG TY TNHH DƯỢC AN THÀNH PHÁT",
        address: "Thửa đất số 1713, Tờ bản đồ số G, Khu phố Tân Hiệp, Phường Tân Đông Hiệp, Thành phố Hồ Chí Minh, Việt Nam",
        phone: "02746 550 7043",
        debt: 0,
        notes: "",
    },
    {
        id: "NCC00011",
        name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ THUẬN PHÁT VN",
        address: "465/1/12 Tân Kỳ Tân Quý, Phường Tân Sơn Nhì, TP Hồ Chí Minh, Việt Nam",
        phone: "",
        debt: -19,
        notes: "",
    },
    {
        id: "1C25TSH",
        name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TRANG THIẾT BỊ SEN HỒNG",
        address: "Ô 12, Lô BT04, đường D7, Khu dân cư An Thạnh, khu phố Thạnh Hòa B, Phường An Thạnh, Thành phố Thuận An, Tỉnh Bình Dương, Việt Nam",
        phone: "0855888893",
        debt: -249270,
        notes: "",
    },
    {
        id: "NCC00009",
        name: "CÔNG TY TNHH THƯƠNG MẠI VÀ DƯỢC PHẨM BALE PHARMA",
        address: "Lô A1-16 & A1-17 đường Như Nguyệt, Phường Hải Châu, Thành phố Đà Nẵng, Việt Nam",
        phone: "",
        debt: 0,
        notes: "",
    },
    {
        id: "NCC00005",
        name: "CÔNG TY TNHH THƯƠNG MẠI VTYT HUY HOÀNG",
        address: "10C/KDC 17, Khu phố Bình Phước A, Phường An Phú, Thành phố Hồ Chí Minh, Việt Nam",
        phone: "0355885339",
        debt: 0,
        notes: "",
    },
]

export default function SuppliersPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [suppliers, setSuppliers] = useState(initialSuppliers)
    const [editingSupplier, setEditingSupplier] = useState<any>(null)
    const [supplierToDelete, setSupplierToDelete] = useState<any>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    const handleDeleteClick = (supplier: any) => {
        setSupplierToDelete(supplier)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = () => {
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2) {
            setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id))
            toast.success("Đã xóa nhà cung cấp thành công!")
            setSupplierToDelete(null)
            setDeleteConfirmCount(0)
        }
    }

    const cancelDelete = () => {
        setSupplierToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleAddSupplier = (newSupplier: any) => {
        setSuppliers([newSupplier, ...suppliers])
        toast.success("Đã thêm nhà cung cấp mới thành công!")
    }

    const handleEditSupplier = (updatedSupplier: any) => {
        setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s))
        toast.success("Cập nhật thông tin nhà cung cấp thành công!")
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
                                className="w-full sm:max-w-md rounded-l-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            />
                            <button className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-r-md font-medium transition-colors text-sm">
                                Tìm kiếm
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                            >
                                <Plus size={16} /> Thêm mới
                            </button>
                            <button className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-md transition-colors" title="Export">
                                <Download size={18} />
                            </button>
                            <button className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-md transition-colors" title="Import">
                                <Upload size={18} />
                            </button>
                            <button className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-md transition-colors" title="Columns">
                                <SlidersHorizontal size={18} />
                            </button>
                            <button className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-md transition-colors" title="Print/Export file">
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
                                ) : suppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 text-gray-700 dark:text-gray-300">
                                        <td className="px-3 py-2 border-r border-gray-200 dark:border-neutral-800 font-medium">{supplier.id}</td>
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
                                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded text-[11px] font-semibold"
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
                            Tổng số bản ghi: {suppliers.length} - Tổng số trang: 1
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
