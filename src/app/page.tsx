"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, LogIn, Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    getCurrentDoctor().then((doctor) => {
      if (doctor) {
        if (doctor.onboarding_concluido) {
          router.replace("/dashboard")
        } else {
          router.replace("/onboarding")
        }
      } else {
        setCheckingAuth(false)
      }
    })
  }, [router])

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-emerald-500" />
          <p className="text-xs text-muted-foreground font-medium">Carregando NotoMed...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full shadow-lg border-slate-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold font-display">NotoMed</CardTitle>
          <CardDescription className="font-sans">
            Ambiente Next.js + Supabase Auth + shadcn/ui configurado e pronto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/80 text-xs font-mono text-slate-600">
            <span>Status Supabase:</span>
            <span className="font-semibold text-emerald-700">
              {isSupabaseConfigured ? "Conectado (.env)" : "Pendente"}
            </span>
          </div>

          <Link href="/login" className="w-full">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
              <LogIn className="w-4 h-4 mr-2" />
              Acessar Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
