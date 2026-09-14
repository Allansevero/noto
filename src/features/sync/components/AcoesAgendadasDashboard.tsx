"use client"

import React, { useState } from "react"
import {
  Shredder,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  FileCheck,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAcoesAgendadas } from "../hooks/useAcoesAgendadas"
import type { NotoSyncLog } from "../types"

function formatDatePtBr(isoString?: string | null): string {
  if (!isoString) return "--/--/---- --:--"
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d)
  } catch {
    return isoString
  }
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val)
}

export function AcoesAgendadasDashboard() {
  const {
    stats,
    logs,
    isLoading,
    isSyncing,
    isRegisteringWebhook,
    recarregar,
    executarSincronizacao,
    configurarWebhook,
  } = useAcoesAgendadas()

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; success: boolean } | null>(null)

  const showToast = (text: string, success = true) => {
    setToast({ text, success })
    setTimeout(() => setToast(null), 4500)
  }

  const handleSync = async () => {
    const res = await executarSincronizacao()
    showToast(res.message, res.success)
  }

  const handleWebhook = async () => {
    const res = await configurarWebhook()
    showToast(res.message, res.success)
  }

  const toggleExpandLog = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id))
  }


  return (
    <div className="space-y-6 pb-12">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
              <Shredder className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Ações Agendadas & Noto Sync
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Robô Ativo
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Conciliação bancária Open Finance via Pluggy e emissão automática de NFS-e sem intervenção manual.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWebhook}
            disabled={isRegisteringWebhook || isLoading}
            className="text-xs h-9 border-border/60 hover:bg-muted/50 transition-colors"
          >
            <Zap className={`w-3.5 h-3.5 mr-1.5 text-amber-400 ${isRegisteringWebhook ? "animate-spin" : ""}`} />
            {isRegisteringWebhook ? "Configurando..." : "Verificar Webhook"}
          </Button>

          <Button
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Varrendo extratos..." : "Sincronizar Agora"}
          </Button>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/60 border-border/40 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notas Emitidas
            </CardTitle>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "--" : stats?.totalNotasAutomaticas ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">100% automático</span> via Noto Sync
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/40 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Volume Faturado
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "--" : formatCurrency(stats?.volumeFaturadoAutomatico ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total conciliado com recibos fiscais
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/40 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Contas Monitoradas
            </CardTitle>
            <Building2 className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "--" : stats?.contasMonitoradas ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contas Pluggy ativas para recebimento
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/40 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Última Varredura
            </CardTitle>
            <Clock className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-foreground font-mono truncate">
              {isLoading
                ? "--"
                : stats?.ultimaSincronizacao
                ? formatDatePtBr(stats.ultimaSincronizacao)
                : "Ainda não executado"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Execução periódica e via webhook
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Operacional: Arquitetura e Regras de Negócio */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-xl bg-card/40 border border-border/40">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Webhook Pluggy</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Recepção de notificações em tempo real sempre que novas transações de crédito são identificadas nas contas bancárias conectadas.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card/40 border border-border/40">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Anti-Duplicação Estrita</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Idempotência garantida via ID unívoco da transação bancária. Nenhum pagamento é faturado duas vezes no sistema.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card/40 border border-border/40">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Compliance Fiscal</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A conciliação respeita a data de cadastro do paciente e cruza CPF e nome do remetente com tolerância zero para pagamentos inconsistentes.
          </p>
        </div>
      </div>

      {/* Tabela de Auditoria e Histórico de Logs */}
      <Card className="bg-card/50 border-border/40 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              Histórico de Varreduras e Auditoria Noto Sync
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Registro completo de execuções disparadas por webhook, rotina automática ou acionamento manual.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={recarregar}
            disabled={isLoading}
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Recarregar
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y border-border/40 bg-muted/20 text-muted-foreground font-medium">
                <th className="py-2.5 px-4">Data / Hora</th>
                <th className="py-2.5 px-4">Origem</th>
                <th className="py-2.5 px-4 text-center">Transações Analisadas</th>
                <th className="py-2.5 px-4 text-center">Notas Emitidas</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Mensagem</th>
                <th className="py-2.5 px-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    Carregando histórico do Noto Sync...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <Shredder className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" strokeWidth={1.75} />
                    <p className="text-sm font-medium text-foreground">Nenhuma execução registrada ainda</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Clique em &quot;Sincronizar Agora&quot; acima para iniciar a primeira varredura das contas bancárias conectadas.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const hasDetails = log.detalhes && Object.keys(log.detalhes).length > 0

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                          {formatDatePtBr(log.criado_em)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.origem === "webhook" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Webhook Pluggy
                            </span>
                          ) : log.origem === "cron" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Varredura Automática
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-foreground">
                          {log.transacoes_analisadas}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {log.notas_emitidas > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              +{log.notas_emitidas}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.status === "sucesso" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Sucesso
                            </span>
                          ) : log.status === "sem_movimentacao" ? (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              Concluído
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Aviso
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                          {log.mensagem || "Execução concluída."}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {hasDetails ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandLog(log.id)}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? (
                                <>
                                  Ocultar <ChevronUp className="w-3 h-3 ml-1" />
                                </>
                              ) : (
                                <>
                                  Ver <ChevronDown className="w-3 h-3 ml-1" />
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground/40 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Linha expandida com detalhes da conciliação */}
                      {isExpanded && (
                        <tr className="bg-muted/30 border-b border-border/30">
                          <td colSpan={7} className="py-3 px-4">
                            <div className="rounded-lg bg-background/60 border border-border/40 p-3 space-y-2 text-xs">
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                <Shredder className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                                Resultados detalhados da execução
                              </div>
                              {log.detalhes?.resultados && Array.isArray(log.detalhes.resultados) && log.detalhes.resultados.length > 0 ? (
                                <div className="space-y-1.5 mt-2">
                                  {log.detalhes.resultados.map((r: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 rounded bg-card border border-border/30 text-xs"
                                    >
                                      <div>
                                        <span className="font-medium text-foreground">{r.pacienteNome}</span>
                                        <span className="text-muted-foreground ml-2">
                                          {formatCurrency(r.valor)}
                                        </span>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.motivo}</p>
                                      </div>
                                      {r.numeroNfse && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                          NFS-e #{r.numeroNfse}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-xs">
                                  Nenhum pagamento correspondente identificado entre as transações analisadas.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Toast flutuante de feedback */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            toast.success
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-800/80"
              : "bg-red-950/90 text-red-200 border-red-800/80"
          }`}
        >
          {toast.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.text}</span>
        </div>
      )}
    </div>
  )
}
