import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"

interface AddCustomerModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd?: (customer: any) => void
    onEdit?: (customer: any) => void
    initialData?: any
}

export default function AddCustomerModal({ isOpen, onClose, onAdd, onEdit, initialData }: AddCustomerModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Clear errors when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) setErrors({})
    }, [isOpen, initialData])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const id = formData.get('id') as string
        const name = formData.get('name') as string
        const phone = formData.get('phone') as string
        // const email = formData.get('email') as string

        const newErrors: Record<string, string> = {}

        if (!id?.trim()) newErrors.id = 'Vui lòng nhập mã khách hàng'
        if (!name?.trim()) newErrors.name = 'Vui lòng nhập tên khách hàng'

        // Simple 10-11 digit phone validation if provided
        if (phone && !/^[0-9]{10,11}$/.test(phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)'
        }

        // Simple email validation if provided
        // if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        //     newErrors.email = 'Email không hợp lệ'
        // }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error("Vui lòng kiểm tra lại các trường thông tin không hợp lệ!")
            return
        }

        const customerData = {
            ...Object.fromEntries(formData),
            debt: initialData?.debt || 0, // Keep debt if editing, or default to 0
            accumulatedPoints: initialData?.accumulatedPoints || 0,
            remainingPoints: initialData?.remainingPoints || 0,
            hasApp: initialData?.hasApp || false,
            // Checkboxes
            pointsAccumulation: formData.get('pointsAccumulation') === 'on',
            defaultSale: formData.get('defaultSale') === 'on',
            khDQG: formData.get('khDQG') === 'on',
            sendNotification: formData.get('sendNotification') === 'on',
        }

        if (initialData && onEdit) {
            onEdit(customerData)
        } else if (onAdd) {
            onAdd({ ...customerData, id: id || `KH${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` })
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
                            onClick={onClose}
                            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 pb-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-6 gap-x-6">
                            {/* Mã khách hàng */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Mã khách hàng <span className="text-red-500">*</span>
                                </label>
                                <input name="id" defaultValue={initialData?.id || ''} type="text" placeholder="KH00009" className={`w-full rounded border ${errors.id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-1.5 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.id && <p className="text-[10px] text-red-500">{errors.id}</p>}
                            </div>
                            {/* Tên khách hàng */}
                            <div className="space-y-2">
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
                            {/* Mức giảm giá (%) */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mức giảm giá (%)</label>
                                <input name="discount" defaultValue={initialData?.discount || ''} type="text" placeholder="Mức giảm giá (%)" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Tuổi, Năm/Tháng */}
                            <div className="space-y-2 flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">Tuổi</label>
                                    <input name="age" defaultValue={initialData?.age || ''} type="text" placeholder="Tuổi" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">Năm/Tháng</label>
                                    <select name="ageUnit" defaultValue={initialData?.ageUnit || 'Năm'} className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                                        <option value="Năm">Năm</option>
                                        <option value="Tháng">Tháng</option>
                                    </select>
                                </div>
                            </div>

                            {/* Mã số thuế */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mã số thuế</label>
                                <input name="taxCode" defaultValue={initialData?.taxCode || ''} type="text" placeholder="Mã số thuế" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Tên đơn vị xuất HĐĐT */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tên đơn vị xuất HĐĐT</label>
                                <input name="invoiceUnitName" defaultValue={initialData?.invoiceUnitName || ''} type="text" placeholder="Tên đơn vị xuất HĐĐT" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Mã ĐVNS */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mã ĐVNS</label>
                                <input name="unitCode" defaultValue={initialData?.unitCode || ''} type="text" placeholder="Mã ĐVNS" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input name="email" defaultValue={initialData?.email || ''} type="email" placeholder="Email" className={`w-full rounded border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} px-3 py-1.5 text-sm focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white`} />
                                {errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
                            </div>

                            {/* Ghi chú */}
                            <div className="space-y-2 md:col-span-4">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                                <input name="notes" defaultValue={initialData?.notes || ''} type="text" placeholder="Ghi chú" className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
                            </div>

                            {/* Checkboxes */}
                            <div className="flex items-center pt-2 gap-6 md:col-span-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input name="pointsAccumulation" type="checkbox" defaultChecked={initialData?.pointsAccumulation !== false} className="w-3.5 h-3.5 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tích điểm</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input name="defaultSale" type="checkbox" defaultChecked={!!initialData?.defaultSale} className="w-3.5 h-3.5 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Mặc định bán</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer opacity-50">
                                    <input name="khDQG" type="checkbox" disabled defaultChecked={true} className="w-3.5 h-3.5 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">KH DQG</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input name="sendNotification" type="checkbox" defaultChecked={initialData?.sendNotification !== false} className="w-3.5 h-3.5 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Gửi thông báo khi bán hàng</span>
                                </label>
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
                            onClick={onClose}
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
