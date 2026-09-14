"use client"

import { LoginForm } from "@/components/login-form"
import { Stethoscope } from "lucide-react"

export default function CadastroPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background text-foreground p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-semibold text-foreground font-display">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <Stethoscope className="size-4" />
          </div>
          <span className="text-lg tracking-tight">NotoMed</span>
        </div>
        <LoginForm initialMode="cadastro" />
      </div>
    </div>
  )
}
