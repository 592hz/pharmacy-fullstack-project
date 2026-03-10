import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface AddCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (category: any) => void
    onEdit: (category: any) => void
    initialData?: any
}

export default function AddCategoryModal({
    isOpen,
    onClose,
    onAdd,
    onEdit,
    initialData
}: AddCategoryModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!isOpen) {
            setErrors({})
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const newErrors: Record<string, string> = {}

        const name = formData.get("name") as string
        const type = formData.get("type") as string
        const amountString = formData.get("amount") as string
        const amount = amountString ? parseInt(amountString.replace(/,/g, ''), 10) : 0

        if (!name) newErrors.name = "Vui lòng nhập tên nhóm"
        if (!amount || amount <= 0) newErrors.amount = "Vui lòng nhập số tiền hợp lệ"

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const categoryData = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            name: name,
            type: type as "Thu" | "Chi",
            amount: amount,
            notes: formData.get("notes") as string,
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
                        onClick={onClose}
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
                                    <input
                                        type="number"
                                        name="amount"
                                        defaultValue={initialData?.amount || ""}
                                        className={`w-full rounded-md border ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-neutral-700 focus:ring-[#65a34e]'} bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 dark:bg-neutral-950 dark:text-white transition-shadow`}
                                        placeholder="VD: 1500000"
                                    />
                                    {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Ghi chú
                                </label>
                                <textarea
                                    name="notes"
                                    defaultValue={initialData?.notes || ""}
                                    rows={4}
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
