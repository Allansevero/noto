"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  AppWindowMac,
  IdCardLanyard,
  ScrollText,
  HeartHandshake,
  Shredder,
  Puzzle,
  StepForward,
  Bolt,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { logoutUser } from "@/features/auth/auth.repository"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{
    strokeWidth?: number
    absoluteStrokeWidth?: boolean
    className?: string
    style?: React.CSSProperties
  }>
  emBreve?: boolean
  strokeWidth?: number
}

const navGroup1: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: AppWindowMac, emBreve: false },
  { title: "Pacientes", href: "/dashboard/pacientes", icon: IdCardLanyard, emBreve: false },
  { title: "Notas Fiscais", href: "/dashboard/notas", icon: ScrollText, emBreve: false },
  { title: "Noto Sync", href: "/dashboard/noto-sync", icon: Shredder, emBreve: true },
  { title: "Colaboradores", href: "/dashboard/colaboradores", icon: HeartHandshake, emBreve: true },
]

const navGroup2: NavItem[] = [
  { title: "Integracoes", href: "/dashboard/integracoes", icon: Puzzle, emBreve: true },
  { title: "Acoes Agendadas", href: "/dashboard/acoes-agendadas", icon: StepForward, emBreve: true },
]

const navGroup3: NavItem[] = [
  { title: "Configuracoes", href: "/dashboard/configuracoes", icon: Bolt, emBreve: true },
]

const Divider = () => (
  <div
    role="none"
    className="mx-auto my-1 h-px w-[calc(100%-16px)] bg-neutral-200 dark:bg-neutral-800 shrink-0"
  />
)

interface AppSidebarProps {
  doctorName?: string
  doctorCnpj?: string
}

export function AppSidebar({ doctorName, doctorCnpj }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, isHovered } = useSidebar()
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  const [isLogoutHovered, setIsLogoutHovered] = React.useState(false)

  const isExpanded = state === "expanded" || isHovered

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // ignora
    }
    router.push("/login")
  }

  const renderItem = (item: NavItem) => {
    const Icon = item.icon
    const isSelected =
      !item.emBreve &&
      (item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href))
    const isItemHovered = hoveredItem === item.title
    const active = isSelected || (!item.emBreve && isItemHovered)
    const iconStrokeWidth = active ? (item.strokeWidth ?? 1.75) : 1

    const itemContent = (
      <div
        className={cn(
          "flex h-9 w-full items-center overflow-hidden rounded-md bg-transparent outline-none transition-colors",
          item.emBreve
            ? "cursor-not-allowed select-none opacity-60"
            : "cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
        )}
      >
        {/* Zona do icone: largura fixa = 47px, sempre centralizado */}
        <span className="flex h-full w-[47px] shrink-0 items-center justify-center">
          <Icon
            strokeWidth={iconStrokeWidth}
            absoluteStrokeWidth
            className="size-[20px] transition-all duration-150"
            style={{ color: "#000000" }}
          />
        </span>
        {/* Texto: so aparece quando expandido, sem mover o icone */}
        <div
          className={cn(
            "flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[13px] tracking-tight transition-[opacity,max-width] duration-200",
            active ? "font-semibold" : "font-normal",
            isExpanded ? "max-w-[210px] opacity-100" : "max-w-0 opacity-0"
          )}
          style={{ color: "#000000" }}
        >
          <span>{item.title}</span>
          {item.emBreve && (
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase ml-1 whitespace-nowrap">
              EM BREVE
            </span>
          )}
        </div>
      </div>
    )

    return (
      <li key={item.title} className="relative list-none">
        <Tooltip>
          <TooltipTrigger asChild>
            {item.emBreve ? (
              <div
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
                aria-disabled="true"
                className="w-full select-none"
              >
                {itemContent}
              </div>
            ) : (
              <Link
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
                className="w-full block"
              >
                {itemContent}
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={isExpanded}>
            <div className="flex items-center gap-1.5">
              <span>{item.title}</span>
              {item.emBreve && (
                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  (Em breve)
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </li>
    )
  }


  const renderGroup = (items: NavItem[]) => (
    <div className="flex w-full flex-col py-1 px-1">
      <ul className="flex w-full flex-col gap-0.5 p-0 m-0">
        {items.map(renderItem)}
      </ul>
    </div>
  )

  return (
    <Sidebar collapsible="icon">
      {/* O elemento real que precisa da borda direita e do fundo */}
      <div className="flex h-full w-full flex-col bg-white border-r border-neutral-200 dark:bg-sidebar dark:border-neutral-800">
        {/* Nav principal */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <nav className="flex flex-1 flex-col">
            {renderGroup(navGroup1)}
            <Divider />
            {renderGroup(navGroup2)}
            <Divider />
            {renderGroup(navGroup3)}
          </nav>
        </div>

        {/* Footer */}
        <SidebarFooter className="p-0 border-t border-neutral-200 dark:border-neutral-800">
          {doctorName && isExpanded && (
            <div className="px-3 py-1.5 text-xs">
              <p className="font-medium truncate" style={{ color: "#000000" }}>{doctorName}</p>
              {doctorCnpj && (
                <p className="text-[10px] text-neutral-400 truncate font-mono">{doctorCnpj}</p>
              )}
            </div>
          )}
          <ul className="flex w-full flex-col gap-0.5 p-1 m-0 list-none">
            <li className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleLogout}
                    onMouseEnter={() => setIsLogoutHovered(true)}
                    onMouseLeave={() => setIsLogoutHovered(false)}
                    className="flex h-9 w-full items-center overflow-hidden rounded-md bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                  >
                    <span className="flex h-full w-[47px] shrink-0 items-center justify-center">
                      <LogOut
                        strokeWidth={isLogoutHovered ? 1.75 : 1}
                        absoluteStrokeWidth
                        className="size-[20px] transition-all duration-150"
                        style={{ color: "#000000" }}
                      />
                    </span>
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap text-[13px] tracking-tight transition-[opacity,max-width] duration-200",
                        isLogoutHovered ? "font-semibold" : "font-normal opacity-60",
                        isExpanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                      )}
                      style={{ color: "#000000" }}
                    >
                      Sair
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" hidden={isExpanded}>
                  Encerrar Sessao
                </TooltipContent>
              </Tooltip>
            </li>
          </ul>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
