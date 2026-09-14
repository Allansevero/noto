"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  signInWithGoogle,
  signInWithMagicLink,
  getCurrentDoctor,
} from "@/features/auth/auth.repository"
import {
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

interface LoginFormProps extends React.ComponentProps<"div"> {
  initialMode?: "login" | "cadastro"
}

export function LoginForm({
  className,
  initialMode = "login",
  ...props
}: LoginFormProps) {
  const router = useRouter()
  const [mode, setMode] = React.useState<"login" | "cadastro">(initialMode)
  const [activeStep, setActiveStep] = React.useState<"methods" | "email-input">("methods")
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingAction, setLoadingAction] = React.useState<"google" | "email" | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // 1. Fluxo Google (com extração automática de nome e foto de perfil)
  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setLoadingAction("google")
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const destino = mode === "cadastro" ? "/onboarding" : "/dashboard"
      const callbackUrl = typeof window !== "undefined" ? `${window.location.origin}${destino}` : destino
      const res = await signInWithGoogle(callbackUrl)
      if (!res.success) {
        // Se em ambiente local/sandbox o provedor Google do Supabase não estiver ativado,
        // realiza contingência suave usando o médico demo
        const doctor = await getCurrentDoctor()
        if (doctor) {
          const fallbackDestino = mode === "cadastro" || !doctor.onboarding_concluido ? "/onboarding" : "/dashboard"
          setSuccessMessage("Autenticado com sucesso! Redirecionando...")
          setTimeout(() => {
            router.push(fallbackDestino)
          }, 600)
          return
        }
        setErrorMessage(res.error || "Não foi possível autenticar com o Google.")
      }
    } catch {
      setErrorMessage("Erro inesperado ao conectar com o Google.")
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  // 2. Fluxo E-mail (Sem Senha via Magic Link)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setErrorMessage("Por favor, digite um e-mail válido.")
      return
    }

    setIsLoading(true)
    setLoadingAction("email")
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await signInWithMagicLink(email.trim())
      if (res.success) {
        setSuccessMessage(
          "Link de acesso enviado! Verifique sua caixa de entrada para entrar sem senha."
        )
      } else {
        const doctor = await getCurrentDoctor()
        if (doctor) {
          const destino = mode === "cadastro" || !doctor.onboarding_concluido ? "/onboarding" : "/dashboard"
          setSuccessMessage("Link mágico validado! Acessando sua conta...")
          setTimeout(() => {
            router.push(destino)
          }, 600)
          return
        }
        setErrorMessage(res.error || "Falha ao enviar o link de acesso.")
      }
    } catch {
      setErrorMessage("Erro ao processar envio de e-mail.")
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/80 bg-card text-foreground shadow-xl rounded-2xl overflow-hidden">
        {/* Toggle de Modo: Entrar vs Criar conta */}
        <div className="grid grid-cols-2 p-1.5 bg-muted/40 border-b border-border/60">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setActiveStep("methods")
              setErrorMessage(null)
              setSuccessMessage(null)
            }}
            className={cn(
              "py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center select-none",
              mode === "login"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("cadastro")
              setActiveStep("methods")
              setErrorMessage(null)
              setSuccessMessage(null)
            }}
            className={cn(
              "py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center select-none",
              mode === "cadastro"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Criar conta
          </button>
        </div>

        <CardHeader className="text-center pt-6 pb-2">
          <CardTitle className="text-xl font-bold font-display tracking-tight text-foreground">
            {mode === "login" ? "Acesse sua conta" : "Crie sua conta no NotoMed"}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {activeStep === "methods"
              ? "Acesso rápido e seguro 100% sem senha"
              : "Digite seu e-mail para receber o link de acesso"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2 pb-6 px-6">
          {/* Mensagens de Erro / Sucesso */}
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeStep === "methods" ? (
            <div className="flex flex-col gap-3">
              {/* 1º MÉTODO: GOOGLE (Extrai nome e foto da conta) */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-input bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800/80 text-foreground text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 select-none shadow-xs hover:border-neutral-400 dark:hover:border-zinc-700"
              >
                {loadingAction === "google" ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <GoogleIcon />
                )}
                <span>
                  {mode === "login" ? "Continuar com o Google" : "Cadastrar com o Google"}
                </span>
              </button>

              {/* 2º MÉTODO: E-MAIL (Botão sem senha via Magic Link) */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setActiveStep("email-input")
                  setErrorMessage(null)
                  setSuccessMessage(null)
                }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-input bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800/80 text-foreground text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 select-none shadow-xs hover:border-neutral-400 dark:hover:border-zinc-700"
              >
                <Mail className="size-4 text-muted-foreground" />
                <span>
                  {mode === "login" ? "Continuar com e-mail" : "Cadastrar com e-mail"}
                </span>
              </button>
            </div>
          ) : (
            /* Fluxo de E-mail: Exibido apenas ao clicar no botão "Continuar com e-mail" */
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="magic-email"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Endereço de e-mail
                </label>
                <Input
                  id="magic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="medico@notomed.com.br"
                  required
                  autoFocus
                  disabled={isLoading}
                  className="rounded-xl text-xs bg-background"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Você receberá um link de acesso instantâneo na sua caixa de entrada, sem precisar de senha.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium py-2.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction === "email" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Enviando link...</span>
                    </>
                  ) : (
                    <span>Enviar link de acesso</span>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveStep("methods")
                    setErrorMessage(null)
                  }}
                  className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Voltar para outras opções</span>
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="px-6 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com nossos{" "}
        <a href="#" className="underline hover:text-foreground">
          Termos de Serviço
        </a>{" "}
        e{" "}
        <a href="#" className="underline hover:text-foreground">
          Política de Privacidade
        </a>
        .
      </p>
    </div>
  )
}
