import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          description: "group-[.toast]:!text-muted-foreground",
          success: "!bg-green-100 dark:!bg-green-900 !border-green-200 dark:!border-green-800 !text-green-900 dark:!text-green-100 [&_[data-description]]:!text-green-800 dark:[&_[data-description]]:!text-green-200",
          error: "!bg-red-100 dark:!bg-red-900 !border-red-200 dark:!border-red-800 !text-red-900 dark:!text-red-100 [&_[data-description]]:!text-red-800 dark:[&_[data-description]]:!text-red-200",
          warning: "!bg-yellow-100 dark:!bg-yellow-900 !border-yellow-200 dark:!border-yellow-800 !text-yellow-900 dark:!text-yellow-100 [&_[data-description]]:!text-yellow-800 dark:[&_[data-description]]:!text-yellow-200",
          info: "!bg-blue-100 dark:!bg-blue-900 !border-blue-200 dark:!border-blue-800 !text-blue-900 dark:!text-blue-100 [&_[data-description]]:!text-blue-800 dark:[&_[data-description]]:!text-blue-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
