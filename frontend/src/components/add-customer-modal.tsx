import { useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { customerSchema } from "@/lib/schemas"
import { type Customer } from "@/lib/mock-data"

interface AddCustomerModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd?: (customer: Customer) => void
    onEdit?: (customer: Customer) => void
    initialData?: Customer | null
}

export default function AddCustomerModal({ isOpen, onClose, onAdd, onEdit, initialData }: AddCustomerModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleClose = () => {
        setErrors({})
        onClose()
    }

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const timestamp = Date.now().toString().slice(-6)
        const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase()
        const id = initialData?.id || `KH${timestamp}${randomStr}`
        const rawData = Object.fromEntries(formData)
        
        const result = customerSchema.safeParse({
            ...rawData,
            id,
            debt: initialData?.debt || 0,
            accumulatedPoints: initialData?.accumulatedPoints || 0,
            remainingPoints: initialData?.remainingPoints || 0,
            hasApp: initialData?.hasApp || false,
        })

        if (!result.success) {
            const newErrors: Record<string, string> = {}
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string
                newErrors[path] = issue.message
            })
            setErrors(newErrors)
            toast.error("Vui lòng kiểm tra lại thông tin khách hàng!")
            return
        }

        const customerData: Customer = {
            ...result.data,
            id: id,
            phone: result.data.phone || "",
            dob: result.data.dob || "",
            address: result.data.address || "",
            debt: result.data.debt || 0,
            accumulatedPoints: result.data.accumulatedPoints || 0,
            remainingPoints: result.data.remainingPoints || 0,
            hasApp: result.data.hasApp || false,
        }

        if (initialData && onEdit) {
            onEdit(customerData)
        } else if (onAdd) {
            onAdd(customerData)
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
                            {initialData ? 'Cập nhật khách hàng' : 'Thêm mới khách hàng'}
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
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 pb-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-6 gap-x-6">
                            {/* Tên khách hàng */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Tên khách hàng <span className="text-red-500">*</span>
                                </label>
                                <input name="name" defaultValue={initialData?.name || ''} type="text" placeholder="Tên khách hàng/Người giám hộ" className={`w-full rounded border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-1.5 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                            </div>
                            {/* Điện thoại */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Điện thoại</label>
                                <input name="phone" defaultValue={initialData?.phone || ''} type="text" placeholder="Điện thoại" className={`w-full rounded border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-1.5 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.phone && <p className="text-[10px] text-red-500">{errors.phone}</p>}
                            </div>
                            {/* Ngày sinh */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ngày sinh</label>
                                <input name="dob" defaultValue={initialData?.dob || ''} type="text" placeholder="Ngày sinh" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>

                            {/* Địa chỉ (Spans all columns) */}
                            <div className="space-y-2 md:col-span-4">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
                                <input name="address" defaultValue={initialData?.address || ''} type="text" placeholder="Địa chỉ" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>

                            {/* Giới tính */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Giới tính</label>
                                <select name="gender" defaultValue={initialData?.gender || 'Nam'} className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            {/* Cân nặng */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Cân nặng</label>
                                <input name="weight" defaultValue={initialData?.weight || ''} type="text" placeholder="Cân nặng" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Tuổi */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">Tuổi</label>
                                <input name="age" defaultValue={initialData?.age || ''} type="text" placeholder="Tuổi" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>


                            {/* Ghi chú */}
                            <div className="space-y-2 md:col-span-4">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                                <input name="notes" defaultValue={initialData?.notes || ''} type="text" placeholder="Ghi chú" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>

                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-4 dark:border-neutral-800">
                        <button type="submit" className="flex items-center justify-center gap-1.5 rounded bg-[#3b5998] px-6 py-1.5 text-xs font-medium text-white hover:bg-[#324b80] focus:ring-2 focus:ring-[#3b5998] focus:ring-offset-2">
                            ✓ Lưu lại
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex items-center justify-center gap-1.5 bg-transparent px-4 py-1.5 text-xs font-medium text-[#c42031] hover:text-[#9c1826]"
                        >
                            <X size={14} className="text-[#3b5998]" /> Thoát
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
