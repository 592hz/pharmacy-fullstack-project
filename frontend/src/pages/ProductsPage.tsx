import { useState } from "react"
import { Search, List, Download, RefreshCw } from "lucide-react"
import { AddProductModal } from "@/components/add-product-modal"
import { toast } from "sonner"
import { mockProducts, mockProductCategories, mockSuppliersList, type Product } from "@/lib/mock-data"
import { type ProductFormData } from "@/components/add-product-modal"

// Use common mock data
const initialProducts = mockProducts

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)

    // Search and Pagination State
    const [searchQuery, setSearchQuery] = useState("")
    const [stockFilter, setStockFilter] = useState("Tất cả")
    const [categoryFilter, setCategoryFilter] = useState("Tất cả")
    const [supplierFilter, setSupplierFilter] = useState("Tất cả")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(15)

    // Filter Logic
    const filteredProducts = products.filter(product => {
        // 1. Text Search
        const query = searchQuery.toLowerCase().trim()

        const category = mockProductCategories.find(c => c.id === product.categoryId)
        const supplier = mockSuppliersList.find(s => s.id === product.supplierId)

        const matchesQuery = !query ||
            product.name.toLowerCase().includes(query) ||
            product.id.toLowerCase().includes(query) ||
            (product.registrationNo && product.registrationNo.toLowerCase().includes(query)) ||
            (category && category.name.toLowerCase().includes(query)) ||
            (supplier && supplier.name.toLowerCase().includes(query))

        if (!matchesQuery) return false

        // 2. Stock Filter
        const totalBaseQuantity = product.batches && product.batches.length > 0
            ? product.batches.reduce((sum, b) => sum + b.quantity, 0)
            : product.baseQuantity
        const stockCount = Math.floor(totalBaseQuantity / (product.conversionRate || 1))
        
        const lowStockThreshold = product.unit === "Viên" ? 25 : 1
        if (stockFilter === "Còn hàng" && stockCount <= 0) return false
        if (stockFilter === "Sắp hết hàng" && (stockCount <= 0 || stockCount > lowStockThreshold)) return false
        if (stockFilter === "Hết hàng" && stockCount > 0) return false
        // 3. Category Filter
        if (categoryFilter !== "Tất cả" && product.categoryId !== categoryFilter) return false

        // 4. Supplier Filter
        if (supplierFilter !== "Tất cả" && product.supplierId !== supplierFilter) return false

        return true
    })

    // Pagination Logic
    const totalRecords = filteredProducts.length
    const totalPages = Math.ceil(totalRecords / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

    // Auto-adjust page if current page exceeds new totalPages after search
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages)
    } else if (totalPages === 0 && currentPage !== 1) {
        setCurrentPage(1)
    }

    const handleResetFilters = () => {
        setSearchQuery("")
        setStockFilter("Tất cả")
        setCategoryFilter("Tất cả")
        setSupplierFilter("Tất cả")
        setCurrentPage(1)
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1) // Reset to first page on search
    }

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product)
        setDeleteConfirmCount(1)
    }

    const confirmDelete = () => {
        if (deleteConfirmCount === 1) {
            setDeleteConfirmCount(2)
            return
        }

        if (deleteConfirmCount === 2) {
            setProducts(products.filter(p => p.id !== productToDelete?.id))
            toast.success("Đã xóa sản phẩm thành công!")
            setProductToDelete(null)
            setDeleteConfirmCount(0)
        }
    }

    const cancelDelete = () => {
        setProductToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleSaveProduct = (formData: ProductFormData) => {
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
                        baseQuantity: formData.initialQuantity * (formData.units[0]?.conversionRate || 1),
                        baseUnitName: formData.baseUnitName || p.baseUnitName,
                        conversionRate: formData.units[0]?.conversionRate || 1,
                        categoryId: formData.categoryId,
                        supplierId: formData.supplierId,
                        batches: p.batches && p.batches.length > 0 
                            ? p.batches.map((b, i) => i === 0 ? { ...b, batchNumber: formData.batchNumber, expiryDate: formData.expiryDate, quantity: formData.initialQuantity * (formData.units[0]?.conversionRate || 1) } : b)
                            : [{ batchNumber: formData.batchNumber, expiryDate: formData.expiryDate, quantity: formData.initialQuantity * (formData.units[0]?.conversionRate || 1) }]
                    }
                    : p
            ))
            setEditingProduct(null)
        } else {
            // Add new product
            const newProduct: Product = {
                id: formData.productCode,
                name: formData.productName,
                isDQG: false,
                unit: formData.units[0]?.unitName || "",
                manufacturer: ".",
                importPrice: formData.units[0]?.importPrice || 0,
                retailPrice: formData.units[0]?.retailPrice || 0,
                wholesalePrice: formData.units[0]?.wholesalePrice || 0,
                expiryDate: formData.expiryDate,
                registrationNo: ".",
                baseQuantity: formData.initialQuantity * (formData.units[0]?.conversionRate || 1),
                baseUnitName: formData.baseUnitName || "",
                conversionRate: formData.units[0]?.conversionRate || 1,
                categoryId: formData.categoryId,
                supplierId: formData.supplierId,
                batches: [
                    { 
                        batchNumber: formData.batchNumber || "MỚI", 
                        expiryDate: formData.expiryDate || ".", 
                        quantity: formData.initialQuantity * (formData.units[0]?.conversionRate || 1) 
                    }
                ]
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
                key={isAddModalOpen ? `new-product` : (editingProduct ? `edit-${editingProduct.id}` : 'closed')}
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
                        <select
                            className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer"
                            onChange={(e) => {
                                if (e.target.value === "Tất cả sản phẩm") {
                                    handleResetFilters()
                                }
                            }}
                        >
                            <option>Tất cả sản phẩm</option>
                            <option>Dược phẩm</option>
                            <option>Vật tư y tế</option>
                        </select>
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select
                            className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-500"
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                        >
                            <option value="Tất cả">Nhóm sản phẩm</option>
                            {mockProductCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select
                            className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-500"
                            value={supplierFilter}
                            onChange={(e) => {
                                setSupplierFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                        >
                            <option value="Tất cả">Nhà cung cấp</option>
                            {mockSuppliersList.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <input
                            type="text"
                            placeholder="Tên sản phẩm, mã vạch (F3)"
                            className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none text-gray-700 dark:text-gray-300"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <div className="border border-gray-300 dark:border-neutral-700 rounded overflow-hidden">
                        <select
                            className="w-full bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer text-gray-700"
                            value={stockFilter}
                            onChange={(e) => {
                                setStockFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                        >
                            <option>Tất cả</option>
                            <option>Còn hàng</option>
                            <option>Sắp hết hàng</option>
                            <option>Hết hàng</option>
                        </select>
                    </div>
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
                                value={searchQuery}
                                onChange={handleSearchChange}
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
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-24 text-center">Số lượng</th>
                                <th className="px-3 py-3 border-r border-gray-200 dark:border-neutral-800 font-semibold w-28 text-center">Ngày sử dụng</th>
                                <th className="px-2 py-3 w-[80px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {paginatedProducts.map((product) => (
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
                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-center text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                        {(() => {
                                            const total = product.batches && product.batches.length > 0
                                                ? product.batches.reduce((sum, b) => sum + b.quantity, 0)
                                                : product.baseQuantity
                                            const qty = Math.floor(total / (product.conversionRate || 1))
                                            return (
                                                <div className="flex flex-col leading-none gap-1">
                                                    <span>{qty} {product.unit}</span>
                                                    {product.batches && product.batches.length > 1 && (
                                                        <span className="text-[9px] text-gray-400">({product.batches.length} lô)</span>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </td>

                                    <td className="px-3 py-2 border-r border-gray-100 dark:border-neutral-800 text-center text-[11px] text-gray-400">
                                        {(() => {
                                            if (product.batches && product.batches.length > 0) {
                                                // Sort by expiry date (assuming DD/MM/YYYY or simple string sort for now)
                                                // Simplified: just pick the first one which is usually the oldest/nearest
                                                const sorted = [...product.batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
                                                return sorted[0].expiryDate
                                            }
                                            return product.expiryDate || "."
                                        })()}
                                    </td>

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

                    <div className="flex items-center justify-center mt-6 text-xs text-gray-500 dark:text-gray-400 mb-2 gap-4 uppercase font-semibold">
                        <div className="mr-8">
                            Tổng số bản ghi: {totalRecords} - Tổng số trang: {totalPages}
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                &laquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                &lsaquo;
                            </button>

                            {/* Render up to 5 page buttons */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Logic to show pages around currentPage
                                let pageNum = i + 1;
                                if (totalPages > 5) {
                                    if (currentPage > 3) {
                                        pageNum = currentPage - 2 + i;
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                    }
                                }
                                if (pageNum > totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${currentPage === pageNum
                                            ? 'bg-[#5c9a38] text-white font-bold'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                &rsaquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                &raquo;
                            </button>
                            <div className="ml-2 border border-gray-300 rounded px-2 py-1 flex items-center bg-white dark:bg-neutral-800 h-6">
                                <span>{currentPage}</span>
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
