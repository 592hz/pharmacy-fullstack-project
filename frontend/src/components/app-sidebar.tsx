"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"

//du lieu mau

const data = {
  user: {
    name: "Ngoc thai",
    email: "ngocthai@example.com",
    avatar: "/avata.jpg",
  },

  //thông tin team + logo website
  teams: [
    {
      name: "Ngocmy",
      logo: (
        <img src="/ngoc_my_logo.png" alt="Ngọc Mỹ Logo" className="w-full h-full object-cover rounded-md" />
      ),
      plan: "Nhà thuốc",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Khai báo",
      url: "#",
      icon: (
        <TerminalSquareIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Danh mục nhà cung cấp",
          url: "/suppliers",
        },
        {
          title: "Danh mục khách hàng",
          url: "#",
        },
        {
          title: "Danh mục sản phẩm",
          url: "#",
        },
        {
          title: "Danh mục nhóm sản phẩm",
          url: "#",
        },
        {
          title: "Danh mục nhóm thu chi",
          url: "#",
        },
        {
          title: "Danh mục đơn thuốc",
          url: "#",
        },
        {
          title: "Danh mục đơn vị tính",
          url: "#",
        },
        {
          title: "Danh mục hình thức thanh toán",
          url: "#",
        },
      ],
    },
    {
      title: "Tạo phiếu",
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "Danh sách phiếu nhập",
          url: "#",
        },
        {
          title: "Danh sách phiếu xuất",
          url: "#",
        },
        {
          title: "Khách trả lại",
          url: "#",
        },
        {
          title: "Kiểm kê tồn kho",
          url: "#",
        },
        {
          title: "Quản lý thu chi",
          url: "#"
        }
      ],
    },
    {
      title: "Nhập hàng",
      url: "#",
    },
    {
      title: "Bán hàng",
      url: "#",
    },
    // {
    //   title: "Báo cáo",
    //   url: "#",
    //   icon: (
    //     <BotIcon
    //     />
    //   ),
    //   items: [
    //     {
    //       title: "Báo cáo tồn kho",
    //       url: "#",
    //     },
    //     {
    //       title: "Báo cáo doanh thu",
    //       url: "#",
    //     },
    //     {
    //       title: "Báo cáo lãi lỗ",
    //       url: "#",
    //     },
    //     {
    //       title: "Báo cáo tồn kho",
    //       url: "#",
    //     },
    //     {
    //       title: "Báo cáo cận date - sắp hết ",
    //       url: "#"
    //     }
    //   ],
    // },
  ],
  projects: [
    {
      name: "Báo cáo doanh thu",
      url: "#",
      icon: (
        <FrameIcon />
      ),
    },
    {
      name: "Báo cáo tồn kho",
      url: "#",
      icon: (
        <PieChartIcon />
      ),
    },
    {
      name: "Báo cáo kinh doanh",
      url: "#",
      icon: (
        <MapIcon />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
