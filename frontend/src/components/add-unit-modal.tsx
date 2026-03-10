import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"

interface AddUnitModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd?: (unit: any) => void
    onEdit?: (unit: any) => void
    initialData?: any
}

export default function AddUnitModal({ isOpen, onClose, onAdd, onEdit, initialData }: AddUnitModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Clear errors when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) setErrors({})
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string

        const newErrors: Record<string, string> = {}

        if (!name?.trim()) newErrors.name = 'Vui lòng nhập tên đơn vị tính'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error("Vui lòng kiểm tra lại thông tin!")
            return
        }

        const unitData = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            name: name.trim(),
        }

        if (initialData && onEdit) {
            onEdit(unitData)
        } else if (onAdd) {
            onAdd(unitData)
        }

        setErrors({})
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-neutral-900 flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {initialData ? 'Cập nhật đơn vị tính' : 'Thêm mới đơn vị tính'}
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Tên đơn vị tính <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="name"
                                defaultValue={initialData?.name || ''}
                                type="text"
                                placeholder="Ví dụ: Vỉ, Hộp, Chai"
                                className={`w-full rounded border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`}
                            />
                            {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-4 dark:border-neutral-800">
                        <button type="submit" className="flex items-center justify-center gap-1.5 rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-600 focus:ring-offset-2">
                            Lưu lại
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center justify-center gap-1.5 rounded bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                        >
                            Thoát
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
