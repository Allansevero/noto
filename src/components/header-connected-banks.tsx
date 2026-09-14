"use client"

import * as React from "react"
import {
  AvatarGroup,
  AvatarGroupTooltip,
  AvatarGroupBadge,
} from "@/components/animate-ui/components/animate/avatar-group"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Plus, Loader2, CircleSlash } from "lucide-react"
import { getPluggyConnectToken, syncPluggyAccounts } from "@/features/banking/services/pluggyClient.service"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface ConnectedBank {
  id: string
  name: string
  src: string
  fallback: string
  tooltip: string
  needsReconnect?: boolean
}

// Bancos padrão conectados: Nubank ativo e Itaú precisando reconectar para demonstrar o alerta visual
const DEFAULT_CONNECTED_BANKS: ConnectedBank[] = [
  {
    id: "nubank",
    name: "Nubank",
    src: "/bancos_svg/30680829.svg",
    fallback: "NU",
    tooltip: "Nubank • Conectado",
    needsReconnect: false,
  },
  {
    id: "itau",
    name: "Itaú Unibanco",
    src: "/bancos_svg/18189547.svg",
    fallback: "IT",
    tooltip: "Itaú Unibanco • Reconexão necessária",
    needsReconnect: true,
  },
]

interface HeaderConnectedBanksProps {
  medicoId?: string
}

export function HeaderConnectedBanks({ medicoId }: HeaderConnectedBanksProps) {
  const [banks, setBanks] = React.useState<ConnectedBank[]>(DEFAULT_CONNECTED_BANKS)
  const [syncTimeText, setSyncTimeText] = React.useState("há 14 minutos")
  const [isOpening, setIsOpening] = React.useState(false)

  // 1. Carregamento sob demanda do Pluggy Connect quando o usuário clicar em adicionar banco
  const ensurePluggyScript = React.useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || (window as any).PluggyConnect) {
        resolve()
        return
      }
      const scriptId = "pluggy-connect-cdn-script"
      if (document.getElementById(scriptId)) {
        resolve()
        return
      }
      const script = document.createElement("script")
      script.id = scriptId
      script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.7.0/pluggy-connect.js"
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => resolve()
      document.head.appendChild(script)
    })
  }, [])

  // 2. Busca contas bancárias e último log de sincronização
  React.useEffect(() => {
    if (!medicoId) return

    let isMounted = true
    async function fetchData() {
      try {
        // Busca contas bancárias
        const { data: contasData, error: contasError } = await supabase
          .from("medico_contas_bancarias")
          .select("id, banco_nome, banco_codigo, status_conexao")
          .eq("medico_id", medicoId)

        if (!contasError && contasData && contasData.length > 0 && isMounted) {
          const mapped: ConnectedBank[] = contasData.map((conta) => {
            const name = conta.banco_nome || "Banco Conectado"
            const initials = name
              .split(/\s+/)
              .map((w: string) => w[0]?.toUpperCase())
              .slice(0, 2)
              .join("") || "BC"

            let svg = "/bancos_svg/30680829.svg"
            if (name.toLowerCase().includes("itau") || conta.banco_codigo === "18189547") {
              svg = "/bancos_svg/18189547.svg"
            } else if (name.toLowerCase().includes("bradesco") || conta.banco_codigo === "00360305") {
              svg = "/bancos_svg/00360305.svg"
            } else if (name.toLowerCase().includes("santander") || conta.banco_codigo === "02038232") {
              svg = "/bancos_svg/02038232.svg"
            } else if (name.toLowerCase().includes("brasil") || conta.banco_codigo === "00000000") {
              svg = "/bancos_svg/00000000.svg"
            } else if (name.toLowerCase().includes("inter") || conta.banco_codigo === "00416968") {
              svg = "/bancos_svg/00416968.svg"
            }

            const needsReconnect =
              conta.status_conexao === "erro" ||
              conta.status_conexao === "expirado" ||
              conta.status_conexao === "atencao"

            return {
              id: conta.id,
              name,
              src: svg,
              fallback: initials,
              tooltip: needsReconnect ? `${name} • Reconexão necessária` : `${name} • Conectado`,
              needsReconnect,
            }
          })

          setBanks(mapped)
        }

        // Busca o último log para o tempo relativo de sincronização
        const { data: logsData } = await supabase
          .from("noto_sync_logs")
          .select("criado_em")
          .eq("medico_id", medicoId)
          .order("criado_em", { ascending: false })
          .limit(1)

        if (logsData && logsData[0]?.criado_em && isMounted) {
          const diffMs = Date.now() - new Date(logsData[0].criado_em).getTime()
          const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)))
          if (diffMin < 60) {
            setSyncTimeText(`há ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`)
          } else {
            const diffHours = Math.floor(diffMin / 60)
            setSyncTimeText(`há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`)
          }
        }
      } catch (err) {
        console.warn("[HeaderConnectedBanks] Falha ao consultar dados:", err)
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [medicoId])

  // 3. Abre o fluxo de conexão do Pluggy Connect ao clicar no '+'
  const handleOpenPluggy = async () => {
    setIsOpening(true)
    try {
      await ensurePluggyScript()
      const targetId = medicoId || "medico-demo"
      const tokenRes = await getPluggyConnectToken(targetId)
      if (!tokenRes.success || !tokenRes.connectToken) {
        console.error("Falha ao obter token da Pluggy:", tokenRes.error)
        setIsOpening(false)
        return
      }

      if (typeof window !== "undefined" && (window as any).PluggyConnect) {
        const pluggy = new (window as any).PluggyConnect({
          connectToken: tokenRes.connectToken,
          includeSandbox: true,
          onSuccess: async (data: { item?: { id?: string; connector?: { name?: string; id?: number } } }) => {
            const itemId = data?.item?.id
            const bankName = data?.item?.connector?.name || "Novo Banco"

            if (targetId && itemId) {
              await syncPluggyAccounts(targetId, itemId)
            }

            const initials = bankName
              .split(/\s+/)
              .map((w: string) => w[0]?.toUpperCase())
              .slice(0, 2)
              .join("") || "NB"

            setBanks((prev) => [
              ...prev,
              {
                id: itemId || `pluggy-${Date.now()}`,
                name: bankName,
                src: "/bancos_svg/30680829.svg",
                fallback: initials,
                tooltip: `${bankName} • Conectado`,
                needsReconnect: false,
              },
            ])

            setSyncTimeText("há poucos segundos")
            setIsOpening(false)
          },
          onError: (err: any) => {
            console.error("[Pluggy Header Error]:", err)
            setIsOpening(false)
          },
          onClose: () => {
            setIsOpening(false)
          },
        })

        pluggy.init()
      } else {
        setIsOpening(false)
      }
    } catch (err) {
      console.error("[HeaderConnectedBanks] Erro ao abrir Pluggy:", err)
      setIsOpening(false)
    }
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-transparent px-2.5 py-1 select-none shadow-2xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
      title="Bancos conectados ao Noto Sync"
    >
      {/* Grupo de avatares animados dos bancos conectados */}
      <AvatarGroup className="-space-x-2">
        {banks.map((bank) => (
          <Avatar
            key={bank.id}
            className={cn(
              "size-6 border-2 border-background bg-card overflow-hidden shadow-2xs transition-all",
              bank.needsReconnect && "ring-2 ring-rose-500 border-rose-500"
            )}
          >
            <AvatarImage
              src={bank.src}
              alt={bank.name}
              className="size-full object-contain p-0.5 bg-white dark:bg-zinc-900"
            />
            <AvatarFallback className="text-[9px] font-bold bg-muted text-foreground">
              {bank.fallback}
            </AvatarFallback>
            <AvatarGroupTooltip>{bank.tooltip}</AvatarGroupTooltip>
            {bank.needsReconnect && (
              <AvatarGroupBadge>
                <span
                  className="flex size-3.5 items-center justify-center rounded-full bg-rose-500 ring-1 ring-background text-white shadow-xs"
                  title="Reconexão necessária"
                >
                  <CircleSlash strokeWidth={1.75} className="size-2 text-white" />
                </span>
              </AvatarGroupBadge>
            )}
          </Avatar>
        ))}
      </AvatarGroup>

      {/* Botão '+' para adicionar banco e abrir o fluxo Pluggy */}
      <button
        type="button"
        onClick={handleOpenPluggy}
        disabled={isOpening}
        title="Adicionar conta bancária (Pluggy Connect)"
        aria-label="Adicionar banco"
        className="size-5.5 rounded-full border border-dashed border-border hover:border-foreground/50 bg-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {isOpening ? (
          <Loader2 className="size-3 animate-spin text-foreground" />
        ) : (
          <Plus className="size-3" />
        )}
      </button>

      {/* Texto de sincronização */}
      <span className="text-[11px] font-normal text-muted-foreground whitespace-nowrap pl-0.5 pr-1">
        Sincronizado {syncTimeText}
      </span>
    </div>
  )
}
