import { useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { type ProductCategory } from "@/lib/schemas"

interface AddProductCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd?: (category: ProductCategory) => void
    onEdit?: (category: ProductCategory) => void
    initialData?: ProductCategory | null
}

export default function AddProductCategoryModal({ isOpen, onClose, onAdd, onEdit, initialData }: AddProductCategoryModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleClose = () => {
        setErrors({})
        onClose()
    }

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const code = formData.get('code') as string
        const name = formData.get('name') as string
        const notes = formData.get('notes') as string

        const newErrors: Record<string, string> = {}

        if (!name?.trim()) newErrors.name = 'Vui lòng nhập tên nhóm sản phẩm'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error("Vui lòng kiểm tra lại các trường thông tin không hợp lệ")
            return
        }

        const categoryData: ProductCategory = {
            id: initialData?.id,
            code: initialData?.code || code || undefined,
            name,
            notes,
        }

        if (initialData && onEdit) {
            onEdit(categoryData)
        } else if (onAdd) {
            onAdd(categoryData)
        }

        setErrors({})
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-neutral-900 flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {initialData ? 'Cập nhật nhóm sản phẩm' : 'Thêm mới nhóm sản phẩm'}
                        </h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-y-6">
                            {/* Mã nhóm */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mã nhóm
                                </label>
                                <input name="code" defaultValue={initialData?.code || ''} type="text" placeholder="Mã nhóm (để trống sẽ tự tạo)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>

                            {/* Tên nhóm */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tên nhóm <span className="text-red-500">*</span>
                                </label>
                                <input name="name" defaultValue={initialData?.name || ''} type="text" placeholder="Tên nhóm sản phẩm" className={`w-full rounded-md border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Ghi chú */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                                <textarea name="notes" defaultValue={initialData?.notes || ''} placeholder="Ghi chú" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" rows={3}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-4 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700 dark:hover:bg-neutral-700"
                        >
                            <X size={16} /> Thoát
                        </button>
                        <button type="submit" className="flex items-center justify-center gap-2 rounded-md bg-[#5c9a38] px-5 py-2 text-sm font-medium text-white hover:bg-[#5c9a38] focus:ring-2 focus:ring-[#5c9a38] focus:ring-offset-2">
                            ✓ Lưu lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
