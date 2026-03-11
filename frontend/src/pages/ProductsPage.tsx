import { useState } from "react"
import { Search, List, Download, RefreshCw } from "lucide-react"
import { AddProductModal } from "@/components/add-product-modal"
import { toast } from "sonner"

// Fake data matching the screenshot
const initialProducts = [
    {
        id: "SP000024",
        name: "Amariston 10mg",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 3000,
        retailPrice: 7000,
        wholesalePrice: 7000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000161",
        name: "Amoxicillin 500 mekophar (h/100v)",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 67428,
        retailPrice: 100000,
        wholesalePrice: 100000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000221",
        name: "AUGBACTAM 625 (HCN/1túi/2vỉ/5VNBP)",
        isDQG: true,
        unit: "Viên",
        manufacturer: ".",
        importPrice: 2524,
        retailPrice: 8000,
        wholesalePrice: 6000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000290",
        name: "Bromhexin us bromhexin 8mg Us pharma (C/200v)",
        isDQG: true,
        unit: "Viên",
        manufacturer: ".",
        importPrice: 73,
        retailPrice: 100,
        wholesalePrice: 100,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000152",
        name: "Cao xoa bóp bạch hổ hoạt lạc bảo linh (lọ/20g)",
        isDQG: true,
        unit: "Chai",
        manufacturer: ".",
        importPrice: 20271,
        retailPrice: 25000,
        wholesalePrice: 25000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000287",
        name: "Celecoxib 200mg Khapharco (Chai/500 viên nang)",
        isDQG: true,
        unit: "Viên",
        manufacturer: ".",
        importPrice: 450,
        retailPrice: 500,
        wholesalePrice: 500,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000181",
        name: "Dầu gội chống gàu selsun 1% rohto (c/100ml) (lớn)",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 68888,
        retailPrice: 75000,
        wholesalePrice: 75000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000191",
        name: "DHA 9000 IQ BRAIN ( hộp 10 vỉ * 10 Viên) EU Group",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 40740,
        retailPrice: 100000,
        wholesalePrice: 100000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000177",
        name: "Efferalgan 150 Bristol-Myers Squibb (h/10v)",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 28619,
        retailPrice: 40000,
        wholesalePrice: 35000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000120",
        name: "GẠC Y TẾ 8 CON NAI 8CM X 9CM X 8 LỚP",
        isDQG: true,
        unit: "Gói",
        manufacturer: ".",
        importPrice: 5800,
        retailPrice: 10000,
        wholesalePrice: 8000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000186",
        name: "Gentrisone cream shinpoong (t/20g) (lớn)",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 20000,
        retailPrice: 25000,
        wholesalePrice: 25000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000150",
        name: "Ho astex siro opc (c/90ml)",
        isDQG: true,
        unit: "Chai",
        manufacturer: ".",
        importPrice: 37238,
        retailPrice: 40000,
        wholesalePrice: 40000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000146",
        name: "Khẩu trang y tế 4 lớp Khánh An trắng",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 18500,
        retailPrice: 30000,
        wholesalePrice: 25000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
    {
        id: "SP000281",
        name: "Marvelon Organon (H/63v)",
        isDQG: true,
        unit: "Hộp",
        manufacturer: ".",
        importPrice: 206880,
        retailPrice: 225000,
        wholesalePrice: 225000,
        expiryDate: "",
        registrationNo: ".",
        isOnDQG: false,
    },
]

export default function ProductsPage() {
    const [products, setProducts] = useState(initialProducts)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [productToDelete, setProductToDelete] = useState<any>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    const handleDeleteClick = (product: any) => {
        setProductToDelete(product)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = () => {
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2) {
            setProducts(products.filter(p => p.id !== productToDelete.id))
            toast.success("Đã xóa sản phẩm thành công!")
            setProductToDelete(null)
            setDeleteConfirmCount(0)
        }
    }

    const cancelDelete = () => {
        setProductToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleSaveProduct = (formData: any) => {
        if (editingProduct) {
            // Update existing product
            setProducts(products.map(p =>
                p.id === editingProduct.id
                    ? {
                        ...p,
                        name: formData.productName,
                        unit: formData.units[0]?.unitName || p.unit,
                        importPrice: formData.units[0]?.importPrice || p.importPrice,
                        retailPrice: formData.units[0]?.retailPrice || p.retailPrice,
                        wholesalePrice: formData.units[0]?.wholesalePrice || p.wholesalePrice,
                    }
                    : p
            ))
            setEditingProduct(null)
        } else {
            // Add new product
            const newProduct = {
                id: formData.productCode,
                name: formData.productName,
                isDQG: false,
                unit: formData.units[0]?.unitName || "",
                manufacturer: ".",
                importPrice: formData.units[0]?.importPrice || 0,
                retailPrice: formData.units[0]?.retailPrice || 0,
                wholesalePrice: formData.units[0]?.wholesalePrice || 0,
                expiryDate: "",
                registrationNo: ".",
                isOnDQG: false,
            }
            setProducts([newProduct, ...products])
        }
        setIsAddModalOpen(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value)
    }

    return (
        <div className="flex flex-1 flex-col md:flex-row gap-4 p-4 md:p-6 border border-gray-200 dark:border-neutral-800 rounded-lg bg-gray-100 dark:bg-neutral-950 min-h-screen">
            <AddProductModal
                isOpen={isAddModalOpen || !!editingProduct}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingProduct(null)
                }}
                initialData={editingProduct}
                onSuccess={handleSaveProduct}
            />

            {/* LEFT SIDEBAR: Filters (1/4 width on desktop) */}
            <div className="w-full md:w-1/4 max-w-[300px] flex flex-col gap-3">

                {/* Header that aligns with table header */}
                <div className="h-12 bg-[#5c9a38] rounded-xl hidden md:flex items-center">
                    {/* Empty to match table header height/color conceptually if needed, or left blank. Will adjust based on image.
                   The image shows "Thêm sản phẩm mới" button aligns with the left sidebar top. */}
                    <div className="relative w-full h-full">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="absolute inset-0 w-full h-full flex items-center justify-between px-4 bg-[#5c9a38] text-white rounded-sm font-medium text-sm hover:bg-[#5c9a38]/90 transition-colors"
                        >
                            <span>Thêm sản phẩm mới</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-b-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-3 flex flex-col gap-3">
                    {/* Filter Inputs matching screenshot */}
                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer">
                            <option>Tất cả sản phẩm</option>
                        </select>
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-500">
                            <option>Nhóm sản phẩm</option>
                        </select>
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-500">
                            <option>Vị trí sản phẩm</option>
                        </select>
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-500">
                            <option>Nhà cung cấp</option>
                        </select>
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <input type="text" placeholder="Tên sản phẩm, mã vạch (F3)" className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none text-gray-700 dark:text-gray-300" />
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-700">
                            <option>Tất cả</option>
                            <option>Còn hàng</option>
                            <option>Hết hàng</option>
                        </select>
                    </div>
                    {/* 
                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-700">
                            <option>APP Tích điểm</option>
                        </select>
                    </div> */}

                    {/* <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-700">
                            <option>Tất cả SP DQG</option>
                            <option>SP đã liên thông</option>
                            <option>SP chưa liên thông</option>
                        </select>
                    </div> */}

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-700">
                            <option>Tất cả dữ liệu quản trị / kế khái</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* RIGHT MAIN CONTENT: Table and Actions (3/4 width on desktop) */}
            <div className="w-full md:w-3/4 flex flex-col gap-0 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">

                {/* Tool bar row */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-100 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                        {/* Mobile Add Button if needed */}
                        <div className="md:hidden relative w-[180px] h-9">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="absolute inset-0 w-full h-full flex items-center justify-between px-3 bg-[#5c9a38] text-white rounded font-medium text-xs hover:bg-[#5c9a38]/90 transition-colors"
                            >
                                <span>Thêm sản phẩm mới</span>
                            </button>
                        </div>
                        {/* Action Icons */}
                        <button className="w-9 h-9 flex items-center justify-center bg-[#5c9a38] text-white rounded hover:bg-[#5c9a38]/90">
                            <List size={18} />
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center bg-[#5c9a38] text-white rounded hover:bg-[#5c9a38]/90">
                            <Download size={18} />
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center bg-[#5c9a38] text-white rounded hover:bg-[#5c9a38]/90">
                            <RefreshCw size={18} />
                        </button>

                        {/* Search Bar */}
                        <div className="flex ml-2">
                            <input
                                type="text"
                                placeholder="Tìm kiếm"
                                className="w-[150px] sm:w-[200px] h-9 px-3 text-sm border border-gray-300 rounded-l focus:outline-none"
                            />
                            <button className="w-9 h-9 flex items-center justify-center bg-[#5c9a38] text-white rounded-r hover:bg-[#5c9a38]/90">
                                <Search size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                        Danh mục sản phẩm
                    </div>
                </div>

                {/* Table wrapper */}
                <div className="overflow-x-auto bg-white dark:bg-neutral-900 pb-4">
                    <table className="w-full text-xs text-left whitespace-nowrap lg:whitespace-normal">
                        <thead className="text-gray-700 bg-white border-b border-gray-200 dark:border-neutral-800 dark:text-gray-300">
                            <tr>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-24">Mã</th>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold min-w-[250px] max-w-[300px]">Tên sản phẩm</th>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-20 text-center">ĐVT</th>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-24 text-right">Giá nhập</th>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-24 text-right">Giá bán lẻ</th>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-24 text-right">Giá bán buôn</th>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-28 text-center">Ngày sử dụng</th>
                                <th className="px-2 py-3 w-[80px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/50 text-gray-800 dark:text-gray-300">
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 font-medium text-[11px]">{product.id}</td>

                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 whitespace-normal break-words leading-tight">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <span className="text-[11px] md:text-xs">{product.name}</span>
                                            {product.isDQG && (
                                                <span className="text-[#5c9a38] text-[9px] font-bold tracking-tighter">(DQG)</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-center text-[11px]">{product.unit}</td>

                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right text-[11px]">
                                        {formatCurrency(product.importPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right text-[11px]">
                                        {formatCurrency(product.retailPrice)}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-right text-[11px]">
                                        {formatCurrency(product.wholesalePrice)}
                                    </td>

                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-center text-[11px] text-gray-400">{product.expiryDate || "."}</td>

                                    <td className="px-2 py-2 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => setEditingProduct(product)}
                                                className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-2 py-1 rounded text-[10px] font-semibold"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(product)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-semibold"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-center mt-6 text-xs text-gray-500 dark:text-gray-400 mb-2 gap-4">
                        <div className="mr-8">
                            Tổng số bản ghi: 235 - Tổng số trang: 16
                        </div>
                        <div className="flex items-center space-x-1">
                            <button className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600">
                                &laquo;
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600">
                                &lsaquo;
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center rounded bg-blue-100/50 text-blue-600 font-medium">
                                1
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">2</button>
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">3</button>
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">4</button>
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">5</button>
                            <button className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-800">
                                &rsaquo;
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-800">
                                &raquo;
                            </button>
                            <div className="ml-2 border border-gray-300 rounded px-2 py-1 flex items-center bg-white h-6">
                                <span>1</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {productToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-neutral-900 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa sản phẩm
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {deleteConfirmCount === 1
                                ? `Bạn có chắc chắn muốn xóa sản phẩm "${productToDelete.name}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa sản phẩm "${productToDelete.name}"?`
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
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors"
                            >
                                {deleteConfirmCount === 1 ? 'Xóa' : 'Chắc chắn xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
