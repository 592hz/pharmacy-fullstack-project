import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Download, Upload, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText } from "lucide-react"
import { toast } from "sonner"
import { type ExportOrder } from "@/lib/schemas"
import { exportSlipService } from "@/services/export-slip.service"
import { getErrorMessage } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

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
    // const ss = String(d.getSeconds()).padStart(2, "0")
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export default function ExportManagePage() {
    const navigate = useNavigate()
    const [slips, setSlips] = useState<ExportOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    const fetchSlips = async () => {
        setIsLoading(true)
        try {
            const data = await exportSlipService.getAll()
            setSlips(data)
        } catch (error: unknown) {
            toast.error("Không thể tải danh sách phiếu xuất: " + getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    // ── Filter state ─────────────────────────────────────────────────────────
    const [dateFilterType, setDateFilterType] = useState<"Ngày" | "Từ ngày" | "Tháng" | "Quý" | "Năm">("Năm")
    const [filterDate, setFilterDate] = useState<string>(() => new Date().toISOString().split("T")[0])
    const [filterStartDate, setFilterStartDate] = useState<string>("")
    const [filterEndDate, setFilterEndDate] = useState<string>("")
    const [filterMonth, setFilterMonth] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"))
    const [filterQuarter, setFilterQuarter] = useState<string>("1")
    const [filterYear, setFilterYear] = useState<string>(() => new Date().getFullYear().toString())
    const [filterKeyword, setFilterKeyword] = useState("")
    const debouncedFilterKeyword = useDebounce(filterKeyword, 300)
    const [filterPrescription, setFilterPrescription] = useState(false)

    // ── Pagination state ─────────────────────────────────────────────────────
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    useEffect(() => {
        fetchSlips()
    }, [])

    useEffect(() => {
        setPage(1)
    }, [dateFilterType, filterYear, filterMonth, filterDate, filterStartDate, filterEndDate, filterQuarter, debouncedFilterKeyword, filterPrescription])

    // ── Delete confirm state ─────────────────────────────────────────────────
    const [slipToDelete, setSlipToDelete] = useState<ExportOrder | null>(null)
    const [deleteStep, setDeleteStep] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    // ── Derived filtered + paginated data ────────────────────────────────────
    const filtered = useMemo(() => {
        return slips.filter((s) => {
            const orderDate = new Date(s.exportDate)
            const year = orderDate.getFullYear().toString()
            const month = String(orderDate.getMonth() + 1).padStart(2, "0")
            const date = orderDate.toISOString().split("T")[0]
            const quarter = Math.floor(orderDate.getMonth() / 3) + 1

            // Advanced Date Filtering
            if (dateFilterType === "Năm") {
                if (filterYear && year !== filterYear) return false
            } else if (dateFilterType === "Tháng") {
                if (filterYear && year !== filterYear) return false
                if (filterMonth && month !== filterMonth) return false
            } else if (dateFilterType === "Ngày") {
                if (filterDate && date !== filterDate) return false
            } else if (dateFilterType === "Từ ngày") {
                if (filterStartDate && date < filterStartDate) return false
                if (filterEndDate && date > filterEndDate) return false
            } else if (dateFilterType === "Quý") {
                if (filterYear && year !== filterYear) return false
                if (filterQuarter && quarter.toString() !== filterQuarter) return false
            }

            const kw = debouncedFilterKeyword.toLowerCase()
            if (kw) {
                const matchesCustomer = s.customerName.toLowerCase().includes(kw)
                const matchesId = (s.id || "").toLowerCase().includes(kw)
                const matchesPhone = (s.customerPhone || "").toLowerCase().includes(kw)
                const matchesItems = s.items?.some(item => 
                    item.name.toLowerCase().includes(kw) || 
                    item.code.toLowerCase().includes(kw)
                )

                if (!matchesCustomer && !matchesId && !matchesPhone && !matchesItems) {
                    return false
                }
            }

            if (filterPrescription && !s.isPrescription) return false

            return true
        })
    }, [slips, dateFilterType, filterYear, filterMonth, filterDate, filterStartDate, filterEndDate, filterQuarter, debouncedFilterKeyword, filterPrescription])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSearch = () => {
        setPage(1)
    }

    const handleView = (id: string) => {
        navigate(`/export-manage/${id}`)
    }

    const handleDeleteClick = (slip: ExportOrder) => {
        setSlipToDelete(slip)
        setDeleteStep(1)
    }

    const confirmDelete = async () => {
        if (deleteStep === 1) {
            setDeleteStep(2)
            return
        }
        if (deleteStep === 2 && slipToDelete && slipToDelete.id) {
            setIsDeleting(true)
            try {
                await exportSlipService.delete(slipToDelete.id)
                toast.success(`Đã xóa phiếu xuất ${slipToDelete.id}`)
                setSlipToDelete(null)
                setDeleteStep(0)
                fetchSlips()
            } catch (error: unknown) {
                toast.error("Không thể xóa phiếu xuất: " + getErrorMessage(error))
            } finally {
                setIsDeleting(false)
            }
        }
    }

    const cancelDelete = () => {
        setSlipToDelete(null)
        setDeleteStep(0)
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f4f4] dark:bg-neutral-900">
                <div className="w-12 h-12 border-4 border-[#5c9a38] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500">Đang tải danh sách phiếu xuất...</p>
            </div>
        )
    }

    return (
        <div className="p-4 bg-[#f4f4f4] dark:bg-neutral-900 min-h-screen">
            <div className="bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 shadow-sm overflow-hidden p-6">
                <h1 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                    Danh sách phiếu xuất
                </h1>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filter Toggle for Mobile */}
                    <div className="lg:hidden mb-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded-md text-sm font-medium w-full justify-center"
                        >
                            <Plus className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-45' : ''}`} />
                            <span>{showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc tìm kiếm"}</span>
                        </button>
                    </div>

                    {/* ── Left Sidebar ───────────────────────────────────── */}
                    <div className={`w-full lg:w-64 shrink-0 flex flex-col gap-4 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
                        {/* Date Filter Type Selection */}
                        <section className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Lọc theo</label>
                            <select
                                value={dateFilterType}
                                onChange={(e) => setDateFilterType(e.target.value as "Ngày" | "Từ ngày" | "Tháng" | "Quý" | "Năm")}
                                className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm outline-none font-semibold focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                            >
                                <option value="Ngày">Ngày</option>
                                <option value="Từ ngày">Từ ngày</option>
                                <option value="Tháng">Tháng</option>
                                <option value="Quý">Quý</option>
                                <option value="Năm">Năm</option>
                            </select>
                        </section>

                        {/* Dynamic Date Inputs based on Type */}
                        <section className="flex flex-col gap-2">
                            {dateFilterType === "Ngày" && (
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                                />
                            )}
                            {dateFilterType === "Từ ngày" && (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="date"
                                        value={filterStartDate}
                                        onChange={(e) => setFilterStartDate(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                                    />
                                    <input
                                        type="date"
                                        value={filterEndDate}
                                        onChange={(e) => setFilterEndDate(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                                    />
                                </div>
                            )}
                            {dateFilterType === "Tháng" && (
                                <div className="flex gap-2">
                                    <select
                                        value={filterMonth}
                                        onChange={(e) => setFilterMonth(e.target.value)}
                                        className="flex-1 border border-gray-300 dark:border-neutral-700 rounded px-1 py-1 text-xs outline-none bg-transparent"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => (
                                            <option key={m} value={m}>Tháng {m}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        placeholder="Năm"
                                        className="w-20 border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                                    />
                                </div>
                            )}
                            {dateFilterType === "Quý" && (
                                <div className="flex gap-2">
                                    <select
                                        value={filterQuarter}
                                        onChange={(e) => setFilterQuarter(e.target.value)}
                                        className="flex-1 border border-gray-300 dark:border-neutral-700 rounded px-1 py-1 text-xs outline-none bg-transparent"
                                    >
                                        <option value="1">Quý 1</option>
                                        <option value="2">Quý 2</option>
                                        <option value="3">Quý 3</option>
                                        <option value="4">Quý 4</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        placeholder="Năm"
                                        className="w-20 border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                                    />
                                </div>
                            )}
                            {dateFilterType === "Năm" && (
                                <input
                                    type="text"
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    placeholder="Năm"
                                    className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                                />
                            )}
                        </section>

                        <section className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Tìm KH - Số phiếu - SĐT - Sản phẩm</label>
                            <input
                                type="text"
                                value={filterKeyword}
                                onChange={(e) => setFilterKeyword(e.target.value)}
                                placeholder="Nhập từ khóa..."
                                className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#5c9a38] bg-transparent"
                            />
                        </section>

                        <section className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Loại phiếu</label>
                            <select
                                className="w-full border border-gray-300 dark:border-neutral-700 rounded px-2 py-1.5 text-sm outline-none bg-transparent"
                                value={filterPrescription ? "Bán theo đơn" : "Phiếu xuất"}
                                onChange={(e) => setFilterPrescription(e.target.value === "Bán theo đơn")}
                            >
                                <option value="Phiếu xuất">Phiếu xuất</option>
                                <option value="Bán theo đơn">Bán theo đơn</option>
                            </select>
                        </section>

                        <button
                            onClick={handleSearch}
                            className="w-full bg-[#5c9a38] hover:bg-[#4d822f] text-white py-2 rounded font-bold text-sm shadow-sm transition-colors"
                        >
                            Tìm kiếm
                        </button>
                    </div>

                    {/* ── Main Content Area ──────────────────────────────── */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={() => navigate("/export-manage/create")}
                                className="bg-[#5c9a38] hover:bg-[#4d822f] text-white px-4 py-1.5 rounded flex items-center gap-2 text-sm font-bold shadow-sm transition-all active:scale-95"
                            >
                                <Plus size={16} /> Bán Hàng
                            </button>
                            <button className="p-2 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 bg-[#5c9a38] text-white">
                                <Download size={16} />
                            </button>
                            <button className="p-2 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 bg-[#eab308] text-white">
                                <Upload size={16} />
                            </button>
                            <button className="p-2 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 bg-[#5c9a38] text-white">
                                <Plus size={16} />
                            </button>
                            <button className="p-2 border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 bg-[#5c9a38] text-white">
                                <FileText size={16} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="border border-gray-200 dark:border-neutral-800 rounded overflow-hidden">
                            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                                <thead className="bg-[#f8f9fa] dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 font-bold text-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-1 py-3 border-r border-gray-200 dark:border-neutral-800 w-20 text-center uppercase text-[10px]">#</th>
                                        <th className="px-1 py-3 border-r border-gray-200 dark:border-neutral-800 w-10 text-center uppercase text-[10px] hidden sm:table-cell">STT</th>
                                        <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-800 uppercase text-[10px]">Số phiếu</th>
                                        <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-800 uppercase text-[10px]">Ngày xuất</th>
                                        <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-800 uppercase text-[10px] min-w-[120px]">Khách hàng</th>
                                        <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-800 uppercase text-[10px] hidden md:table-cell">Triệu chứng</th>
                                        <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-800 text-right uppercase text-[10px]">Tổng cộng</th>
                                        <th className="px-2 py-3 border-r border-gray-200 dark:border-neutral-800 uppercase text-[10px] hidden lg:table-cell">Người tạo</th>
                                        <th className="px-2 py-3 uppercase text-[10px] hidden xl:table-cell">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.map((slip, idx) => (
                                        <tr key={slip.id || idx} className="hover:bg-gray-50 dark:hover:bg-neutral-800/20 items-center border-b border-gray-100 dark:border-neutral-800 text-[11px] sm:text-xs">
                                            <td className="px-1 py-2 border-r border-gray-200 dark:border-neutral-800 flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleView(slip.id!)}
                                                    className="bg-[#5c9a38] text-white px-2 py-0.5 rounded text-[9px] font-bold hover:bg-[#4d822f]"
                                                >
                                                    Xem
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(slip)}
                                                    className="bg-red-500 text-white px-2 py-0.5 rounded text-[9px] font-bold hover:bg-red-600"
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                            <td className="px-1 py-2 border-r border-gray-200 dark:border-neutral-800 text-center hidden sm:table-cell text-gray-400">
                                                {(page - 1) * pageSize + idx + 1}
                                            </td>
                                            <td className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-blue-600 font-medium hover:underline cursor-pointer" onClick={() => handleView(slip.id!)}>
                                                {slip.id}
                                            </td>
                                            <td className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-gray-500">
                                                {fmtDate(slip.exportDate)}
                                            </td>
                                            <td className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{slip.customerName}</span>
                                                    {slip.isPrescription && <span className="text-[9px] text-red-600 font-black uppercase italic leading-none">Bán theo đơn</span>}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-red-500 italic font-medium truncate max-w-[120px] hidden md:table-cell" title={slip.symptoms}>
                                                {slip.symptoms}
                                            </td>
                                            <td className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-right font-bold text-gray-900 dark:text-gray-100">
                                                {vnd(slip.totalAmount)}
                                            </td>
                                            <td className="px-2 py-2 border-r border-gray-200 dark:border-neutral-800 text-gray-500 hidden lg:table-cell">
                                                {slip.createdBy}
                                            </td>
                                            <td className="px-2 py-2 text-gray-400 italic truncate max-w-[150px] hidden xl:table-cell">
                                                {slip.notes}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer / Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 px-2">
                            <div className="text-xs text-gray-500">
                                Tổng số bản ghi: <span className="font-bold">{filtered.length}</span> — Tổng số trang: <span className="font-bold">{totalPages}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button onClick={() => goTo(1)} disabled={page === 1} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:bg-gray-100">
                                    <ChevronsLeft size={14} />
                                </button>
                                <button onClick={() => goTo(page - 1)} disabled={page === 1} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:bg-gray-100">
                                    <ChevronLeft size={14} />
                                </button>

                                {pageNumbers.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => goTo(p)}
                                        className={`w-8 h-8 flex items-center justify-center border rounded text-xs transition-colors ${p === page ? "bg-[#5c9a38] text-white border-[#5c9a38]" : "bg-white dark:bg-neutral-800 border-gray-200 hover:bg-gray-50"}`}
                                    >
                                        {p}
                                    </button>
                                ))}

                                <button onClick={() => goTo(page + 1)} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:bg-gray-100">
                                    <ChevronRight size={14} />
                                </button>
                                <button onClick={() => goTo(totalPages)} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:bg-gray-100">
                                    <ChevronsRight size={14} />
                                </button>

                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs outline-none ml-2"
                                >
                                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
            {slipToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-neutral-900 p-6 text-center border dark:border-neutral-800">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <span className="text-red-600 text-xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Xác nhận xóa phiếu xuất
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            {deleteStep === 1
                                ? `Bạn có chắc chắn muốn xóa phiếu xuất "${slipToDelete.id}"? Hành động này không thể hoàn tác.`
                                : `Vui lòng xác nhận LẦN CUỐI. Bạn thực sự muốn xóa phiếu xuất "${slipToDelete.id}"?`}
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
                                disabled={isDeleting}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
                            >
                                {isDeleting ? "Đang xóa..." : (deleteStep === 1 ? "Xóa bỏ" : "Xác nhận xóa")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
