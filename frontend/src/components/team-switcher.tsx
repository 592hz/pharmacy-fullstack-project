"use client"

import * as React from "react"
import { Link } from "react-router-dom"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ReactNode
    plan: string
  }[]
}) {
  const activeTeam = teams[0]
  const [clicks, setClicks] = React.useState(0)
  const timerRef = React.useRef<any>(null)

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setClicks(prev => prev + 1)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setClicks(0)
    }, 2000)

    if (clicks + 1 >= 7) {
      window.dispatchEvent(new CustomEvent('secret-message-triggered'))
      setClicks(0)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <div>
            <div
              onClick={handleLogoClick}
              className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden cursor-pointer"
            >
              {activeTeam.logo}
            </div>
            <Link to="/" className="grid flex-1 text-left text-sm leading-tight ml-1">
              <span className="truncate font-bold text-lg">{activeTeam.name}</span>
            </Link>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
