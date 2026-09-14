"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { supabase } from "@/lib/supabase/client"

/**
 * Intervalo entre chamadas à Edge Function poll-payment enquanto o
 * usuário está na Etapa 3 aguardando o PIX de R$ 0,01.
 *
 * Valor default: 30 segundos. A UI reage via Realtime (push instantâneo),
 * não via retorno do poll — portanto aumentar esse intervalo não prejudica
 * a experiência do usuário.
 */
const POLL_INTERVAL_MS = 30_000

export interface TransacaoDetectada {
  id: string
  descricao: string
  valor: number
  data: string
  dataHora: string
  tipo: string
  pagador: string
}

interface UseOnboardingPaymentPollProps {
  /** ID do médico autenticado. Hook permanece inativo enquanto ausente. */
  medicoId: string | undefined
  /** ID da conta Pluggy a monitorar. Hook permanece inativo enquanto ausente. */
  pluggyAccountId: string | undefined
  /**
   * Data mínima de compliance (ISO string). Transações anteriores a esta
   * data são ignoradas para evitar emissão retroativa indevida.
   */
  minDate?: string
  /** Callback chamado assim que o PIX for detectado e confirmado. */
  onPaymentFound: (transacao: TransacaoDetectada) => void
  /**
   * Controla se o hook está ativo. Passe `true` somente quando o usuário
   * estiver na Etapa 3 do onboarding com conta bancária já conectada.
   */
  active: boolean
}

interface UseOnboardingPaymentPollReturn {
  /** true enquanto o polling estiver ativo e aguardando o PIX */
  isPollActive: boolean
  /** Erro da última chamada à Edge Function, se houver */
  lastError: string | null
  /** Número de chamadas realizadas à Edge Function nesta sessão */
  pollCount: number
}

/**
 * Hook que gerencia o polling de pagamento do onboarding sem Vercel Cron.
 *
 * Estratégia:
 * 1. Ao ativar, faz upsert de uma linha em `onboarding_payment_polls`
 *    com status='waiting'.
 * 2. Abre uma subscription Realtime nessa linha.
 * 3. Chama imediatamente a Edge Function `poll-payment` via
 *    `supabase.functions.invoke`.
 * 4. Repete a chamada a cada POLL_INTERVAL_MS para manter o worker ativo.
 * 5. Ao receber status='found' via Realtime, chama `onPaymentFound` e
 *    encerra o polling.
 * 6. Ao desmontar ou desativar, cancela a subscription e o interval.
 */
export function useOnboardingPaymentPoll({
  medicoId,
  pluggyAccountId,
  minDate,
  onPaymentFound,
  active,
}: UseOnboardingPaymentPollProps): UseOnboardingPaymentPollReturn {
  const [isPollActive, setIsPollActive] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const isFoundRef = useRef(false)

  /** Invoca a Edge Function e atualiza contadores locais. */
  const invokePollEdgeFunction = useCallback(async () => {
    if (!medicoId || !pluggyAccountId || isFoundRef.current) return

    try {
      const { data, error } = await supabase.functions.invoke("poll-payment", {
        body: { medicoId, accountId: pluggyAccountId, minDate },
      })

      if (!isMountedRef.current) return

      if (error) {
        setLastError(error.message ?? "Erro na Edge Function poll-payment.")
        return
      }

      setPollCount((c) => c + 1)
      setLastError(null)

      // Se a Edge Function encontrou o pagamento mas o Realtime ainda não
      // disparou, processa diretamente aqui como fallback.
      if (data?.found && data?.transacao && !isFoundRef.current) {
        isFoundRef.current = true
        setIsPollActive(false)
        onPaymentFound(data.transacao as TransacaoDetectada)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setLastError(err instanceof Error ? err.message : "Erro de conexão na Edge Function.")
      }
    }
  }, [medicoId, pluggyAccountId, minDate, onPaymentFound])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!active || !medicoId || !pluggyAccountId) {
      // Limpa tudo se o hook for desativado
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPollActive(false)
      isFoundRef.current = false
      return
    }

    let stopped = false

    async function startPolling() {
      if (!medicoId || !pluggyAccountId) return

      // 1. Upsert da linha de controle no banco
      //    ON CONFLICT (medico_id) WHERE status='waiting' → não faz nada se já existe
      const { error: upsertErr } = await supabase
        .from("onboarding_payment_polls")
        .upsert(
          {
            medico_id: medicoId,
            pluggy_account_id: pluggyAccountId,
            status: "waiting",
            tentativas: 0,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "medico_id", ignoreDuplicates: false }
        )

      if (upsertErr) {
        console.warn("[useOnboardingPaymentPoll] Erro no upsert:", upsertErr.message)
        // Continua mesmo com erro no upsert — o Realtime ainda pode funcionar
      }

      if (stopped || !isMountedRef.current) return

      setIsPollActive(true)
      isFoundRef.current = false

      // 2. Subscription Realtime na linha do médico
      const channel = supabase
        .channel(`onboarding_poll_${medicoId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "onboarding_payment_polls",
            filter: `medico_id=eq.${medicoId}`,
          },
          (payload) => {
            if (!isMountedRef.current || isFoundRef.current) return
            const row = payload.new as {
              status: string
              transacao_id?: string
              transacao_data?: string
              transacao_valor?: number
              transacao_descricao?: string
            }

            if (row.status === "found" && row.transacao_id) {
              isFoundRef.current = true
              setIsPollActive(false)

              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }

              onPaymentFound({
                id: row.transacao_id,
                descricao: row.transacao_descricao ?? "Transferência PIX Recebida",
                valor: row.transacao_valor ?? 0.01,
                data: row.transacao_data ?? new Date().toISOString(),
                dataHora: row.transacao_data ?? new Date().toISOString(),
                tipo: "CREDIT",
                pagador: row.transacao_descricao ?? "Remetente Identificado",
              })
            }
          }
        )
        .subscribe()

      channelRef.current = channel

      // 3. Chamada imediata à Edge Function
      await invokePollEdgeFunction()

      if (stopped || isFoundRef.current) return

      // 4. Interval para repetir a cada POLL_INTERVAL_MS
      intervalRef.current = setInterval(() => {
        if (isFoundRef.current || stopped) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return
        }
        invokePollEdgeFunction()
      }, POLL_INTERVAL_MS)
    }

    startPolling()

    return () => {
      stopped = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (isMountedRef.current) {
        setIsPollActive(false)
      }
    }
  }, [active, medicoId, pluggyAccountId, invokePollEdgeFunction, onPaymentFound])

  return { isPollActive, lastError, pollCount }
}
