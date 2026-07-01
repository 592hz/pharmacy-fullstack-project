import { useState, useEffect, Suspense } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileNav } from "@/components/MobileNav"
import { SecretMessageModal } from "@/components/SecretMessageModal"
import LoadingScreen from "@/components/LoadingScreen"

export default function DashboardLayout() {
    const [isSecretOpen, setIsSecretOpen] = useState(false)

    useEffect(() => {
        const handleTrigger = () => setIsSecretOpen(true)
        window.addEventListener('secret-message-triggered', handleTrigger)
        return () => window.removeEventListener('secret-message-triggered', handleTrigger)
    }, [])

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex flex-1 flex-col transition-all duration-300 ease-in-out bg-gray-50 dark:bg-neutral-950 min-h-screen">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-3 sm:px-4 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="hover:bg-gray-100 dark:hover:bg-neutral-800 p-2 rounded-md transition-colors w-8 h-8 sm:w-9 sm:h-9" />
                        <div className="h-6 w-[1px] bg-gray-200 dark:border-neutral-800 mx-1 hidden sm:block" />
                        <h1 className="text-[13px] sm:text-sm font-bold text-gray-800 dark:text-gray-100 hidden xs:block sm:block truncate max-w-[150px] sm:max-w-none"> NHÀ THUỐC NGỌC MỸ</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                    </div>
                </header>
                <div className="flex flex-1 flex-col p-2 sm:p-6 lg:p-8 pb-24 sm:pb-8">
                    <Suspense fallback={<LoadingScreen />}>
                        <Outlet />
                    </Suspense>
                </div>
            </main>
            <MobileNav />
            <SecretMessageModal isOpen={isSecretOpen} onClose={() => setIsSecretOpen(false)} />
        </SidebarProvider>
    )
}
