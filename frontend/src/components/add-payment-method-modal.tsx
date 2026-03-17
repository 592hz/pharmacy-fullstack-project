import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { paymentMethodSchema } from "@/lib/schemas"

interface AddPaymentMethodModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd?: (paymentMethod: any) => void
    onEdit?: (paymentMethod: any) => void
    initialData?: any
}

export default function AddPaymentMethodModal({ isOpen, onClose, onAdd, onEdit, initialData }: AddPaymentMethodModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Clear errors when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) setErrors({})
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const rawData = Object.fromEntries(formData)
        const result = paymentMethodSchema.safeParse({
            ...rawData,
            isDefault: formData.get('isDefault') === 'on'
        })
        
        if (!result.success) {
            const newErrors: Record<string, string> = {}
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string
                newErrors[path] = issue.message
            })
            setErrors(newErrors)
            toast.error("Vui lòng kiểm tra lại thông tin")
            return
        }

        const paymentMethodData = {
            ...result.data,
            id: initialData?.id || `PM${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        }

        if (initialData && onEdit) {
            onEdit(paymentMethodData)
        } else if (onAdd) {
            onAdd(paymentMethodData)
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
                            {initialData ? 'Cập nhật phương thức thanh toán' : 'Thêm mới phương thức thanh toán'}
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
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-y-6">
                            {/* Tên phương thức thanh toán */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tên phương thức thanh toán <span className="text-red-500">*</span>
                                </label>
                                <input name="name" defaultValue={initialData?.name || ''} type="text" placeholder="Tên phương thức thanh toán" className={`w-full rounded-md border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Ghi chú */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                                <textarea name="notes" defaultValue={initialData?.notes || ''} placeholder="Ghi chú" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" rows={3}></textarea>
                            </div>

                            {/* Checkboxes */}
                            <div className="flex items-center pb-2 gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input name="isDefault" type="checkbox" defaultChecked={!!initialData?.isDefault} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mặc định</span>
                                </label>
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
                        <button type="submit" className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            ✓ Lưu lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
