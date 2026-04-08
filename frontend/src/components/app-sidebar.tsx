"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, FrameIcon, PieChartIcon, LayoutDashboard, Trash2, PlusSquare, ShoppingCart } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const sidebarData = {
    teams: [
      {
        name: "Ngọc Mỹ",
        logo: (
          <img src="/ngoc_my_logo.png" alt="Ngọc Mỹ Logo" className="w-full h-full object-cover rounded-md" />
        ),
        plan: "Nhà thuốc",
      },
      {
        name: "Acme Corp.",
        logo: <AudioLinesIcon />,
        plan: "Startup",
      },
      {
        name: "Evil Corp.",
        logo: <TerminalIcon />,
        plan: "Free",
      },
    ],
    navMain: [
      ...(isAdmin ? [{
        title: "Dashboard",
        url: "/",
        icon: <LayoutDashboard />,
        isActive: true,
      }] : []),
      {
        title: "Khai báo",
        url: "#",
        icon: <TerminalSquareIcon />,
        items: [
          {
            title: "Danh mục nhà cung cấp",
            url: "/suppliers",
          },
          {
            title: "Danh mục khách hàng",
            url: "/customers",
          },
          {
            title: "Danh mục sản phẩm",
            url: "/products",
          },
          {
            title: "Danh mục nhóm sản phẩm",
            url: "/product-categories",
          },
          {
            title: "Danh mục đơn vị tính",
            url: "/units",
          },
          {
            title: "Danh mục hình thức thanh toán",
            url: "/payment-methods",
          },
        ],
      },
      {
        title: "Tạo phiếu",
        url: "#",
        icon: <BotIcon />,
        items: [
          {
            title: "Danh sách phiếu nhập",
            url: "/purchase-orders",
          },
          {
            title: "Danh sách phiếu xuất",
            url: "/export-manage",
          },
        ],
      },
      {
        title: "Nhập hàng",
        url: "/purchase-orders/create",
        icon: <PlusSquare />,
      },
      {
        title: "Bán hàng",
        url: "/export-manage/create",
        icon: <ShoppingCart />,
      },
      {
        title: "Ghi chú",
        url: "/notes",
        icon: <BotIcon />,
      },
    ],
    projects: isAdmin ? [
      {
        name: "Báo cáo doanh thu",
        url: "/reports/revenue",
        icon: <FrameIcon />,
      },
      {
        name: "Báo cáo tồn kho",
        url: "/stock",
        icon: <PieChartIcon />,
      },
      {
        name: "Báo cáo thu chi",
        url: "/reports/income-expense",
        icon: <PieChartIcon />,
      },
      {
        name: "Thùng rác",
        url: "/trash",
        icon: <Trash2 />,
      },
    ] : [],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        {isAdmin && <NavProjects projects={sidebarData.projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: typeof user?.name === 'string' ? user.name : "User",
          email: typeof user?.username === 'string' ? user.username : "",
          // thay đổi avata. hạn chế lưu ảnh để tiết kiệm cơ sở dữ liệu
          avatar: "/avata.jpg"
        }} />
        <div className="px-4 py-2 text-[10px] text-gray-400 dark:text-neutral-500 font-medium text-center border-t border-gray-100 dark:border-neutral-800">
          Created by Ngọc Thái
          <br />
          <span className="text-[#5c9a38] dark:text-[#65a34e]">Chúc bé luôn vui vẻ</span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
