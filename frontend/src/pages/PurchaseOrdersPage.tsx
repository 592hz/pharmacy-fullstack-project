import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Download, Upload, SlidersHorizontal, FileText, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { toast } from "sonner"
import { mockPurchaseOrders, type PurchaseOrder } from "@/lib/mock-data"

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const vnd = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(n)

const fmtDate = (iso: string) => {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, "0")
    const min = String(d.getMinutes()).padStart(2, "0")
    const ss = String(d.getSeconds()).padStart(2, "0")
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`
}



export default function PurchaseOrdersPage() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders)

    // ── Filter state ─────────────────────────────────────────────────────────
    const [filterYear, setFilterYear] = useState<string>("2026")
    const [filterKeyword, setFilterKeyword] = useState("")
    const [filterProduct, setFilterProduct] = useState("")
    const [filterType, setFilterType] = useState<"Phiếu nhập" | "Phiếu xuất" | "">("")

    // ── Pagination state ─────────────────────────────────────────────────────
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // ── Delete confirm ───────────────────────────────────────────────────────
    const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null)
    const [deleteStep, setDeleteStep] = useState(0)

    // ── Derived filtered + paginated data ────────────────────────────────────
    const filtered = useMemo(() => {
        return orders.filter((o) => {
            const year = new Date(o.importDate).getFullYear().toString()
            if (filterYear && year !== filterYear) return false

            const kw = filterKeyword.toLowerCase()
            if (
                kw &&
                !o.supplierName.toLowerCase().includes(kw) &&
                !o.id.toLowerCase().includes(kw) &&
                !o.invoiceNumber.toLowerCase().includes(kw)
            )
                return false

            return true
        })
    }, [orders, filterYear, filterKeyword])

    // Totals for the summary row
    const totals = useMemo(
        () =>
            filtered.reduce(
                (acc, o) => ({
                    totalAmount: acc.totalAmount + o.totalAmount,
                    discount: acc.discount + o.discount,
                    vat: acc.vat + o.vat,
                    grandTotal: acc.grandTotal + o.grandTotal,
                }),
                { totalAmount: 0, discount: 0, vat: 0, grandTotal: 0 }
            ),
        [filtered]
    )

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSearch = () => {
        setPage(1)
    }

    const handleDeleteClick = (order: PurchaseOrder) => {
        setOrderToDelete(order)
        setDeleteStep(1)
    }

    const confirmDelete = () => {
        if (deleteStep === 1) { setDeleteStep(2); return }
        if (deleteStep === 2 && orderToDelete) {
            setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id))
            toast.success(`Đã xóa phiếu nhập ${orderToDelete.id}!`)
            setOrderToDelete(null)
            setDeleteStep(0)
        }
    }

    const cancelDelete = () => { setOrderToDelete(null); setDeleteStep(0) }

    const handleView = (order: PurchaseOrder) => {
        navigate(`/purchase-orders/${order.id}`)
    }



    // ── Pagination helpers ───────────────────────────────────────────────────
    const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

    const pageNumbers = useMemo(() => {
        const pages: number[] = []
        const delta = 2
        for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
            pages.push(i)
        }
        return pages
    }, [page, totalPages])

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gray-50 dark:bg-neutral-950 min-h-screen">
            <div className="rounded-xl border bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">

                {/* ── Page Header ─────────────────────────────────────────────── */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Danh sách phiếu nhập</h1>
                </div>

                <div className="flex">
                    {/* ── Left: Filter Panel ───────────────────────────────────── */}
                    <div className="w-44 shrink-0 border-r border-gray-200 dark:border-neutral-800 p-3 flex flex-col gap-2 bg-gray-50 dark:bg-neutral-900/50">
                        {/* Năm */}
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Năm</label>
                            <input
                                type="text"
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                placeholder="Năm"
                                className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            />
                        </div>

                        {/* NCC / Số phiếu / Số hóa đơn */}
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Tìm NCC · Số phiếu · Số hóa đơn</label>
                            <input
                                type="text"
                                value={filterKeyword}
                                onChange={(e) => setFilterKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="Nhập từ khóa..."
                                className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            />
                        </div>

                        {/* Tên sản phẩm */}
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Tên sản phẩm, mã vạch</label>
                            <input
                                type="text"
                                value={filterProduct}
                                onChange={(e) => setFilterProduct(e.target.value)}
                                placeholder="Tên sản phẩm..."
                                className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            />
                        </div>

                        {/* Loại phiếu */}
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Loại phiếu</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            >
                                <option value="">Phiếu nhập</option>
                                <option value="Phiếu nhập">Phiếu nhập</option>
                                <option value="Phiếu xuất">Phiếu xuất</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSearch}
                            className="mt-1 w-full bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white py-1.5 rounded text-sm font-medium transition-colors"
                        >
                            Tìm kiếm
                        </button>
                    </div>

                    {/* ── Right: Main Content ──────────────────────────────────── */}
                    <div className="flex-1 flex flex-col overflow-hidden p-4">

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <button
                                onClick={() => navigate("/purchase-orders/create")}
                                className="flex items-center gap-1.5 bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                                <Plus size={15} />
                                Phiếu nhập
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-8 h-8 rounded transition-colors" title="Export Excel">
                                <Download size={15} />
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-8 h-8 rounded transition-colors" title="Import">
                                <Upload size={15} />
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-8 h-8 rounded transition-colors" title="Cấu hình cột">
                                <SlidersHorizontal size={15} />
                            </button>
                            <button className="flex items-center justify-center bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white w-8 h-8 rounded transition-colors" title="In / Xuất file">
                                <FileText size={15} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-neutral-800 flex-1">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-[11px] text-gray-700 uppercase bg-gray-50 dark:bg-neutral-800/50 dark:text-gray-300 border-b border-gray-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 w-8"></th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 w-8 text-center">STT</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800">Số phiếu</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800">Ngày nhập</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 min-w-[160px]">Nhà cung cấp</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-right">Tổng tiền</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-right">Chiết khấu</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-right">VAT</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-right font-bold text-green-700 dark:text-green-400">Tổng cộng</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800">Ghi chú</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800">Người tạo</th>
                                        <th className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800">Số hóa đơn</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                    {/* Totals row */}
                                    <tr className="bg-blue-50 dark:bg-blue-900/10 font-semibold text-gray-700 dark:text-gray-300">
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800" />
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800" />
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800" />
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800">
                                            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">TỔNG CỘNG</span>
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800" />
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right text-blue-700 dark:text-blue-300">
                                            {vnd(totals.totalAmount)}
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right text-blue-700 dark:text-blue-300">
                                            {vnd(totals.discount)}
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right text-blue-700 dark:text-blue-300">
                                            {vnd(totals.vat)}
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right text-green-700 dark:text-green-400 font-bold">
                                            {vnd(totals.grandTotal)}
                                        </td>
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800" />
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800" />
                                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800" />
                                    </tr>

                                    {paged.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="px-6 py-8 text-center text-gray-400 text-sm">
                                                Không có dữ liệu phù hợp
                                            </td>
                                        </tr>
                                    ) : (
                                        paged.map((order, idx) => (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-gray-50 dark:hover:bg-neutral-800/40 text-gray-700 dark:text-gray-300 text-[13px]"
                                            >
                                                {/* Action buttons */}
                                                <td className="px-1.5 py-1.5 border-r border-gray-200 dark:border-neutral-800 space-x-1 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleView(order)}
                                                        title="Xem"
                                                        className="bg-[#5c9a38] hover:bg-[#5c9a38]/90 text-white px-1.5 py-1 rounded text-[11px] font-semibold"
                                                    >
                                                        Xem
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(order)}
                                                        title="Xóa"
                                                        className="bg-red-500 hover:bg-red-600 text-white px-1.5 py-1 rounded text-[11px] font-semibold"
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>

                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-center text-gray-500">
                                                    {(page - 1) * pageSize + idx + 1}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                                                    onClick={() => handleView(order)}
                                                >
                                                    {order.id}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800">
                                                    {fmtDate(order.importDate)}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 max-w-[200px] whitespace-normal break-words text-xs leading-snug">
                                                    {order.supplierName}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right">
                                                    {vnd(order.totalAmount)}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right">
                                                    {order.discount > 0 ? vnd(order.discount) : <span className="text-gray-400">0</span>}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right">
                                                    {vnd(order.vat)}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-right font-semibold text-green-700 dark:text-green-400">
                                                    {vnd(order.grandTotal)}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-xs text-gray-500">
                                                    {order.notes || ""}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-xs">
                                                    {order.createdBy}
                                                </td>
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-neutral-800 text-xs text-gray-500">
                                                    {order.id}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ───────────────────────────────────────── */}
                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-2">
                            <div>
                                Tổng số bản ghi: <strong className="text-gray-700 dark:text-gray-200">{filtered.length}</strong>
                                &nbsp;–&nbsp;Tổng số trang: <strong className="text-gray-700 dark:text-gray-200">{totalPages}</strong>
                            </div>

                            <div className="flex items-center gap-1">
                                {/* First */}
                                <button
                                    onClick={() => goTo(1)}
                                    disabled={page === 1}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40"
                                >
                                    <ChevronsLeft size={14} />
                                </button>
                                {/* Prev */}
                                <button
                                    onClick={() => goTo(page - 1)}
                                    disabled={page === 1}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40"
                                >
                                    <ChevronLeft size={14} />
                                </button>

                                {pageNumbers.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => goTo(p)}
                                        className={`w-7 h-7 flex items-center justify-center rounded text-sm font-medium transition-colors ${p === page
                                            ? "bg-[#5c9a38] text-white"
                                            : "hover:bg-gray-100 dark:hover:bg-neutral-800"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}

                                {/* Next */}
                                <button
                                    onClick={() => goTo(page + 1)}
                                    disabled={page === totalPages}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40"
                                >
                                    <ChevronRight size={14} />
                                </button>
                                {/* Last */}
                                <button
                                    onClick={() => goTo(totalPages)}
                                    disabled={page === totalPages}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40"
                                >
                                    <ChevronsRight size={14} />
                                </button>

                                {/* Page size */}
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                                    className="ml-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-sm px-2 py-1 h-7 focus:ring-green-500 focus:border-green-500"
                                >
                                    {PAGE_SIZE_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
            {orderToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-neutral-900 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa phiếu nhập
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {deleteStep === 1
                                ? `Bạn có chắc chắn muốn xóa phiếu nhập "${orderToDelete.id}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa phiếu nhập "${orderToDelete.id}"?`}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={cancelDelete}
                                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                {deleteStep === 1 ? "Xóa bỏ" : "Xác nhận xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
