"use client"

import * as React from "react"
import {
  ArrowUpRight,
  ShieldCheck,
  Lock,
  EyeOff,
  Building2,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CircleSlash,
  CloudCheck,
  Wallet,
  Plus,
  Search,
  Check,
  Loader2,
} from "lucide-react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"
import { getPluggyConnectToken, syncPluggyAccounts } from "@/features/banking/services/pluggyClient.service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export type SyncStatus = "connected" | "error" | "syncing" | "disconnected"

export interface BancoItem {
  id: string
  code: string
  nome: string
  subtitulo: string
  svgFile: string
  bgIconColor: string
  isNu?: boolean
  status?: SyncStatus
  lastSync?: string
}

export const ALL_BANCOS: BancoItem[] = [
  {
    id: "nubank",
    code: "30680829",
    nome: "Nubank",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "30680829.svg",
    bgIconColor: "var(--color-purple-800, #581c87)",
    isNu: true,
    status: "connected",
    lastSync: "Hoje, 14:30",
  },
  {
    id: "itau",
    code: "18189547",
    nome: "Itaú Unibanco",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "18189547.svg",
    bgIconColor: "#ec7000",
    status: "error",
    lastSync: "Ontem, 09:15",
  },
  {
    id: "bradesco",
    code: "00360305",
    nome: "Bradesco",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "00360305.svg",
    bgIconColor: "#cc092f",
    status: "disconnected",
  },
  {
    id: "santander",
    code: "02038232",
    nome: "Santander",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "02038232.svg",
    bgIconColor: "#ec0000",
    status: "disconnected",
  },
  {
    id: "bb",
    code: "00000000",
    nome: "Banco do Brasil",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "00000000.svg",
    bgIconColor: "#fcfc30",
    status: "disconnected",
  },
  {
    id: "caixa",
    code: "01181521",
    nome: "Caixa Econômica",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "01181521.svg",
    bgIconColor: "#0066b3",
    status: "disconnected",
  },
  {
    id: "inter",
    code: "00416968",
    nome: "Banco Inter",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "00416968.svg",
    bgIconColor: "#ff7a00",
    status: "disconnected",
  },
  {
    id: "c6",
    code: "06271464",
    nome: "C6 Bank",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "06271464.svg",
    bgIconColor: "#1f1f1f",
    status: "disconnected",
  },
  {
    id: "btg",
    code: "07138049",
    nome: "BTG Pactual",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "07138049.svg",
    bgIconColor: "#001e62",
    status: "disconnected",
  },
  {
    id: "picpay",
    code: "29162769",
    nome: "PicPay",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "29162769.svg",
    bgIconColor: "#11c76f",
    status: "disconnected",
  },
  {
    id: "pagbank",
    code: "08561701",
    nome: "PagBank",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "08561701.svg",
    bgIconColor: "#00a868",
    status: "disconnected",
  },
  {
    id: "sicoob",
    code: "10573521",
    nome: "Sicoob",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "10573521.svg",
    bgIconColor: "#003641",
    status: "disconnected",
  },
  {
    id: "sicredi",
    code: "31872495",
    nome: "Sicredi",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "31872495.svg",
    bgIconColor: "#007a33",
    status: "disconnected",
  },
  {
    id: "cora",
    code: "37241230",
    nome: "Cora",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "37241230.svg",
    bgIconColor: "#fe3e6d",
    status: "disconnected",
  },
  {
    id: "asaas",
    code: "19540550",
    nome: "Asaas",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "19540550.svg",
    bgIconColor: "#0030b9",
    status: "disconnected",
  },
  {
    id: "nupagamentos",
    code: "18236120",
    nome: "Nu Pagamentos",
    subtitulo: "Noto Sync com Pluggy",
    svgFile: "18236120.svg",
    bgIconColor: "var(--color-purple-800, #581c87)",
    isNu: true,
    status: "disconnected",
  },
]

export const BANCOS_SYNC = ALL_BANCOS

function NubankWhiteSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M205.14 342.59H249c.01-.18.03-.35.05-.51.03-.33.06-.62.06-.91-.02-8.74-.03-17.48-.05-26.22-.04-24.28-.08-48.55-.19-72.83-.05-11.01-.65-21.96-3.62-32.64-3.73-13.42-10.18-25.15-21.45-33.75-21.25-16.22-53.32-13.8-72.68 5.39-.39.4-.86.72-1.38.94-.52.22-1.07.33-1.64.33-.57.04-1.15.07-1.72.11-3.32.2-6.64.41-9.89 1.02-24.13 4.53-42.88 24.4-45.61 48.8-.87 7.91-.87 15.95-.87 23.93-.06 20.68-.03 41.35 0 62.03l.03 22.01v2.25h43.95v-82.18c0-2.64-.04-5.28-.08-7.92-.06-4.31-.12-8.63-.03-12.94l.06-3.22c.14-7.23.28-14.5 1.04-21.67 1.23-11.65 5.7-22.06 13.75-30.77.63-.7 1.49-1.13 2.43-1.21 10.33.11 20.09 2.44 28.88 8.05 12.99 8.31 19.87 20.66 23.1 35.38 1.83 8.32 1.84 16.79 1.86 25.25v2.51c.09 20.61.1 41.23.1 61.84 0 8.24 0 16.49.02 24.74v2.2zm216.85-173.22h-43.91v22.67c.05 27.43.09 54.86.13 82.29v.24c.03 8.56.06 17.13-1.48 25.6-1.92 10.58-6.07 20.1-13.43 28.06-.57.65-1.37 1.07-2.23 1.18-11.18-.06-21.61-2.78-30.85-9.25-12-8.4-18.33-20.38-21.35-34.39-1.82-8.41-1.84-16.98-1.86-25.52v-2.24c-.09-20.8-.1-41.61-.11-62.42 0-8.05 0-16.11-.02-24.16v-2.01h-43.84c-.01.17-.03.33-.04.46-.03.29-.05.5-.05.72.03 9.56.05 19.12.07 28.68.05 25.34.11 50.68.3 76.01.06 10.48 1.26 20.88 4.58 30.91 4.4 13.33 11.63 24.65 23.64 32.38 21.32 13.7 51.11 10.37 69.34-7.7.39-.41.85-.74 1.37-.96.52-.22 1.08-.33 1.65-.32 2.86-.04 5.72-.24 8.55-.61 26.39-3.56 47.08-25.27 49.03-51.82.53-7.02.52-14.08.51-21.13V169.36z"
        fill="#ffffff"
        fillRule="evenodd"
      />
    </svg>
  )
}

/**
 * Switch customizado com os ícones CircleSlash e CloudCheck dentro do thumb
 */
interface BankIconSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}

function BankIconSwitch({ checked, onCheckedChange, label }: BankIconSwitchProps) {
  return (
    <SwitchPrimitives.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
      )}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      >
        {checked ? (
          <CloudCheck strokeWidth={1.75} className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <CircleSlash strokeWidth={1.75} className="w-3 h-3 text-slate-500" />
        )}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
}

/**
 * Badge de status da conta conectada
 */
function StatusBadge({ status }: { status: SyncStatus }) {
  switch (status) {
    case "connected":
      return (
        <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
          Conectado
        </span>
      )
    case "error":
      return (
        <span className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" />
          Falha na Sincronização
        </span>
      )
    case "syncing":
      return (
        <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          <RefreshCw className="w-3.5 h-3.5 mr-1 text-blue-600 animate-spin shrink-0" />
          Sincronizando
        </span>
      )
    default:
      return null
  }
}

/**
 * Card individual de banco (300px x 200px, fundo #F3F3F3, sem border)
 */
interface NotoSyncBankCardProps {
  banco: BancoItem
  onOpenSecurity: (banco: BancoItem) => void
  onToggleStatus?: (bancoId: string, checked: boolean) => void
  onManualSync?: (bancoId: string) => void
  onReconnect?: (bancoId: string) => void
}

export function NotoSyncBankCard({
  banco,
  onOpenSecurity,
  onToggleStatus,
  onManualSync,
  onReconnect,
}: NotoSyncBankCardProps) {
  const isConnected = banco.status === "connected" || banco.status === "syncing" || banco.status === "error"

  return (
    <div
      className={cn(
        "w-[300px] h-[200px] shrink-0 rounded-2xl p-4 flex flex-col justify-between border-0 select-none shadow-xs transition-all duration-150 hover:scale-[1.01]",
        banco.status === "error" && "ring-1 ring-rose-300"
      )}
      style={{ backgroundColor: "#F3F3F3" }}
    >
      {/* Topo: Ícone + Textos (extremidades superior e inferior) + Switch com ícones */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Container do ícone (h-10 w-10) */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs"
            style={{ backgroundColor: banco.bgIconColor }}
          >
            {banco.isNu ? (
              <NubankWhiteSvg className="w-6 h-6" />
            ) : (
              <img
                src={`/bancos_svg/${banco.svgFile}`}
                alt={banco.nome}
                className="w-6 h-6 object-contain rounded-md"
              />
            )}
          </div>

          {/* Textos em linha com o ícone: h3 na extremidade superior e subtítulo na inferior */}
          <div className="h-10 flex flex-col justify-between min-w-0 py-0.5">
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none truncate">
              {banco.nome}
            </h3>
            <p className="text-[10px] font-medium text-slate-500 leading-none truncate">
              {banco.subtitulo}
            </p>
          </div>
        </div>

        {/* Switch com CircleSlash e CloudCheck */}
        <div className="shrink-0 pl-1">
          <BankIconSwitch
            checked={isConnected}
            onCheckedChange={(checked) => onToggleStatus?.(banco.id, checked)}
            label={`Conexão com ${banco.nome}`}
          />
        </div>
      </div>

      {/* Meio: Conceito de conta conectada (Badge + Última sincronização + Ação) vs Descrição quando desconectado */}
      {isConnected ? (
        <div className="my-auto py-1 flex flex-col justify-center gap-2">
          <div>
            <StatusBadge status={banco.status || "connected"} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              {banco.status === "syncing"
                ? "Sincronizando..."
                : `Última sinc: ${banco.lastSync || "Agora mesmo"}`}
            </span>

            {banco.status === "error" ? (
              <button
                type="button"
                onClick={() => onReconnect?.(banco.id)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-100 hover:bg-rose-200/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                Reconectar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onManualSync?.(banco.id)}
                title="Sincronizar agora"
                disabled={banco.status === "syncing"}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={cn(
                    "w-3.5 h-3.5",
                    banco.status === "syncing" && "animate-spin text-blue-600"
                  )}
                />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="my-auto py-1">
          <p className="text-[13px] leading-[18px] text-slate-600 font-normal line-clamp-2">
            Conexão bancária direta com criptografia de ponta a ponta e total conformidade com o Open Finance.
          </p>
        </div>
      )}

      {/* Botão apenas 'Saiba mais' com ícone e fundo do card (#F3F3F3) */}
      <div>
        <button
          type="button"
          onClick={() => onOpenSecurity(banco)}
          className="w-full h-8 rounded-lg border border-emerald-600/40 hover:border-emerald-600 text-emerald-800 hover:text-emerald-900 text-xs font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-1.5 hover:bg-emerald-500/10 active:scale-[0.99] cursor-pointer"
          style={{ backgroundColor: "#F3F3F3" }}
        >
          <span>Saiba mais</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
        </button>
      </div>
    </div>
  )
}

/**
 * Banner de Aviso explicando a conexão segura NotoMed & Pluggy
 */
export function NotoSyncInfoBanner() {
  return (
    <div className="rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs bg-warning-300 text-warning">
      <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-warning" />
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-warning">
          Conexão Segura Open Finance (NotoMed & Pluggy)
        </h3>
        <p className="text-xs leading-relaxed text-warning/90">
          Suas contas são conectadas através de tecnologia Open Finance criptografada de ponta a ponta com a infraestrutura oficial da Pluggy, regulamentada pelo Banco Central. O NotoMed possui acesso exclusivamente somente leitura (Read-Only) aos dados estritamente necessários para conciliação e emissão automática de notas fiscais dos seus pacientes, sem qualquer autorização para saques, pagamentos ou transferências.
        </p>
      </div>
    </div>
  )
}

/**
 * Dashboard completo Noto Sync com áreas separadas e integração Pluggy
 */
export function NotoSyncDashboard() {
  const [bancos, setBancos] = React.useState<BancoItem[]>(ALL_BANCOS)
  const [selectedBanco, setSelectedBanco] = React.useState<BancoItem | null>(null)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = React.useState(false)
  const [isPluggyModalOpen, setIsPluggyModalOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [connectingBankId, setConnectingBankId] = React.useState<string | null>(null)

  // Separação em duas áreas: Contas Conectadas e Instituições Suportadas
  const connectedAccounts = bancos.filter(
    (b) => b.status === "connected" || b.status === "syncing" || b.status === "error"
  )
  const supportedBanks = bancos.filter(
    (b) => b.status === "disconnected" || !b.status
  )

  const handleOpenSecurity = (banco: BancoItem) => {
    setSelectedBanco(banco)
    setIsSecurityModalOpen(true)
  }

  const handleToggleStatus = (bancoId: string, checked: boolean) => {
    if (checked) {
      setBancos((prev) =>
        prev.map((b) =>
          b.id === bancoId
            ? { ...b, status: "syncing", lastSync: "Sincronizando..." }
            : b
        )
      )
      setTimeout(() => {
        setBancos((prev) =>
          prev.map((b) =>
            b.id === bancoId
              ? { ...b, status: "connected", lastSync: "Agora mesmo" }
              : b
          )
        )
      }, 1000)
    } else {
      setBancos((prev) =>
        prev.map((b) =>
          b.id === bancoId ? { ...b, status: "disconnected" } : b
        )
      )
    }
  }

  const handleManualSync = (bancoId: string) => {
    setBancos((prev) =>
      prev.map((b) =>
        b.id === bancoId ? { ...b, status: "syncing" } : b
      )
    )
    setTimeout(() => {
      setBancos((prev) =>
        prev.map((b) =>
          b.id === bancoId
            ? { ...b, status: "connected", lastSync: "Agora mesmo" }
            : b
        )
      )
    }, 1200)
  }

  const handleReconnect = (bancoId: string) => {
    setBancos((prev) =>
      prev.map((b) =>
        b.id === bancoId ? { ...b, status: "syncing" } : b
      )
    )
    setTimeout(() => {
      setBancos((prev) =>
        prev.map((b) =>
          b.id === bancoId
            ? { ...b, status: "connected", lastSync: "Agora mesmo" }
            : b
        )
      )
    }, 1500)
  }

  const [isConnectingPluggy, setIsConnectingPluggy] = React.useState(false)
  const [pluggyConnectError, setPluggyConnectError] = React.useState<string | null>(null)

  // Carrega o script oficial do Pluggy Connect v2 no navegador se ainda não estiver carregado
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).PluggyConnect) return
    const scriptId = "pluggy-connect-cdn-script"
    if (document.getElementById(scriptId)) return

    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.7.0/pluggy-connect.js"
    script.async = true
    document.head.appendChild(script)
  }, [])

  // Abre a conexão direta oficial via Pluggy Connect sobreposta à tela do NotoMed
  const handleOpenPluggyConnect = async (targetConnectorId?: number) => {
    setIsConnectingPluggy(true)
    setPluggyConnectError(null)

    try {
      const tokenRes = await getPluggyConnectToken("medico-demo", targetConnectorId)
      if (!tokenRes.success || !tokenRes.connectToken) {
        setPluggyConnectError(tokenRes.error || "Não foi possível gerar o token de conexão.")
        setIsConnectingPluggy(false)
        setIsPluggyModalOpen(true)
        return
      }

      if (typeof window !== "undefined" && (window as any).PluggyConnect) {
        const pluggy = new (window as any).PluggyConnect({
          connectToken: tokenRes.connectToken,
          includeSandbox: true,
          onSuccess: async (data: { item?: { id?: string; connector?: { name?: string; id?: number } } }) => {
            const itemId = data?.item?.id
            const bankName = data?.item?.connector?.name || "Banco Conectado"

            // Adiciona ou atualiza nas contas conectadas
            setBancos((prev) => {
              const exists = prev.find(
                (b) =>
                  b.nome.toLowerCase() === bankName.toLowerCase() ||
                  (targetConnectorId && b.code === String(targetConnectorId))
              )
              if (exists) {
                return prev.map((b) =>
                  b.id === exists.id ? { ...b, status: "connected", lastSync: "Agora mesmo" } : b
                )
              }
              return [
                {
                  id: `pluggy-${Date.now()}`,
                  code: String(targetConnectorId || ""),
                  nome: bankName,
                  subtitulo: "Noto Sync com Pluggy",
                  svgFile: "30680829.svg",
                  bgIconColor: "#059669",
                  status: "connected",
                  lastSync: "Agora mesmo",
                },
                ...prev,
              ]
            })

            // Sincroniza com o backend do NotoMed
            if (itemId) {
              await syncPluggyAccounts("medico-demo", itemId)
            }
            setIsConnectingPluggy(false)
            setIsPluggyModalOpen(false)
          },
          onError: (err: any) => {
            console.error("[Pluggy Widget Error]:", err)
            setPluggyConnectError(err?.message || "Erro na conexão com a Pluggy.")
            setIsConnectingPluggy(false)
          },
          onClose: () => {
            setIsConnectingPluggy(false)
          },
        })

        pluggy.init()
      } else {
        // Fallback: se o script do CDN ainda não estiver inicializado, abre modal auxiliar
        setIsPluggyModalOpen(true)
        setIsConnectingPluggy(false)
      }
    } catch (err: any) {
      setPluggyConnectError(err?.message || "Erro de conexão com o servidor.")
      setIsConnectingPluggy(false)
      setIsPluggyModalOpen(true)
    }
  }

  const handleConnectBankViaPluggy = (banco: BancoItem) => {
    handleOpenPluggyConnect(banco.code ? Number(banco.code) : undefined)
  }

  const filteredModalBanks = supportedBanks.filter((b) =>
    b.nome.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Sessão: Apenas um h1 sem descrição */}
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Noto Sync
        </h1>

        <button
          type="button"
          onClick={() => handleOpenPluggyConnect()}
          disabled={isConnectingPluggy}
          className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 gap-1.5 disabled:opacity-70"
        >
          {isConnectingPluggy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{isConnectingPluggy ? "Conectando..." : "Conectar nova conta"}</span>
        </button>
      </div>

      {/* 1. Aviso: text-warning bg-warning-300 */}
      <NotoSyncInfoBanner />

      {/* 2. Área: Contas Conectadas (sem ícone, descrição ou tag no h2) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Contas Conectadas
        </h2>

        {connectedAccounts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 max-w-xl">
            <p className="text-sm text-muted-foreground">
              Nenhuma conta bancária conectada no momento.
            </p>
            <button
              type="button"
              onClick={() => handleOpenPluggyConnect()}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Conectar primeira conta
            </button>
          </div>
        ) : (
          /* Grid estrito de 4 colunas com nossos cards 300x200 #F3F3F3 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-fit">
            {connectedAccounts.map((banco) => (
              <NotoSyncBankCard
                key={banco.id}
                banco={banco}
                onOpenSecurity={handleOpenSecurity}
                onToggleStatus={handleToggleStatus}
                onManualSync={handleManualSync}
                onReconnect={handleReconnect}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Área: Instituições Suportadas (sem ícone e descrição no h2) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Instituições Suportadas
        </h2>

        {/* Cada svg sem fundo ou container com linha em volta: somente ícone e nome em baixo */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 py-2">
          {supportedBanks.map((banco) => (
            <div
              key={banco.id}
              onClick={() => handleConnectBankViaPluggy(banco)}
              className="flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none group"
            >
              <img
                src={`/bancos_svg/${banco.svgFile}`}
                alt={banco.nome}
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-xs text-foreground font-medium text-center truncate w-full">
                {banco.nome}
              </span>
            </div>
          ))}
        </div>

        {/* Linhadinha de texto escrito: "Conectar outra instituição bancária ao Noto Sync" */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleOpenPluggyConnect()}
            disabled={isConnectingPluggy}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 flex items-center gap-1.5 cursor-pointer hover:gap-2 transition-all disabled:opacity-70"
          >
            <span>
              {isConnectingPluggy
                ? "Abrindo conexão segura Pluggy..."
                : "Conectar outra instituição bancária ao Noto Sync"}
            </span>
            {isConnectingPluggy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Modal de Conexão com a Pluggy */}
      <Dialog open={isPluggyModalOpen} onOpenChange={setIsPluggyModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-card text-card-foreground border-border/60">
          <DialogHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">
                    Conectar via Pluggy Open Finance
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Selecione seu banco para autenticar com segurança criptografada.
                  </DialogDescription>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Bacen ITP
              </span>
            </div>
          </DialogHeader>

          {pluggyConnectError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 my-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pluggyConnectError}</span>
            </div>
          )}

          {/* Busca de Banco */}
          <div className="relative my-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar banco ou instituição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/50 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Lista de Bancos no Modal */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 py-1">
            {filteredModalBanks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum banco encontrado para "{searchQuery}".
              </p>
            ) : (
              filteredModalBanks.map((banco) => {
                const isConnecting = connectingBankId === banco.id
                return (
                  <button
                    key={banco.id}
                    type="button"
                    onClick={() => handleConnectBankViaPluggy(banco)}
                    disabled={isConnecting}
                    className="w-full p-2.5 rounded-xl border border-border/40 hover:border-emerald-500/40 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer disabled:opacity-60 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center p-1 shrink-0 shadow-2xs"
                        style={{ backgroundColor: banco.bgIconColor }}
                      >
                        {banco.isNu ? (
                          <NubankWhiteSvg className="w-4 h-4" />
                        ) : (
                          <img
                            src={`/bancos_svg/${banco.svgFile}`}
                            alt={banco.nome}
                            className="w-4 h-4 object-contain rounded"
                          />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {banco.nome}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {banco.subtitulo}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isConnecting ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Conectando...</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors">
                          Conectar
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-[11px]">
              <Lock className="w-3 h-3 text-emerald-600" /> Acesso Read-Only seguro
            </span>
            <button
              type="button"
              onClick={() => setIsPluggyModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs border border-border text-foreground hover:bg-muted font-medium transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Segurança Pluggy (acionado pelo botão Saiba Mais) */}
      <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-card text-card-foreground border-border/60">
          <DialogHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Segurança Pluggy Open Finance
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Infraestrutura oficial regulamentada pelo Banco Central do Brasil.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs leading-relaxed">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <Building2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Regulado pelo Banco Central do Brasil
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  A Pluggy é uma instituição autorizada e regulamentada pelo Bacen no âmbito do Open Finance Brasil como Iniciadora de Pagamentos (ITP).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Criptografia de Nível Bancário (AES-256)
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Todas as comunicações utilizam criptografia de ponta a ponta (AES-256 e TLS 1.3), o mesmo padrão de segurança dos maiores bancos do mundo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <EyeOff className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Acesso Estritamente Somente Leitura (Read-Only)
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  O NotoMed e a Pluggy NUNCA podem realizar saques, transferências ou pagamentos. O acesso limita-se exclusivamente a verificar recebimentos de pacientes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Privacidade Total e Conformidade LGPD
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Seus dados financeiros não são compartilhados com terceiros. Certificação ISO 27001 contínua e total conformidade com a LGPD.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
            <a
              href="https://pluggy.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              Conhecer a Pluggy (pluggy.ai)
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>

            <button
              type="button"
              onClick={() => setIsSecurityModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Compatibilidade de export para o componente legado
export const NotoSyncCardsGrid = NotoSyncDashboard
