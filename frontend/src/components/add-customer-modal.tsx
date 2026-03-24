import { useState } from "react"
import { X, Plus } from "lucide-react"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-0 sm:p-4 transition-opacity animate-in fade-in duration-200">
            <div className="relative w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-xl bg-white shadow-2xl dark:bg-neutral-900 flex flex-col overflow-hidden transform animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {initialData ? 'Cập nhật khách hàng' : 'Thêm mới khách hàng'}
                        </h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            {/* Tên khách hàng */}
                            <div className="space-y-1.5 md:col-span-8">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    Tên khách hàng <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    name="name" 
                                    defaultValue={initialData?.name || ''} 
                                    type="text" 
                                    placeholder="Họ và tên khách hàng" 
                                    className={`w-full rounded-md border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-neutral-700 focus:border-[#5c9a38] focus:ring-[#5c9a38]/30'} px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 transition-all`} 
                                />
                                {errors.name && <p className="text-[10px] text-red-500 font-medium">{errors.name}</p>}
                            </div>
                            
                            {/* Điện thoại */}
                            <div className="space-y-1.5 md:col-span-4">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Số điện thoại</label>
                                <input 
                                    name="phone" 
                                    defaultValue={initialData?.phone || ''} 
                                    type="tel" 
                                    placeholder="Số điện thoại" 
                                    className={`w-full rounded-md border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-neutral-700 focus:border-[#5c9a38] focus:ring-[#5c9a38]/30'} px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 transition-all`} 
                                />
                                {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
                            </div>

                            {/* Ngày sinh */}
                            <div className="space-y-1.5 md:col-span-4">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ngày sinh</label>
                                <input name="dob" defaultValue={initialData?.dob || ''} type="text" placeholder="DD/MM/YYYY" className="w-full rounded-md border border-gray-300 dark:border-neutral-700 px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 dark:text-white focus:border-[#5c9a38] focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/30 transition-all" />
                            </div>

                             {/* Giới tính */}
                             <div className="space-y-1.5 md:col-span-4">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Giới tính</label>
                                <select name="gender" defaultValue={initialData?.gender || 'Nam'} className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm dark:text-white focus:border-[#5c9a38] focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/30 transition-all">
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            {/* Cân nặng */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cân nặng (kg)</label>
                                <input name="weight" defaultValue={initialData?.weight || ''} type="text" placeholder="0" className="w-full rounded-md border border-gray-300 dark:border-neutral-700 px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 dark:text-white focus:border-[#5c9a38] focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/30 transition-all" />
                            </div>

                            {/* Tuổi */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tuổi</label>
                                <input name="age" defaultValue={initialData?.age || ''} type="text" placeholder="0" className="w-full rounded-md border border-gray-300 dark:border-neutral-700 px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 dark:text-white focus:border-[#5c9a38] focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/30 transition-all" />
                            </div>

                            {/* Địa chỉ */}
                            <div className="space-y-1.5 md:col-span-12">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Địa chỉ</label>
                                <textarea 
                                    name="address" 
                                    defaultValue={initialData?.address || ''} 
                                    rows={2}
                                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" 
                                    className="w-full rounded-md border border-gray-300 dark:border-neutral-700 px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 dark:text-white focus:border-[#5c9a38] focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/30 transition-all resize-none"
                                />
                            </div>

                            {/* Ghi chú */}
                            <div className="space-y-1.5 md:col-span-12">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ghi chú</label>
                                <input name="notes" defaultValue={initialData?.notes || ''} type="text" placeholder="Ví dụ: Dị ứng thuốc, khách hàng thân thiết..." className="w-full rounded-md border border-gray-300 dark:border-neutral-700 px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 dark:text-white focus:border-[#5c9a38] focus:outline-none focus:ring-2 focus:ring-[#5c9a38]/30 transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50">
                        <button 
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Thoát
                        </button>
                        <button 
                            type="submit" 
                            className="px-8 py-2.5 rounded-md bg-[#5c9a38] text-sm font-bold text-white hover:bg-[#5c9a38]/90 shadow-md active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> {initialData ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
