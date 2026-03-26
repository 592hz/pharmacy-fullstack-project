import { useState } from "react"
import { Search, List, Download, RefreshCw, Plus, FileText } from "lucide-react"
import { AddProductModal } from "@/components/add-product-modal"
import { toast } from "sonner"
import { type Product } from "@/lib/mock-data"
import { productService } from "@/services/product.service"
import { categoryService } from "@/services/category.service"
import { supplierService } from "@/services/supplier.service"
import { useEffect } from "react"

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
    const [deleteConfirmCount, setDeleteConfirmCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [productsData, categoriesData, suppliersData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll(),
                supplierService.getAll()
            ])
            setProducts(productsData)
            setCategories(categoriesData)
            setSuppliers(suppliersData)
        } catch (error) {
            toast.error("Không thể tải dữ liệu sản phẩm")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Search and Pagination State
    const [searchQuery, setSearchQuery] = useState("")
    const [stockFilter, setStockFilter] = useState("Tất cả")
    const [categoryFilter, setCategoryFilter] = useState("Tất cả")
    const [supplierFilter, setSupplierFilter] = useState("Tất cả")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(15)
    const [showFilters, setShowFilters] = useState(false)

    // Filter Logic
    const filteredProducts = products.filter(product => {
        // 1. Text Search
        const query = searchQuery.toLowerCase().trim()

        const category = categories.find(c => c.id === product.categoryId)
        const supplier = suppliers.find(s => s.id === product.supplierId)

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

        if (deleteConfirmCount === 2 && productToDelete) {
            productService.delete(productToDelete.id)
                .then(() => {
                    setProducts(products.filter(p => p.id !== productToDelete.id))
                    toast.success("Đã xóa sản phẩm thành công!")
                    setProductToDelete(null)
                    setDeleteConfirmCount(0)
                })
                .catch(err => {
                    toast.error(`Lỗi khi xóa: ${err.message}`)
                })
        }
    }

    const cancelDelete = () => {
        setProductToDelete(null)
        setDeleteConfirmCount(0)
    }

    const handleSaveProduct = async (savedProduct: any) => {
        try {
            if (editingProduct) {
                setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p))
                setEditingProduct(null)
            } else {
                setProducts([savedProduct, ...products])
            }
            setIsAddModalOpen(false)
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value)
    }

    return (
        <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen font-sans">
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

            {/* LEFT SIDEBAR: Filters */}
            <div className={`w-full lg:w-1/4 max-w-[300px] flex flex-col gap-3 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
                {/* Header that aligns with table header */}
                <div className="h-12 bg-[#5c9a38] rounded-t-xl hidden lg:flex items-center">
                    <div className="relative w-full h-full">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="absolute inset-0 w-full h-full flex items-center justify-between px-4 bg-[#5c9a38] text-white rounded-t-xl font-bold text-sm hover:bg-[#5c9a38]/90 transition-colors shadow-sm"
                        >
                            <span>Thêm sản phẩm mới</span>
                            <Plus size={18} />
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
                            {categories.map(cat => (
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
                            {suppliers.map(sup => (
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

            {/* RIGHT MAIN CONTENT: Table and Actions */}
            <div className="w-full lg:w-3/4 flex flex-col gap-0 bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-neutral-800">

                {/* Tool bar row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-neutral-800/50 border-b border-gray-200 dark:border-neutral-800">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden flex items-center gap-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 h-10 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <List size={18} />
                            <span>Lọc</span>
                        </button>
                        
                        <div className="flex flex-1 sm:hidden">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="w-full h-10 flex items-center justify-center gap-2 bg-[#5c9a38] text-white rounded-md font-bold text-xs hover:bg-[#5c9a38]/90 transition-colors"
                            >
                                <Plus size={16} /> <span>Thêm mới</span>
                            </button>
                        </div>

                        <div className="hidden sm:flex gap-1">
                            <button className="w-10 h-10 flex items-center justify-center bg-[#5c9a38] text-white rounded-md hover:bg-[#5c9a38]/90 shadow-sm transition-transform active:scale-95">
                                <List size={18} />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center bg-[#5c9a38] text-white rounded-md hover:bg-[#5c9a38]/90 shadow-sm transition-transform active:scale-95">
                                <Download size={18} />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center bg-[#5c9a38] text-white rounded-md hover:bg-[#5c9a38]/90 shadow-sm transition-transform active:scale-95">
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center w-full sm:w-auto mt-2 sm:mt-0">
                            <div className="relative flex-1 sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Tìm mã hoặc tên"
                                    className="w-full h-10 pl-3 pr-10 text-sm border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/30 transition-all"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                                <button className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-400 hover:text-[#5c9a38]">
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block text-sm font-bold text-gray-700 dark:text-gray-200 px-2 uppercase tracking-tight">
                        Danh mục sản phẩm
                    </div>
                </div>

                {/* Table wrapper */}
                <div className="overflow-x-auto bg-white dark:bg-neutral-900 pb-4">
                    <table className="w-full text-xs text-left whitespace-nowrap lg:whitespace-normal">
                        <thead className="text-gray-700 bg-gray-50/50 border-b border-gray-200 dark:border-neutral-800 dark:text-gray-300">
                            <tr>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-800 font-bold w-24 hidden md:table-cell text-center uppercase tracking-wider">Mã</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-800 font-bold min-w-[200px] uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-800 font-bold w-20 text-center uppercase tracking-wider">ĐVT</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-800 font-bold w-28 text-right uppercase tracking-wider">Giá bán lẻ</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-800 font-bold w-24 text-center uppercase tracking-wider">Tồn kho</th>
                                <th className="px-3 py-4 border-r border-gray-200 dark:border-neutral-800 font-bold w-28 text-center hidden sm:table-cell uppercase tracking-wider">Hạn dùng</th>
                                <th className="px-3 py-4 w-[100px] text-center uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {paginatedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/20 text-gray-800 dark:text-gray-300 transition-colors">
                                    <td className="px-3 py-3 border-r border-gray-100 dark:border-neutral-800 font-medium text-[11px] hidden md:table-cell text-center">{product.id}</td>

                                    <td className="px-3 py-3 border-r border-gray-100 dark:border-neutral-800 whitespace-normal leading-snug">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs sm:text-sm font-semibold">{product.name}</span>
                                                {product.isDQG && (
                                                    <span className="text-[#5c9a38] text-[9px] font-black border border-[#5c9a38] px-0.5 rounded">DQG</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 md:hidden">{product.id}</span>
                                        </div>
                                    </td>

                                    <td className="px-3 py-3 border-r border-gray-100 dark:border-neutral-800 text-center text-xs">{product.unit}</td>

                                    <td className="px-3 py-3 border-r border-gray-100 dark:border-neutral-800 text-right text-xs font-bold text-[#5c9a38]">
                                        {formatCurrency(product.retailPrice)}
                                    </td>
                                    
                                    <td className="px-3 py-3 border-r border-gray-100 dark:border-neutral-800 text-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        {(() => {
                                            const total = product.batches && product.batches.length > 0
                                                ? product.batches.reduce((sum, b) => sum + b.quantity, 0)
                                                : product.baseQuantity
                                            const qty = Math.floor(total / (product.conversionRate || 1))
                                            return (
                                                <div className="flex flex-col leading-none">
                                                    <span className={qty <= 5 ? 'text-red-500' : ''}>{qty}</span>
                                                    {product.batches && product.batches.length > 1 && (
                                                        <span className="text-[9px] text-gray-400 font-normal">({product.batches.length} lô)</span>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </td>

                                    <td className="px-3 py-3 border-r border-gray-100 dark:border-neutral-800 text-center text-xs text-gray-500 hidden sm:table-cell">
                                        {(() => {
                                            if (product.batches && product.batches.length > 0) {
                                                // Priority 1: First batch with quantity > 0 that is NOT "LÔ ĐẦU"
                                                // Priority 2: First batch with quantity > 0
                                                // Priority 3: First batch that is NOT "LÔ ĐẦU" (even if 0 qty)
                                                // Priority 4: First batch available (likely "LÔ ĐẦU")
                                                
                                                const activeOtherBatches = product.batches.filter(b => b.quantity > 0 && b.batchNumber !== "LÔ ĐẦU")
                                                if (activeOtherBatches.length > 0) {
                                                    const sorted = [...activeOtherBatches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
                                                    return sorted[0].expiryDate
                                                }

                                                const activeBatches = product.batches.filter(b => b.quantity > 0)
                                                if (activeBatches.length > 0) {
                                                    const sorted = [...activeBatches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
                                                    return sorted[0].expiryDate
                                                }

                                                const otherBatches = product.batches.filter(b => b.batchNumber !== "LÔ ĐẦU")
                                                if (otherBatches.length > 0) {
                                                    const sorted = [...otherBatches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
                                                    return sorted[0].expiryDate
                                                }

                                                const sorted = [...product.batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
                                                return sorted[0].expiryDate
                                            }
                                            return product.expiryDate || "."
                                        })()}
                                    </td>

                                    <td className="px-3 py-3 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setEditingProduct(product)}
                                                className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white p-1.5 rounded transition-transform active:scale-95"
                                                title="Sửa"
                                            >
                                                <FileText size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(product)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-transform active:scale-95"
                                                title="Xóa"
                                            >
                                                <Plus className="rotate-45" size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-neutral-800">
                        <div className="order-2 sm:order-1 flex items-center gap-2">
                             <span>Tổng: <span className="font-bold text-gray-700 dark:text-gray-200">{totalRecords}</span></span>
                             <span className="text-gray-300">|</span>
                             <span>Trang <span className="font-medium text-gray-700 dark:text-gray-200">{currentPage}</span>/{totalPages}</span>
                             {isLoading && <span className="text-[#5c9a38] animate-pulse ml-2">Đang tải...</span>}
                        </div>
                        <div className="flex items-center space-x-1 order-1 sm:order-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 disabled:opacity-40"
                            >
                                &laquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-2 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <span className="sm:inline hidden">Trước</span>
                                <span className="sm:hidden">&lsaquo;</span>
                            </button>

                            <div className="hidden md:flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 flex items-center justify-center rounded font-medium transition-all ${currentPage === pageNum ? 'bg-[#5c9a38] text-white border-[#5c9a38]' : 'hover:bg-gray-100 border border-gray-200 dark:border-neutral-800'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
                                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-2 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <span className="sm:inline hidden">Sau</span>
                                <span className="sm:hidden">&rsaquo;</span>
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 disabled:opacity-40"
                            >
                                &raquo;
                            </button>
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
