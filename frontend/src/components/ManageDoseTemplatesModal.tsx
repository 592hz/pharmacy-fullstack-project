import { useState, useEffect } from "react";
import { X, Trash2, Loader2, Pill } from "lucide-react";
import { doseTemplateService, type IDoseTemplate } from "@/services/dose-template.service";
import { toast } from "sonner";

interface ManageDoseTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate?: (template: IDoseTemplate) => void;
}

export function ManageDoseTemplatesModal({ isOpen, onClose, onSelectTemplate }: ManageDoseTemplatesModalProps) {
    const [templates, setTemplates] = useState<IDoseTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await doseTemplateService.getTemplates();
            setTemplates(data || []);
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi tải danh sách mẫu liều thuốc");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent selecting the template when clicking delete
        if (!confirm("Bạn có chắc muốn xóa mẫu này?")) return;
        
        try {
            await doseTemplateService.deleteTemplate(id);
            toast.success("Đã xóa mẫu thành công");
            loadTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa mẫu liều thuốc");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-neutral-800 scale-in-center">
                
                {/* Header */}
                <div className="flex-none p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-800/30">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Cài đặt Mẫu Liều Thuốc</h2>
                        <p className="text-sm text-gray-500 font-medium">Quản lý và chọn các mẫu liều thuốc đã lưu</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-neutral-900/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40 text-gray-400">
                            <Loader2 className="animate-spin mr-2" /> Đang tải...
                        </div>
                    ) : !templates || templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-60">
                            <Pill size={40} className="mb-3" />
                            <p>Chưa có mẫu liều thuốc nào.</p>
                            <p className="text-xs">Hãy lưu một liều thành mẫu để thấy ở đây.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {templates.map(tpl => (
                                <div 
                                    key={tpl._id} 
                                    onClick={() => {
                                        if (onSelectTemplate) {
                                            onSelectTemplate(tpl);
                                            onClose();
                                        }
                                    }}
                                    className={`bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 flex flex-col gap-3 group transition-all ${onSelectTemplate ? 'cursor-pointer hover:border-green-500 hover:shadow-md' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{tpl.name}</div>
                                            <div className="text-sm font-bold text-green-600 dark:text-green-400">{tpl.price.toLocaleString("vi-VN")} đ</div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(e, tpl._id!)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            title="Xóa mẫu này"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {tpl.components.map((c, idx) => (
                                            c.product ? (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-700 text-[11px] font-bold text-gray-600 dark:text-gray-300 rounded-lg">
                                                    {c.product.name}
                                                    <span className="text-blue-500">x{c.quantity}</span>
                                                </span>
                                            ) : (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-950/30 text-[11px] font-bold text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/30" title="Sản phẩm này đã bị xóa khỏi hệ thống">
                                                    {c.productName || c.productCode || "Sản phẩm bị xóa"}
                                                    <span className="text-red-500">x{c.quantity} (Đã bị xóa)</span>
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
