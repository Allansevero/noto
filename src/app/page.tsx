"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    getCurrentDoctor()
      .then((doctor) => {
        if (!mounted) return
        if (doctor) {
          if (doctor.onboarding_concluido) {
            router.replace("/dashboard")
          } else {
            router.replace("/onboarding")
          }
        } else {
          // Não autenticado: redireciona diretamente para a tela de login
          router.replace("/login")
        }
      })
      .catch(() => {
        if (mounted) {
          router.replace("/login")
        }
      })

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-2 shadow-sm">
          <Image
            src="/logo-vetor-noto.svg"
            alt="Logo NotoMed"
            width={32}
            height={30}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <Loader2 className="size-4 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span>Carregando NotoMed...</span>
        </div>
      </div>
    </main>
  )
}
