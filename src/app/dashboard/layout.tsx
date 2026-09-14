"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import type { DoctorProfile } from "@/features/auth/types"
import { ShieldCheck } from "lucide-react"
import { SandboxBanner } from "@/components/sandbox-banner"
import { EnvironmentProvider, useEnvironment } from "@/context/environment-context"
import { UserNav } from "@/components/user-nav"
import { HeaderConnectedBanks } from "@/components/header-connected-banks"

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [doctor, setDoctor] = React.useState<DoctorProfile | null>(null)
  const [, setIsLoading] = React.useState(true)
  const { isSandbox, setAmbiente } = useEnvironment()

  React.useEffect(() => {
    let mounted = true
    getCurrentDoctor().then(async (doc) => {
      if (!mounted) return
      setIsLoading(false)
      if (!doc) {
        router.push("/login")
        return
      }
      if (!doc.onboarding_concluido) {
        router.push("/onboarding")
        return
      }
      setDoctor(doc)

      // Regra Estrita: Notas em produção liberadas EXCLUSIVAMENTE para assinantes ativos no banco
      try {
        const { getDoctorSubscription } = await import("@/features/billing/billing.repository")
        const sub = await getDoctorSubscription(doc.id)
        if (sub.status === "ativa") {
          setAmbiente("producao")
        } else {
          setAmbiente("homologacao")
        }
      } catch {
        setAmbiente("homologacao")
      }
    })

    return () => {
      mounted = false
    }
  }, [router, setAmbiente])

  const handleExitSandbox = React.useCallback(async () => {
    if (!doctor?.id) {
      router.push("/dashboard/billing?reason=upgrade")
      return
    }
    try {
      const { getDoctorSubscription } = await import("@/features/billing/billing.repository")
      const sub = await getDoctorSubscription(doctor.id)
      if (sub.status === "ativa") {
        setAmbiente("producao")
      } else {
        router.push("/dashboard/billing?reason=upgrade")
      }
    } catch {
      router.push("/dashboard/billing?reason=upgrade")
    }
  }, [doctor?.id, router, setAmbiente])

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
      {/* Banner Sandbox */}
      <SandboxBanner
        isSandbox={isSandbox}
        onExitSandbox={handleExitSandbox}
        onEnterSandbox={() => setAmbiente("homologacao")}
      />

      {/* Header 100% largura */}
      <header className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-background/90 px-4 backdrop-blur-md relative">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-transparent shrink-0">
            <Image
              src="/logo-vetor-noto.svg"
              alt="Logo NotoMed"
              width={22}
              height={20}
              className="h-5 w-auto object-contain"
              priority
            />
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">NotoMed</span>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">/</span>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Painel</span>
        </div>

        {/* Centro do header: Tag pill com radium 100%, sem fundo, somente com linha */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-auto">
          <HeaderConnectedBanks medicoId={doctor?.id} />
        </div>

        <div className="flex items-center gap-3">

          {isSandbox ? (
            <button
              type="button"
              onClick={handleExitSandbox}
              className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/25 hover:bg-amber-500/20 transition-colors cursor-pointer select-none"
              title="Ambiente de Testes (Sem valor fiscal). Clique para emitir notas reais."
            >
              <ShieldCheck className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span>Sandbox</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAmbiente("homologacao")}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              title="Produção Ativa. Clique para voltar ao Sandbox."
            >
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Produção</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
            <UserNav doctor={doctor} />
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <SidebarProvider defaultOpen={false}>
        <div className="flex flex-1 min-h-0">
          <AppSidebar
            doctorName={doctor?.nome_completo || "Dr. Médico"}
            doctorCnpj={doctor?.cnpj || undefined}
          />
          <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="w-full flex flex-col items-center">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EnvironmentProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </EnvironmentProvider>
  )
}
