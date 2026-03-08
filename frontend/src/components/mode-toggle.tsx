import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="fixed top-4 right-4 z-50 rounded-full w-9 h-9 border bg-background"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] transition-all dark:hidden" />
            <Moon className="hidden h-[1.2rem] w-[1.2rem] transition-all dark:block" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
