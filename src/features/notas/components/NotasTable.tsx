"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FolderSearch,
  ScrollText,
  HardDriveDownload,
  Send,
  Plus,
  RefreshCw,
  Search,
  Loader2,
  Shredder,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotaFiscal, NotaStatus, AmbienteFiscal } from "../types"
import { CancelHoldButton } from "./CancelHoldButton"

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const STATUS_TEXT_CONFIG: Record<
  NotaStatus,
  { label: string; className: string }
> = {
  autorizada: {
    label: "Autorizada",
    className: "text-emerald-600 dark:text-emerald-400 font-medium",
  },
  processando: {
    label: "Processando",
    className: "text-amber-600 dark:text-amber-400 font-medium",
  },
  cancelada: {
    label: "Cancelada",
    className: "text-neutral-500 font-medium",
  },
  erro: {
    label: "Erro",
    className: "text-red-600 dark:text-red-400 font-medium",
  },
}

/* ------------------------------------------------------------------ */
/* Table component                                                      */
/* ------------------------------------------------------------------ */

interface NotasTableProps {
  notas: NotaFiscal[]
  isLoading?: boolean
  ambiente?: AmbienteFiscal
  onGerarNota?: () => void
  onRefetch?: () => void
  onEnviarNota?: (notaId: string) => void
  onCancelarNota?: (notaId: string) => void
  onDownloadNota?: (nota: NotaFiscal) => void
}

export function NotasTable({
  notas,
  isLoading,
  ambiente = "homologacao",
  onGerarNota,
  onRefetch,
  onEnviarNota,
  onCancelarNota,
  onDownloadNota,
}: NotasTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const columns = React.useMemo<ColumnDef<NotaFiscal>[]>(
    () => [
      {
        accessorKey: "numero_nfse",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 hover:text-foreground transition-colors cursor-pointer"
          >
            <FolderSearch strokeWidth={1.75} className="size-4 text-neutral-500 shrink-0" />
            <span>NFS-e</span>
            <ArrowUpDown
              className={cn(
                "size-3",
                column.getIsSorted() ? "text-foreground opacity-100" : "opacity-40"
              )}
            />
          </button>
        ),
        cell: ({ row }) => {
          const nfse = row.original.numero_nfse || row.original.numero_rps
          return (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ScrollText strokeWidth={1.75} className="size-4 text-foreground-lighter shrink-0" />
              <span>{nfse}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "tomador_nome",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 hover:text-foreground transition-colors cursor-pointer"
          >
            <span>Paciente</span>
            <ArrowUpDown
              className={cn(
                "size-3",
                column.getIsSorted() ? "text-foreground opacity-100" : "opacity-40"
              )}
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-[13px] font-medium text-foreground truncate max-w-[220px] block" title={row.getValue("tomador_nome")}>
            {row.getValue("tomador_nome")}
          </span>
        ),
      },
      {
        accessorKey: "valor_servico",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 hover:text-foreground transition-colors cursor-pointer"
          >
            <span>Valor</span>
            <ArrowUpDown
              className={cn(
                "size-3",
                column.getIsSorted() ? "text-foreground opacity-100" : "opacity-40"
              )}
            />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-[13px] font-semibold tabular-nums text-foreground">
            {formatBRL(row.getValue("valor_servico"))}
          </span>
        ),
      },
      {
        accessorKey: "executada_por",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Executada por
          </span>
        ),
        cell: ({ row }) => {
          const isNotoSync = row.original.executada_por === "open_finance"
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                isNotoSync
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-neutral-600 dark:text-neutral-400"
              )}
            >
              {isNotoSync && <Shredder strokeWidth={1.75} className="size-3.5 shrink-0" />}
              <span>{isNotoSync ? "Noto Sync" : "Manual"}</span>
            </span>
          )
        },
      },
      {
        accessorKey: "clinica_nome",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Clínica
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-foreground-light truncate max-w-[140px] inline-block">
            {row.original.clinica_nome || "-"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Status
          </span>
        ),
        cell: ({ row }) => {
          const status = row.getValue<NotaStatus>("status")
          const isProcessing = status === "processando"
          const cfg = STATUS_TEXT_CONFIG[status] || STATUS_TEXT_CONFIG.autorizada
          return (
            <span className={cn("inline-flex items-center gap-1.5 text-xs", cfg.className)}>
              {isProcessing && <Loader2 className="size-3 animate-spin text-amber-500 shrink-0" />}
              <span>{cfg.label}</span>
            </span>
          )
        },
      },
      {
        accessorKey: "status_envio",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Status de envio
          </span>
        ),
        cell: ({ row }) => {
          const isEnviado = row.original.status_envio === "enviado"
          return (
            <span
              className={cn(
                "text-xs font-medium",
                isEnviado
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-neutral-400 dark:text-neutral-500"
              )}
            >
              {isEnviado ? "Enviado" : "Não enviado"}
            </span>
          )
        },
      },
      {
        id: "acoes",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 text-right block pr-2">
            Ações
          </span>
        ),
        cell: ({ row }) => {
          const nota = row.original
          const isCanceled = nota.status === "cancelada"
          const isProcessing = nota.status === "processando"

          return (
            <div className="flex items-center justify-end gap-2">
              {/* Ícone Download PDF para o computador */}
              <button
                type="button"
                onClick={() => onDownloadNota?.(nota)}
                disabled={isProcessing}
                title={isProcessing ? "Nota em processamento..." : "Importar nota fiscal em PDF para o computador"}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md text-foreground-lighter hover:text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors",
                  isProcessing ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <HardDriveDownload strokeWidth={1.75} className="size-4" />
              </button>

              {/* Ícone Enviar */}
              <button
                type="button"
                onClick={() => onEnviarNota?.(nota.id)}
                disabled={isCanceled || isProcessing}
                title={
                  isProcessing
                    ? "Aguardando autorização da nota..."
                    : isCanceled
                    ? "Nota cancelada"
                    : nota.status_envio === "enviado"
                    ? "Reenviar nota ao paciente"
                    : "Enviar nota ao paciente"
                }
                className={cn(
                  "flex size-7 items-center justify-center rounded-md text-foreground-lighter hover:text-brand hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors",
                  isCanceled || isProcessing ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <Send strokeWidth={1.75} className="size-4" />
              </button>

              {/* Botão Cancelar com Hold 5s e raio 100% */}
              <CancelHoldButton
                isCanceled={isCanceled || isProcessing}
                onCancel={() => onCancelarNota?.(nota.id)}
              />
            </div>
          )
        },
      },
    ],
    [onEnviarNota, onCancelarNota, onDownloadNota]
  )

  const table = useReactTable({
    data: notas,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const rows = table.getRowModel().rows
  const isProducao = ambiente === "producao"

  return (
    // Tabela ocupando 80% da área sobrando
    <div className="w-[80%] mx-auto flex flex-col gap-6">
      {/* 1. Título H1 sem tags ou descrição adicionais */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Notas emitidas
        </h1>
      </div>

      {/* 2. Barra de pesquisa em linha com botão de gerar nota e ícone de atualizar */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground-lighter pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por paciente, NFS-e ou clínica..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-foreground-lighter outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRefetch && (
            <button
              type="button"
              onClick={onRefetch}
              disabled={isLoading}
              title="Atualizar lista"
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground-lighter hover:border-border-muted hover:text-foreground transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            </button>
          )}

          <button
            type="button"
            onClick={onGerarNota}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-xs font-semibold text-black hover:bg-brand-600 transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Plus className="size-3.5" />
            Gerar nota
          </button>
        </div>
      </div>

      {/* 3. Tabela com cabeçalho cinza claro */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                >
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="h-4 rounded bg-muted animate-pulse"
                          style={{ width: `${45 + ((j * 13) % 40)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <FolderSearch strokeWidth={1.75} className="mx-auto mb-2 size-8 text-foreground-lighter/40" />
                    <p className="text-sm font-medium text-foreground">
                      {isProducao
                        ? "Nenhuma nota emitida em produção"
                        : "Nenhuma nota emitida em homologação"}
                    </p>
                    <p className="mt-1 text-xs text-foreground-lighter">
                      {globalFilter
                        ? "Tente outros termos de busca."
                        : isProducao
                        ? "As notas fiscais transmitidas com valor legal para a sua conta aparecerão aqui."
                        : "Clique em 'Gerar nota' para emitir sua primeira NFS-e de teste."}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-foreground-lighter">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
              className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground-lighter hover:border-border-muted hover:text-foreground disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Próxima página"
              className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground-lighter hover:border-border-muted hover:text-foreground disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
