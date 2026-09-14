"use client"

import * as React from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePluggyConnect } from "@/features/banking/hooks/usePluggyConnect"
import { syncPluggyAccounts } from "@/features/banking/services/pluggyClient.service"

interface MedicoInfo {
  id: string
  nome_completo: string
  cnpj?: string
}

interface SecretariaInfo {
  nome: string
  email?: string
}

interface ContaInfo {
  id: string
  banco_nome: string
  agencia?: string
  numero_conta?: string
  tipo_conta?: string
}

export default function ConectarBancoMedicoPage() {
  const params = useParams()
  const token = params?.token as string

  const [isLoadingInfo, setIsLoadingInfo] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [medico, setMedico] = React.useState<MedicoInfo | null>(null)
  const [secretaria, setSecretaria] = React.useState<SecretariaInfo | null>(null)
  const [contas, setContas] = React.useState<ContaInfo[]>([])
  const [isSuccess, setIsSuccess] = React.useState(false)

  // 1. Carrega dados do link seguro ao entrar
  React.useEffect(() => {
    if (!token) return

    let mounted = true
    async function loadLinkData() {
      setIsLoadingInfo(true)
      setErrorMessage(null)
      try {
        const res = await fetch(`/api/banking/connection-link?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        if (!mounted) return

        if (!res.ok || !data.success) {
          setErrorMessage(data.error || "Link de conexão inválido ou expirado.")
          setIsLoadingInfo(false)
          return
        }

        setMedico(data.medico)
        setSecretaria(data.secretaria)
        if (data.jaConectado && data.contas?.length > 0) {
          setContas(data.contas)
          setIsSuccess(true)
        }
      } catch {
        if (mounted) {
          setErrorMessage("Erro ao carregar dados de autorização.")
        }
      } finally {
        if (mounted) {
          setIsLoadingInfo(false)
        }
      }
    }

    loadLinkData()
    return () => {
      mounted = false
    }
  }, [token])

  // 2. Hook Pluggy Connect integrado para o médico conectar
  const { isOpening, isSyncing, openPluggyConnect } = usePluggyConnect({
    medicoId: medico?.id,
    onAccountsUpdated: (updatedContas) => {
      if (updatedContas && updatedContas.length > 0) {
        setContas(
          updatedContas.map((c) => ({
            id: c.id,
            banco_nome: c.banco_nome || "Banco Conectado",
            agencia: c.agencia || undefined,
            numero_conta: c.numero_conta,
            tipo_conta: c.tipo_conta || undefined,
          }))
        )
        setIsSuccess(true)
      }
    },
  })

  // Conexão via Pluggy Connect
  const handleConectarBanco = () => {
    if (!medico?.id) return
    openPluggyConnect()
  }

  const doctorFirstName = medico?.nome_completo
    ? medico.nome_completo.replace(/^(Dr\.|Dra\.|Dr\(a\)\.|Dr|Dra)\s*/i, "").trim().split(" ")[0]
    : "Doutor(a)"

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-zinc-950 text-foreground selection:bg-[#B7F20B]/30">
      {/* Header Oficial NotoMed */}
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
          <span className="text-xs text-neutral-500 font-medium">Open Finance</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full ring-1 ring-emerald-500/20">
          <ShieldCheck className="size-3.5" />
          <span>Ambiente Seguro e Criptografado</span>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
        {isLoadingInfo && (
          <div className="flex flex-col items-center gap-3 text-center py-16">
            <Loader2 className="size-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-neutral-500">Validando link de autorização bancária...</p>
          </div>
        )}

        {errorMessage && !isLoadingInfo && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
            <div className="size-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="size-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Link Indisponível
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed mb-6">
              {errorMessage}
            </p>
            <p className="text-xs text-neutral-400">
              Solicite um novo link à sua secretária remota ou acesse o NotoMed diretamente.
            </p>
          </div>
        )}

        {/* TELA DE SUCESSO E CONFIRMAÇÃO DO MÉDICO */}
        {isSuccess && !isLoadingInfo && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
            <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="size-7 stroke-[2.2]" />
            </div>

            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Conta Conectada com Sucesso!
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed mb-6">
              Obrigado, <strong>Dr(a). {doctorFirstName}</strong>. Sua conta bancária foi autorizada via Open Finance e já está vinculada ao seu consultório no NotoMed.
            </p>

            {/* Card com dados da conta conectada */}
            {contas.length > 0 && (
              <div className="w-full bg-neutral-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {contas[0].banco_nome}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      Agência {contas[0].agencia || "—"} • Conta {contas[0].numero_conta}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    Ativa
                  </span>
                </div>
              </div>
            )}

            {/* Aviso ao médico */}
            <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs text-left mb-6 leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" />
                O que acontece agora?
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                Sua secretária (<strong>{secretaria?.nome || "Secretária"}</strong>) já recebeu a confirmação em tempo real na tela dela. O NotoMed está gerando a primeira NFS-e de teste e o sistema passará a faturar suas consultas automaticamente assim que os pagamentos caírem.
              </p>
            </div>

            <p className="text-xs text-neutral-400">
              Você já pode fechar esta aba com total segurança.
            </p>
          </div>
        )}

        {/* TELA DE AUTORIZAÇÃO / CONEXÃO DO MÉDICO */}
        {!isSuccess && !errorMessage && !isLoadingInfo && medico && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
            {/* Tag de Contexto */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium mb-4">
              <Building2 className="size-3.5" />
              <span>Conexão Solicitada pela Secretária</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
              Olá, Dr(a). {doctorFirstName}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed mb-6">
              Sua secretária <strong>{secretaria?.nome || "remota"}</strong> configurou seus dados fiscais e certificado no NotoMed. Agora, precisamos conectar a sua conta bancária de recebimentos para que o sistema emita suas notas fiscais automaticamente após cada consulta.
            </p>

            {/* Garantias de Segurança Open Finance */}
            <div className="w-full bg-neutral-50 dark:bg-zinc-800/40 rounded-2xl p-4 border border-neutral-200/70 dark:border-neutral-800 mb-6 text-left space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                <Lock className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Estritamente somente leitura:</strong> O NotoMed não realiza transferências, não movimenta saldo e não tem acesso às suas senhas bancárias.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Open Finance Oficial:</strong> Regulamentado e fiscalizado pelo Banco Central do Brasil.
                </span>
              </div>
            </div>

            {/* Botão Principal de Conexão */}
            <Button
              type="button"
              size="lg"
              disabled={isOpening || isSyncing}
              onClick={handleConectarBanco}
              className="w-full h-12 rounded-full font-bold text-sm bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isOpening || isSyncing ? (
                <>
                  <Loader2 className="size-4.5 animate-spin" />
                  <span>Conectando com segurança...</span>
                </>
              ) : (
                <>
                  <span>Conectar Minha Conta Bancária</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <p className="text-[11px] text-neutral-400 mt-4 leading-relaxed">
              Ao clicar, você será redirecionado para o ambiente seguro do seu banco para autenticar a leitura do extrato.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
