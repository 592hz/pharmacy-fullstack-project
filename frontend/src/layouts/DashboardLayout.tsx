import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/context/AuthContext"
import { LogOut, User as UserIcon } from "lucide-react"

export default function DashboardLayout() {
    const { user, logout } = useAuth();

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex flex-1 flex-col transition-all duration-300 ease-in-out bg-gray-50 dark:bg-neutral-950 min-h-screen">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-gray-100 dark:hover:bg-neutral-800 p-2 rounded-md transition-colors" />
                        <div className="h-6 w-[1px] bg-gray-200 dark:bg-neutral-800 mx-1 hidden sm:block" />
                        <h1 className="text-sm font-bold text-gray-800 dark:text-gray-100 hidden sm:block">QUẢN LÝ NHÀ THUỐC</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-full">
                                <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {user.name}
                                </span>
                            </div>
                        )}
                        <ModeToggle />
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Đăng xuất</span>
                        </button>
                    </div>
                </header>
                <div className="flex flex-1 flex-col p-3 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </SidebarProvider>
    )
}
