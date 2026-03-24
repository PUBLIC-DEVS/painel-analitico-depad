"use client"

import * as React from "react"
import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  GalleryVerticalEndIcon,
  FileTextIcon,
  UsersIcon,
  ArrowRightLeftIcon,
  InfoIcon,
  MapPlus,
} from "lucide-react"

const data = {
  navMain: [
    { title: "Geral",                url: "/dashboard",          icon: <InfoIcon /> },
    { title: "Mapa das comunidades", url: "/dashboard/mops",     icon: <MapPlus /> },
    { title: "Contratos",            url: "/dashboard/contratos",icon: <FileTextIcon /> },
    { title: "CEBAS",                url: "/dashboard/cebas",    icon: <UsersIcon /> },
    { title: "Repasses",             url: "/dashboard/repasses", icon: <ArrowRightLeftIcon /> },
  ],
}

function SidebarLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild tooltip="Depad">
          <Link href="/dashboard">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            {/* group-data-[collapsible=icon]:hidden — esconde o texto quando a sidebar colapsa */}
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-semibold">Depad</span>
              <span className="text-xs text-muted-foreground">Painel Analítico</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="will-change-transform" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}