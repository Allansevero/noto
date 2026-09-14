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
  Plus,
  RefreshCw,
  Search,
  Loader2,
  ScrollText,
  Pencil,
  Eye,
  IdCardLanyard,
  User,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Paciente } from "../types"
import { ArchiveHoldButton } from "./ArchiveHoldButton"

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCpfDisplay(cpf?: string | null) {
  if (!cpf) return "—"
  const digits = cpf.replace(/\D/g, "")
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  return cpf
}

function formatPhoneDisplay(phone?: string | null) {
  if (!phone) return "—"
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

function formatDateDisplay(dateStr?: string | null) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("pt-BR")
}

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

interface PacientesTableProps {
  pacientes: Paciente[]
  isLoading?: boolean
  onNovoPaciente: () => void
  onEditarPaciente: (paciente: Paciente) => void
  onVerHistoricoNotas: (paciente: Paciente) => void
  onArquivarPaciente: (pacienteId: string) => void
  onRefetch?: () => void
}

export function PacientesTable({
  pacientes,
  isLoading = false,
  onNovoPaciente,
  onEditarPaciente,
  onVerHistoricoNotas,
  onArquivarPaciente,
  onRefetch,
}: PacientesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const columns = React.useMemo<ColumnDef<Paciente>[]>(
    () => [
      {
        accessorKey: "nome",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 hover:text-foreground transition-colors cursor-pointer"
          >
            <User strokeWidth={1.75} className="size-3.5 text-neutral-500 shrink-0" />
            <span>Nome do Paciente</span>
            <ArrowUpDown
              className={cn(
                "size-3 text-neutral-400 transition-colors",
                column.getIsSorted() && "text-foreground"
              )}
            />
          </button>
        ),
        cell: ({ row }) => {
          const nome = row.getValue<string>("nome") || "—"
          const initials = nome
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()

          return (
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border shrink-0">
                {initials || "P"}
              </div>
              <span className="text-xs font-semibold text-foreground">
                {nome}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "cpf",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            CPF
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatCpfDisplay(row.getValue<string | null>("cpf"))}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            E-mail
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.getValue<string | null>("email") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "telefone",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            WhatsApp
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatPhoneDisplay(row.getValue<string | null>("telefone"))}
          </span>
        ),
      },
      {
        accessorKey: "valor_consulta",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Valor Fixo
          </span>
        ),
        cell: ({ row }) => {
          const val = row.getValue<number | null>("valor_consulta")
          if (!val) return <span className="text-muted-foreground text-xs">—</span>
          return (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)}
            </span>
          )
        },
      },
      {
        accessorKey: "criado_em",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Cadastrado em
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDateDisplay(row.getValue<string | null>("criado_em"))}
          </span>
        ),
      },
      {
        accessorKey: "total_notas",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Notas geradas
          </span>
        ),
        cell: ({ row }) => {
          const paciente = row.original
          const total = paciente.total_notas ?? 0
          return (
            <button
              type="button"
              onClick={() => onVerHistoricoNotas(paciente)}
              title="Visualizar histórico de notas fiscais deste paciente"
              className="inline-flex items-center gap-1.5 text-xs text-foreground hover:opacity-80 transition-opacity cursor-pointer group select-none"
            >
              <span className="font-semibold text-foreground text-xs tabular-nums">
                {total}
              </span>
              <Eye className="size-4 text-emerald-500 group-hover:text-emerald-600 shrink-0 transition-colors" />
            </button>
          )
        },
      },
      {
        id: "acoes",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-200 text-right block">
            Ações
          </span>
        ),
        cell: ({ row }) => {
          const paciente = row.original
          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Botão Editar Paciente */}
              <button
                type="button"
                onClick={() => onEditarPaciente(paciente)}
                title="Editar paciente"
                className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Pencil strokeWidth={1.75} className="size-4" />
              </button>

              {/* Botão Arquivar com animação de hold de 5 segundos */}
              <ArchiveHoldButton
                isArchived={paciente.arquivado}
                onArchive={() => onArquivarPaciente(paciente.id)}
              />
            </div>
          )
        },
      },
    ],
    [onVerHistoricoNotas, onEditarPaciente, onArquivarPaciente]
  )

  const table = useReactTable({
    data: pacientes,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-[80%] mx-auto py-8">
      {/* 1. Header do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground font-sans">
            Pacientes
          </h1>
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">
            {pacientes.length}
          </span>
        </div>

        {/* Controles: Busca, Recarregar e Novo Paciente */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou e-mail..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors w-60 sm:w-72"
            />
          </div>

          {onRefetch && (
            <button
              type="button"
              onClick={onRefetch}
              disabled={isLoading}
              title="Atualizar lista"
              className="inline-flex items-center justify-center size-8 rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            </button>
          )}

          <button
            type="button"
            onClick={onNovoPaciente}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer select-none"
          >
            <Plus className="size-3.5" />
            <span>Adicionar paciente</span>
          </button>
        </div>
      </div>

      {/* 2. Container da Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border bg-muted/40 transition-colors"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left align-middle font-medium"
                    >
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
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-40 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-28 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-36 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-20 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-24 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-middle text-xs"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-40 text-center text-xs text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="size-8 text-muted-foreground/60 stroke-[1.25]" />
                      <p className="font-medium text-foreground">
                        Nenhum paciente cadastrado
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Clique em "Adicionar paciente" para cadastrar seu primeiro tomador de serviços.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Paginação */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <div>
            <span>
              Página{" "}
              <strong className="text-foreground">
                {table.getState().pagination.pageIndex + 1}
              </strong>{" "}
              de{" "}
              <strong className="text-foreground">
                {Math.max(1, table.getPageCount())}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-40 cursor-pointer select-none text-xs"
            >
              <ChevronLeft className="size-3.5" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-40 cursor-pointer select-none text-xs"
            >
              <span>Próxima</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
