import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

export default function DashboardLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex flex-1 flex-col gap-4 p-4 selection:bg-primary/20">
                <div className="flex items-center justify-between space-x-2">
                    <SidebarTrigger />
                    <ModeToggle />
                </div>
                <div className="flex flex-1 flex-col">
                    <Outlet />
                </div>
            </main>
        </SidebarProvider>
    )
}
