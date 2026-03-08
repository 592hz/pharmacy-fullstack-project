import { Outlet } from "react-router-dom"
import { ModeToggle } from "@/components/mode-toggle"

export default function AuthLayout() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10 relative">
            <ModeToggle />
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Outlet />
            </div>
        </div>
    )
}
