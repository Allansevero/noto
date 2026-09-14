"use client"

import * as React from "react"
import { X, Loader2, Check, Plus, UserRoundPlus, SlidersHorizontal, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { listPacientes, cadastrarPaciente } from "../notas.repository"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import type { AmbienteFiscal, Paciente, GerarNotasLoteInput } from "../types"

interface GerarNotaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: GerarNotasLoteInput) => Promise<void>
  isLoading?: boolean
  ambiente: AmbienteFiscal
}

function formatBrlInput(val: string): string {
  const digits = val.replace(/\D/g, "")
  if (!digits) return "0,00"
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function GerarNotaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  ambiente,
}: GerarNotaModalProps) {
  // Lista de pacientes
  const [pacientes, setPacientes] = React.useState<Paciente[]>([])
  const [loadingPacientes, setLoadingPacientes] = React.useState(false)

  // Pesquisa
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)
  const [selectedPacientes, setSelectedPacientes] = React.useState<Paciente[]>([])

  // Modalidade de valor (quando há mais de um paciente)
  const [modalidadeValor, setModalidadeValor] = React.useState<"individual" | "unico">("individual")

  // Inline cadastro de paciente
  const [isAddingInline, setIsAddingInline] = React.useState(false)
  const [novoNome, setNovoNome] = React.useState("")
  const [savingPaciente, setSavingPaciente] = React.useState(false)

  // Demais campos
  const [valor, setValor] = React.useState("350,00")
  const [dataConsulta, setDataConsulta] = React.useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [alterarDescricao, setAlterarDescricao] = React.useState(false)
  const [discriminacao, setDiscriminacao] = React.useState(
    "Consulta médica presencial com emissão de receituário e anamnese clínica."
  )
  const [descricaoAdicional, setDescricaoAdicional] = React.useState("")

  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  // Carrega pacientes ao abrir o modal
  React.useEffect(() => {
    if (!isOpen) return
    let active = true
    setLoadingPacientes(true)
    listPacientes()
      .then((data) => {
        if (active) setPacientes(data)
      })
      .finally(() => {
        if (active) setLoadingPacientes(false)
      })
    return () => {
      active = false
    }
  }, [isOpen])

  // Fecha dropdown ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearching(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!isOpen) return null

  // Filtra pacientes pelo nome, partes do nome ou pelas iniciais
  const queryTrimmed = searchQuery.trim().toLowerCase()
  const hasQuery = queryTrimmed.length > 0
  const filteredPacientes = hasQuery
    ? pacientes.filter((p) => {
        const nomeLower = p.nome.toLowerCase()
        const matchNome = nomeLower.includes(queryTrimmed)

        // Iniciais do paciente (ex: "Mariana Costa Silva" -> "mcs", "Beatriz Santos" -> "bs")
        const words = p.nome
          .trim()
          .split(/\s+/)
          .filter(Boolean)
        const iniciaisCompleta = words.map((w) => w[0]?.toLowerCase()).join("")
        const iniciaisPrimUltimo =
          words.length > 1 ? (words[0][0] + words[words.length - 1][0]).toLowerCase() : ""

        const matchIniciais =
          iniciaisCompleta.includes(queryTrimmed) ||
          iniciaisCompleta.startsWith(queryTrimmed) ||
          iniciaisPrimUltimo === queryTrimmed ||
          words.some((w) => w.toLowerCase().startsWith(queryTrimmed))

        const matchCpf = p.cpf
          ? p.cpf.replace(/\D/g, "").includes(queryTrimmed.replace(/\D/g, ""))
          : false

        return matchNome || matchIniciais || matchCpf
      })
    : []

  // Adicionar paciente selecionado
  const handleSelectPaciente = (paciente: Paciente) => {
    if (!selectedPacientes.some((p) => p.id === paciente.id)) {
      setSelectedPacientes((prev) => [...prev, paciente])
    }
    setSearchQuery("")
    setIsSearching(false)
  }

  // Remover tag do paciente
  const handleRemovePaciente = (id: string) => {
    setSelectedPacientes((prev) => prev.filter((p) => p.id !== id))
  }

  // Cadastrar novo paciente rapidamente
  const handleCadastrarNovo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoNome.trim()) return

    setSavingPaciente(true)
    try {
      const res = await cadastrarPaciente({ nome: novoNome.trim() })
      if (res.success && res.paciente) {
        setPacientes((prev) => [res.paciente!, ...prev])
        setSelectedPacientes((prev) => [...prev, res.paciente!])
        setNovoNome("")
        setIsAddingInline(false)
        setSearchQuery("")
        setIsSearching(false)
      }
    } catch (err) {
      console.error("Erro ao cadastrar paciente:", err)
    } finally {
      setSavingPaciente(false)
    }
  }

  // Submissão: fecha imediatamente o modal para liberar o usuário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPacientes.length === 0) return

    const parsedValor =
      parseFloat(valor.replace(/\./g, "").replace(",", ".")) || 0

    const submissionData: GerarNotasLoteInput = {
      pacientes: selectedPacientes.map((p) => ({
        id: p.id,
        nome: p.nome,
        cpf: p.cpf,
      })),
      valor_servico: parsedValor,
      data_emissao: dataConsulta,
      discriminacao: alterarDescricao ? discriminacao : undefined,
      descricao_adicional: descricaoAdicional.trim() || undefined,
      ambiente,
      executada_por: "manual",
    }

    // 1. Oculta o dialog imediatamente
    onClose()

    // 2. Reseta o estado para permitir emissões subsequentes instantâneas
    setSelectedPacientes([])
    setSearchQuery("")
    setIsSearching(false)
    setIsAddingInline(false)
    setDescricaoAdicional("")

    // 3. Dispara a submissão assíncrona
    onSubmit(submissionData)
  }

  const count = selectedPacientes.length
  const hasMultiple = count > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-2xl transition-all"
      >
        {/* Cabeçalho limpo: somente título e cabeçalho, sem ícone */}
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground font-sans">
              Gerar notas fiscais
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecione os pacientes e preencha as informações para emissão da NFS-e.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex size-7 items-center justify-center rounded-md text-foreground-lighter hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* 1. Input de Pesquisa de Paciente com botão em círculo ao lado */}
          <div className="relative" ref={searchContainerRef}>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Pacientes <span className="text-red-500">*</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Pesquise o nome ou iniciais do paciente..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsSearching(true)
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setIsSearching(true)
                  }}
                  disabled={isLoading}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50"
                />
              </div>

              {/* Botão em círculo com ícone UserRoundPlus para adicionar paciente */}
              <button
                type="button"
                onClick={() => {
                  setIsAddingInline((prev) => !prev)
                  setIsSearching(false)
                }}
                disabled={isLoading}
                title="Adicionar novo paciente"
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer select-none",
                  isAddingInline
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground-lighter hover:text-foreground hover:bg-muted hover:border-ring"
                )}
              >
                <UserRoundPlus strokeWidth={1.75} className="size-4" />
              </button>
            </div>

            {/* Formulário inline para adicionar novo paciente ao clicar no círculo */}
            {isAddingInline && (
              <div className="mt-2 p-3 rounded-lg border border-border bg-muted/40 flex flex-col gap-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <UserRoundPlus strokeWidth={1.75} className="size-3.5 text-primary" />
                    Novo paciente
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingInline(false)}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do paciente *"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  autoFocus
                  className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
                />
                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingInline(false)}
                    className="h-7 px-2.5 rounded-md text-[11px] text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCadastrarNovo}
                    disabled={savingPaciente || !novoNome.trim()}
                    className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {savingPaciente && <Loader2 className="size-3 animate-spin" />}
                    Salvar e Adicionar
                  </button>
                </div>
              </div>
            )}

            {/* Dropdown de sugestões (só aparece quando começa a pesquisa) */}
            {isSearching && hasQuery && !isAddingInline && (
              <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in-0 duration-100">
                <div className="max-h-[190px] overflow-y-auto divide-y divide-border/30 py-1">
                  {loadingPacientes ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      Carregando...
                    </div>
                  ) : filteredPacientes.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      Nenhum paciente encontrado com &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    filteredPacientes.map((p) => {
                      const isAlreadySelected = selectedPacientes.some((sp) => sp.id === p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (!isAlreadySelected) handleSelectPaciente(p)
                          }}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none transition-colors",
                            isAlreadySelected
                              ? "opacity-50 cursor-default bg-muted/40"
                              : "hover:bg-muted/70 text-foreground"
                          )}
                        >
                          <span className="font-medium">{p.nome}</span>
                          {isAlreadySelected ? (
                            <span className="text-[10px] text-muted-foreground">Adicionado</span>
                          ) : (
                            <span className="text-[10px] text-primary font-medium">+ Adicionar</span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Opção rápida de adicionar com o texto digitado */}
                <div className="p-1.5 border-t border-border bg-muted/20">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingInline(true)
                      setNovoNome(searchQuery)
                      setIsSearching(false)
                    }}
                    className="w-full h-7 flex items-center justify-center gap-1 text-xs text-foreground-light hover:text-foreground font-medium rounded hover:bg-muted cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Adicionar &quot;{searchQuery}&quot; como novo paciente</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tags de Pacientes: cinza claro, somente o nome do paciente e o 'x' */}
            {selectedPacientes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedPacientes.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 text-xs font-medium"
                  >
                    <span>{p.nome}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePaciente(p.id)}
                      className="size-3.5 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
                      title="Remover"
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. Três Cards Quadrados de Opção de Valor (Aparece se mais de um paciente for adicionado) */}
          {hasMultiple && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 animate-in fade-in-0 duration-150">
              {/* Opção 1: Valor individual por paciente (RECOMENDADO) */}
              <div
                onClick={() => setModalidadeValor("individual")}
                className={cn(
                  "relative flex flex-col justify-between p-3 rounded-lg border text-left cursor-pointer transition-all select-none",
                  modalidadeValor === "individual"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-foreground leading-snug">
                      Valor individual por paciente
                    </span>
                    <div
                      className={cn(
                        "size-4 rounded border flex items-center justify-center shrink-0 mt-0.5",
                        modalidadeValor === "individual"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-transparent"
                      )}
                    >
                      {modalidadeValor === "individual" && <Check className="size-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    (RECOMENDADO)
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Gera notas fiscais individuais mantendo o valor de cada atendimento.
                  </p>
                </div>
              </div>

              {/* Opção 2: Valor único para todos */}
              <div
                onClick={() => setModalidadeValor("unico")}
                className={cn(
                  "relative flex flex-col justify-between p-3 rounded-lg border text-left cursor-pointer transition-all select-none",
                  modalidadeValor === "unico"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-foreground leading-snug">
                      Valor único para todos
                    </span>
                    <div
                      className={cn(
                        "size-4 rounded border flex items-center justify-center shrink-0 mt-0.5",
                        modalidadeValor === "unico"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-transparent"
                      )}
                    >
                      {modalidadeValor === "unico" && <Check className="size-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-3">
                    Aplica o mesmo valor fixo definido abaixo para todas as notas emitidas.
                  </p>
                </div>
              </div>

              {/* Opção 3: Personalizar valor por paciente (Em breve) */}
              <div className="relative flex flex-col justify-between p-3 rounded-lg border border-border/60 bg-muted/20 text-left opacity-60 cursor-not-allowed select-none">
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-medium text-foreground leading-snug">
                      Personalizar valor por paciente
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground shrink-0">
                      Em breve
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
                    Permite definir valores distintos e individualizados para cada paciente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Valor da Nota e Data da Consulta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Valor da Nota */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Valor da nota (R$) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center w-full">
                <span className="absolute left-3 text-xs font-medium text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={valor}
                  onChange={(e) => setValor(formatBrlInput(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-9 rounded-md border border-input bg-transparent pl-8 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Data da Consulta */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Data da consulta <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dataConsulta}
                onChange={(e) => setDataConsulta(e.target.value)}
                disabled={isLoading}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* 4. Configurações avançadas */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="configuracoes-avancadas-nota"
              className="border border-border/70 rounded-lg px-3.5 bg-muted/10 data-[state=open]:bg-muted/20 transition-colors"
            >
              <AccordionTrigger
                indicator="chevron"
                className="py-2.5 text-xs font-semibold text-foreground/80 hover:text-foreground"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span>Configurações avançadas</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-3 space-y-3.5 text-xs">
                <div className="pt-2 border-t border-border/50 space-y-3">
                  {/* Descrição adicional */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        Descrição adicional
                      </label>
                      <span className="text-[10px] text-muted-foreground">Opcional</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Escreva observações ou detalhes extras para incluir nos parâmetros e informações adicionais da nota fiscal (ex: convênio, pedido, orientações).
                    </p>
                    <textarea
                      rows={2}
                      value={descricaoAdicional}
                      onChange={(e) => setDescricaoAdicional(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ex: Consulta clínica de retorno, acompanhamento pós-operatório..."
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none disabled:opacity-50"
                    />
                  </div>

                  {/* Alterar descrição dos serviços */}
                  <div className="pt-2 border-t border-border/50">
                    <label className="flex items-center justify-between cursor-pointer select-none py-1">
                      <span className="text-xs font-medium text-foreground">
                        Alterar descrição dos serviços
                      </span>
                      <input
                        type="checkbox"
                        checked={alterarDescricao}
                        onChange={(e) => setAlterarDescricao(e.target.checked)}
                        disabled={isLoading}
                        className="size-4 rounded border-input text-primary focus:ring-ring accent-emerald-500 cursor-pointer"
                      />
                    </label>

                    {alterarDescricao && (
                      <div className="animate-in fade-in-0 duration-150 pt-2">
                        <textarea
                          rows={3}
                          value={discriminacao}
                          onChange={(e) => setDiscriminacao(e.target.value)}
                          disabled={isLoading}
                          placeholder="Descreva detalhadamente os serviços prestados..."
                          className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 5. Rodapé com Botões: Cancelar e Gerar notas */}
          <div className="mt-1 flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={count === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {count > 1 ? `Gerar ${count} notas` : "Gerar nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
