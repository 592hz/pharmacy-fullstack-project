import { parseFloatSafe } from "@/lib/utils"
import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { type Category, categorySchema } from "@/lib/schemas"
import { NumericInput } from "@/components/ui/numeric-input"

// Helper functions for date conversion
const formatDateToVN = (dateStr?: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
}

const parseVNDateToISO = (vnDate: string) => {
    if (!vnDate) return ""
    const parts = vnDate.split(/[-/]/)
    if (parts.length !== 3) return vnDate
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${year}-${month}-${day}`
}

interface AddCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (category: Category) => void
    onEdit: (category: Category) => void
    initialData?: Category | null
}

export default function AddCategoryModal({
    isOpen,
    onClose,
    onAdd,
    onEdit,
    initialData
}: AddCategoryModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [dateValue, setDateValue] = useState("")

    useEffect(() => {
        if (isOpen) {
            const initialDate = initialData?.date || new Date().toISOString().split('T')[0]
            setDateValue(formatDateToVN(initialDate))
        }
    }, [isOpen, initialData])

    const handleClose = () => {
        setErrors({})
        onClose()
    }

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const newErrors: Record<string, string> = {}

        const name = (formData.get("name") as string).trim()
        const type = formData.get("type") as string
        const amountString = formData.get("amount") as string
        const amount = parseFloatSafe(amountString)
        const vnDate = dateValue
        const isoDate = parseVNDateToISO(vnDate)

        // 1. Basic Schema Validation (Name, Type, Amount)
        const validation = categorySchema.safeParse({
            name,
            type,
            amount,
            notes: formData.get("notes") as string,
            date: isoDate
        })

        if (!validation.success) {
            validation.error.issues.forEach(issue => {
                const path = issue.path[0] as string
                newErrors[path] = issue.message
            });
        }
        
        // 2. Strict Date Validation (Check if real date exists, e.g. no 31/02)
        const dateRegex = /^(\d{1,2})[/](\d{1,2})[/](\d{4})$/
        if (!vnDate || !dateRegex.test(vnDate)) {
            newErrors.date = "Ngày không hợp lệ (định dạng: dd/mm/yyyy)"
        } else {
            const parts = vnDate.split('/')
            const d = parseInt(parts[0], 10)
            const m = parseInt(parts[1], 10) - 1
            const y = parseInt(parts[2], 10)
            const checkDate = new Date(y, m, d)
            if (checkDate.getFullYear() !== y || checkDate.getMonth() !== m || checkDate.getDate() !== d) {
                newErrors.date = "Ngày tháng này không có trong lịch!"
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const categoryData: Category = {
            id: initialData?.id,
            name: name,
            type: type as "Thu" | "Chi",
            amount: amount,
            notes: formData.get("notes") as string,
            date: isoDate,
        }

        if (initialData) {
            onEdit(categoryData)
        } else {
            onAdd(categoryData)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
            <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 p-4 md:p-5">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {initialData ? "Sửa nhóm thu chi" : "Thêm mới nhóm thu chi"}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-300 transition-colors"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" id="categoryForm">
                    <div className="p-4 md:p-5 overflow-y-auto space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tên nhóm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue={initialData?.name || ""}
                                    className={`w-full rounded-md border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-neutral-700 focus:ring-[#65a34e]'} bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 dark:bg-neutral-950 dark:text-white transition-shadow`}
                                    placeholder="Nhập tên nhóm thu chi"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Loại <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="type"
                                        defaultValue={initialData?.type || "Chi"}
                                        className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#65a34e] dark:bg-neutral-950 dark:text-white transition-shadow"
                                    >
                                        <option value="Chi">Chi (Expense)</option>
                                        <option value="Thu">Thu (Income)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Số tiền <span className="text-red-500">*</span>
                                    </label>
                                    <NumericInput
                                        name="amount"
                                        value={initialData?.amount || 0}
                                        className={`w-full rounded-md border ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-neutral-700 focus:ring-[#65a34e]'} bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 dark:bg-neutral-950 dark:text-white transition-shadow`}
                                        placeholder="VD: 1.500.000"
                                    />
                                    {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Ngày (dd/mm/yyyy) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="date"
                                        value={dateValue}
                                        onChange={(e) => setDateValue(e.target.value)}
                                        placeholder="VD: 31/12/2025"
                                        className={`w-full rounded-md border ${errors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-neutral-700 focus:ring-[#65a34e]'} bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 dark:bg-neutral-950 dark:text-white transition-shadow font-mono`}
                                    />
                                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Ghi chú
                                </label>
                                <textarea
                                    name="notes"
                                    defaultValue={initialData?.notes || ""}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#65a34e] dark:bg-neutral-950 dark:text-white transition-shadow resize-none"
                                    placeholder="Nhập ghi chú"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 dark:border-neutral-800 p-4 md:p-5 flex justify-end gap-3 bg-gray-50 dark:bg-neutral-900/50 rounded-b-xl mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#65a34e] focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-[#65a34e] px-4 py-2 text-sm font-medium text-white hover:bg-[#589043] focus:outline-none focus:ring-2 focus:ring-[#65a34e] focus:ring-offset-2 transition-colors flex items-center shadow-sm"
                        >
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
