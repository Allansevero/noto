"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Cloud,
  CreditCard,
  Keyboard,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  PlusCircle,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react"

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileDrawer } from "@/components/profile-drawer"
import { supabase } from "@/lib/supabase/client"
import type { DoctorProfile } from "@/features/auth/types"

interface UserNavProps {
  doctor: DoctorProfile | null
}

export function UserNav({ doctor }: UserNavProps) {
  const router = useRouter()
  const [currentDoctor, setCurrentDoctor] = React.useState(doctor)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)

  React.useEffect(() => {
    setCurrentDoctor(doctor)
  }, [doctor])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Erro ao sair:", err)
    } finally {
      router.push("/login")
    }
  }

  // Obter iniciais (ex: "Dr. Roberto Silva" -> "RS")
  const initials = currentDoctor?.nome_completo
    ? currentDoctor.nome_completo
        .replace(/^Dr\.\s*/i, "")
        .trim()
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "DR"
    : "DR"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Minha conta"
            className="relative flex items-center gap-2 rounded-full p-0.5 outline-none hover:ring-2 hover:ring-ring/30 transition-all cursor-pointer select-none"
          >
            <Avatar className="size-8 cursor-pointer">
              <AvatarImage src={currentDoctor?.avatar_url || ""} alt={currentDoctor?.nome_completo || "Avatar"} />
              <AvatarFallback className="bg-muted text-foreground font-semibold text-xs border border-border">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-semibold leading-none text-foreground">
                {currentDoctor?.nome_completo || "Minha Conta"}
              </p>
              <p className="text-[11px] leading-none text-muted-foreground truncate">
                {currentDoctor?.email || "dr.teste@notomed.com.br"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/billing")} className="cursor-pointer flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing & Planos</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-60 flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </div>
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                EM BREVE
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="cursor-not-allowed opacity-60 flex items-center justify-between">
              <div className="flex items-center">
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Keyboard shortcuts</span>
              </div>
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                EM BREVE
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4" />
            <span>Team</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Invite users</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Message</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>More...</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Team</span>
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.open("https://github.com", "_blank")}
        >
          <GithubIcon className="mr-2 h-4 w-4" />
          <span>GitHub</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Cloud className="mr-2 h-4 w-4" />
          <span>API</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        doctor={currentDoctor}
        onProfileUpdated={(updated) => {
          setCurrentDoctor((prev) => (prev ? { ...prev, ...updated } : prev))
        }}
      />
    </>
  )
}
