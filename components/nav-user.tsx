"use client"

import { useState } from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ChevronsUpDownIcon,
  BadgeCheckIcon,
  BellIcon,
  LogOutIcon,
  MailIcon,
  BuildingIcon,
  ShieldIcon,
  ClockIcon,
  CheckCheckIcon,
  Trash2Icon,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

// Tipagem das notificações
type Notification = {
  id: string
  title: string
  description: string
  time: string
  read: boolean
}

// Notificações de exemplo — substitua por dados reais
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Novo contrato disponível",
    description: "O contrato #4521 foi adicionado ao sistema.",
    time: "Há 5 min",
    read: false,
  },
  {
    id: "2",
    title: "Repasse processado",
    description: "O repasse de março foi processado com sucesso.",
    time: "Há 1h",
    read: false,
  },
  {
    id: "3",
    title: "CEBA atualizado",
    description: "O CEBA da entidade Exemplo foi atualizado.",
    time: "Há 3h",
    read: true,
  },
]

function ContaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession()

  const name = session?.user?.name ?? "Usuário"
  const email = session?.user?.email ?? ""
  const avatar = session?.user?.image ?? ""
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Minha Conta</DialogTitle>
        </DialogHeader>

        {/* Perfil centrado */}
        <div className="flex flex-col items-center gap-3 py-4">
          <Avatar className="h-20 w-20 rounded-full">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-2xl rounded-full">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-lg font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <ShieldIcon className="size-3" />
            Conta Corporativa
          </Badge>
        </div>

        <Separator />

        {/* Informações da conta */}
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-3 text-sm">
            <MailIcon className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="font-medium">{email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <BuildingIcon className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Organização</p>
              <p className="font-medium">Ministério do Desenvolvimento</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ShieldIcon className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tipo de acesso</p>
              <p className="font-medium">Microsoft Entra ID</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ClockIcon className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Sessão iniciada</p>
              <p className="font-medium">{new Date().toLocaleDateString("pt-BR", { dateStyle: "long" })}</p>
            </div>
          </div>
        </div>

        <Separator />

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          <LogOutIcon className="size-4" />
          Encerrar sessão
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function NotificacoesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={markAllRead}>
                <CheckCheckIcon className="size-3" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <BellIcon className="size-8 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-muted/50",
                  !notification.read && "bg-muted/30"
                )}
              >
                {/* Bolinha de não lido */}
                <div className="mt-1.5 shrink-0">
                  {!notification.read ? (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-transparent" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium", !notification.read && "text-foreground")}>
                    {notification.title}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">{notification.description}</p>
                  <p className="text-muted-foreground text-xs mt-1">{notification.time}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session, status } = useSession()
  const [contaOpen, setContaOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications] = useState<Notification[]>(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const name = session?.user?.name ?? "Usuário"
  const email = session?.user?.email ?? ""
  const avatar = session?.user?.image ?? ""
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()

  return (
    <>
      <ContaDialog open={contaOpen} onClose={() => setContaOpen(false)} />
      <NotificacoesDialog open={notifOpen} onClose={() => setNotifOpen(false)} />

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setContaOpen(true)} className="cursor-pointer">
                  <BadgeCheckIcon className="mr-2 size-4" />
                  Conta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNotifOpen(true)} className="cursor-pointer">
                  <div className="relative mr-2">
                    <BellIcon className="size-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  Notificações
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                      {unreadCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 cursor-pointer"
                onClick={() => signOut({ redirectTo: "/" })}
              >
                <LogOutIcon className="mr-2 size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}