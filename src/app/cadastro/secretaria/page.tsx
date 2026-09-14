"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  UserCheck,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCurrentDoctor, saveLocalDoctorCache } from "@/features/auth/auth.repository"

export default function CadastroSecretariaPage() {
  const router = useRouter()

  const [nomeSecretaria, setNomeSecretaria] = React.useState("")
  const [emailSecretaria, setEmailSecretaria] = React.useState("")
  const [nomeMedico, setNomeMedico] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeSecretaria.trim() || !emailSecretaria.trim()) return

    setIsLoading(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("notomed_user_role", "secretaria")
        localStorage.setItem("notomed_secretaria_nome", nomeSecretaria.trim())
        localStorage.setItem("notomed_secretaria_email", emailSecretaria.trim())
        if (nomeMedico.trim()) {
          localStorage.setItem("notomed_primeiro_medico_nome", nomeMedico.trim())
        }
      }

      // Se já houver médico em cache, atualiza com o nome do médico desejado se informado
      const currentDoc = await getCurrentDoctor()
      if (currentDoc && nomeMedico.trim()) {
        const updated = {
          ...currentDoc,
          nome_completo: nomeMedico.trim(),
        }
        saveLocalDoctorCache(updated)
      }

      // Redireciona para o onboarding com flag de secretária
      router.push("/onboarding?role=secretaria")
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-zinc-950 text-foreground">
      {/* Header Oficial */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-zinc-950/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-vetor-noto.svg"
            alt="Logo NotoMed"
            width={28}
            height={25}
            className="h-6 w-auto object-contain"
            priority
          />
          <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
            NotoMed
          </span>
          <span className="text-xs text-neutral-400 font-normal">/</span>
          <span className="text-xs text-neutral-500 font-medium">Secretárias Remotas</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Plataforma Oficial</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
        <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-sm flex flex-col">
          {/* Tag de Destaque */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B7F20B]/20 text-neutral-950 text-xs font-semibold self-start mb-4">
            <Sparkles className="size-3.5" />
            <span>Acesso para Secretárias e Gestoras</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
            Cadastre seu primeiro médico no NotoMed
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
            Configure a emissão automática de notas fiscais. Você envia o XML e o Certificado A1. Na etapa do banco, geramos um link para o médico autorizar com total privacidade.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Seu Nome Completo (Secretária)
              </label>
              <Input
                type="text"
                required
                placeholder="Ex: Amanda Silva"
                value={nomeSecretaria}
                onChange={(e) => setNomeSecretaria(e.target.value)}
                className="h-10 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border-neutral-200 dark:border-neutral-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Seu E-mail de Trabalho
              </label>
              <Input
                type="email"
                required
                placeholder="secretaria@clinica.com.br"
                value={emailSecretaria}
                onChange={(e) => setEmailSecretaria(e.target.value)}
                className="h-10 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border-neutral-200 dark:border-neutral-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Nome do Primeiro Médico a Cadastrar</span>
                <span className="text-[10px] text-neutral-400 font-normal">Opcional</span>
              </label>
              <Input
                type="text"
                placeholder="Ex: Dr. Roberto Severo"
                value={nomeMedico}
                onChange={(e) => setNomeMedico(e.target.value)}
                className="h-10 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border-neutral-200 dark:border-neutral-700"
              />
            </div>

            {/* Destaques de Como Funciona */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/60 dark:border-neutral-800 my-1 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Você sobe o XML da última nota e o Certificado A1 do médico</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>O sistema gera o link para o médico conectar o banco dele</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Sua tela avança automaticamente assim que ele autorizar</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !nomeSecretaria.trim() || !emailSecretaria.trim()}
              className="w-full h-11 rounded-full font-bold text-sm bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Iniciando configuração...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Cadastro do Médico</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
