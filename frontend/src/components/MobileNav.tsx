import { useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, Package, PlusCircle, ShoppingCart, Menu } from "lucide-react"
import { useSidebar } from "./ui/sidebar-context"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const location = useLocation()
    const navigate = useNavigate()
    const { toggleSidebar } = useSidebar()

    const navItems = [
        {
            label: "Trang chủ",
            icon: LayoutDashboard,
            path: "/",
        },
        {
            label: "Sản phẩm",
            icon: Package,
            path: "/products",
        },
        {
            label: "Nhập hàng",
            icon: PlusCircle,
            path: "/purchase-orders/create",
            special: true
        },
        {
            label: "Bán hàng",
            icon: ShoppingCart,
            path: "/export-manage/create",
        },
    ]

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-neutral-800 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    const Icon = item.icon

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all active:scale-95 flex-1 min-w-[64px]",
                                isActive 
                                    ? "text-[#5c9a38]" 
                                    : "text-gray-500 dark:text-gray-400"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-colors",
                                item.special && "bg-[#5c9a38] text-white shadow-lg shadow-green-500/20 -mt-8 border-4 border-white dark:border-neutral-900",
                                isActive && !item.special && "bg-green-50 dark:bg-green-900/20"
                            )}>
                                <Icon className={cn(item.special ? "w-6 h-6" : "w-5 h-5")} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[9px] sm:text-[10px] font-bold tracking-tight",
                                item.special && "mt-1"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}

                {/* Sidebar Trigger Button */}
                <button
                    onClick={toggleSidebar}
                    className="flex flex-col items-center justify-center gap-1 transition-all active:scale-95 flex-1 min-w-[64px] text-gray-500 dark:text-gray-400"
                >
                    <div className="p-1.5 rounded-xl">
                        <Menu size={20} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-bold tracking-tight">Thêm</span>
                </button>
            </div>
        </div>
    )
}
