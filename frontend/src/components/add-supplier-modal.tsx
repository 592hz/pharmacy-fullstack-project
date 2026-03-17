import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { supplierSchema } from "@/lib/schemas"

interface AddSupplierModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd?: (supplier: any) => void
    onEdit?: (supplier: any) => void
    initialData?: any
}

export default function AddSupplierModal({ isOpen, onClose, onAdd, onEdit, initialData }: AddSupplierModalProps) {
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
        const result = supplierSchema.safeParse({
            ...rawData,
            isNational: formData.get('isNational') === 'on',
            isDefaultImport: formData.get('isDefaultImport') === 'on',
            debt: initialData?.debt || 0
        })
        
        if (!result.success) {
            const newErrors: Record<string, string> = {}
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string
                newErrors[path] = issue.message
            })
            setErrors(newErrors)
            toast.error("Vui lòng kiểm tra lại các trường thông tin")
            return
        }

        const supplierData = result.data

        if (initialData && onEdit) {
            onEdit(supplierData)
        } else if (onAdd) {
            onAdd(supplierData)
        } else {
            console.log("Submit success (no handler):", supplierData)
        }

        setErrors({})
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
            <div className="relative w-full max-w-6xl min-h-[500px] rounded-lg bg-white shadow-xl dark:bg-neutral-900 flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {initialData ? 'Cập nhật nhà cung cấp' : 'Thêm mới nhà cung cấp'}
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
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 pb-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                            {/* Mã nhà cung cấp */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mã nhà cung cấp <span className="text-red-500">*</span>
                                </label>
                                <input name="id" defaultValue={initialData?.id || ''} type="text" placeholder="NCC00023" className={`w-full rounded-md border ${errors.id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.id && <p className="text-xs text-red-500">{errors.id}</p>}
                            </div>
                            {/* Tên nhà cung cấp */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tên nhà cung cấp <span className="text-red-500">*</span>
                                </label>
                                <input name="name" defaultValue={initialData?.name || ''} type="text" placeholder="Tên nhà cung cấp" className={`w-full rounded-md border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            {/* Địa chỉ */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
                                <input name="address" defaultValue={initialData?.address || ''} type="text" placeholder="Địa chỉ" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Mã số thuế */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mã số thuế</label>
                                <input name="taxCode" defaultValue={initialData?.taxCode || ''} type="text" placeholder="Mã số thuế" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Điện thoại */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Điện thoại</label>
                                <input name="phone" defaultValue={initialData?.phone || ''} type="text" placeholder="SĐT" className={`w-full rounded-md border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                            </div>
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input name="email" defaultValue={initialData?.email || ''} type="email" placeholder="Email" className={`w-full rounded-md border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-2 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>
                            {/* Người liên hệ */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Người liên hệ</label>
                                <input name="contactPerson" defaultValue={initialData?.contactPerson || ''} type="text" placeholder="Người liên hệ" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Số ĐKKD */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Số ĐKKD</label>
                                <input name="businessLicense" defaultValue={initialData?.businessLicense || ''} type="text" placeholder="Số ĐKKD" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>

                            {/* Ghi chú */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                                <input name="notes" defaultValue={initialData?.notes || ''} type="text" placeholder="Ghi chú" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>

                            {/* Checkboxes */}
                            <div className="flex items-end pb-2 gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input name="isNational" type="checkbox" defaultChecked={initialData?.isNational !== false} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">DQG</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input name="isDefaultImport" type="checkbox" defaultChecked={!!initialData?.isDefaultImport} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mặc định nhập</span>
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
