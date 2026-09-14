"use client"

import * as React from "react"
import {
  X,
  User,
  Mail,
  FileText,
  Loader2,
  Check,
  DollarSign,
  SlidersHorizontal,
  Users,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import type { Paciente, CriarPacienteInput, AtualizarPacienteInput } from "../types"

interface PacienteFormDialogProps {
  isOpen: boolean
  onClose: () => void
  paciente?: Paciente | null // Se fornecido, é modo edição; se nulo, é modo cadastro
  onSave: (dados: CriarPacienteInput | AtualizarPacienteInput, id?: string) => Promise<{ success: boolean; error?: string }>
}

export function PacienteFormDialog({
  isOpen,
  onClose,
  paciente,
  onSave,
}: PacienteFormDialogProps) {
  const [nome, setNome] = React.useState("")
  const [cpf, setCpf] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [telefone, setTelefone] = React.useState("")

  // Switch de valor fixo da consulta: SEMPRE desativado por padrão
  const [hasValorFixo, setHasValorFixo] = React.useState(false)
  const [valorConsulta, setValorConsulta] = React.useState("")

  // Configurações avançadas: Pagador secundário
  const [pagadorSecundarioNome, setPagadorSecundarioNome] = React.useState("")
  const [pagadorSecundarioCpf, setPagadorSecundarioCpf] = React.useState("")

  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  const isEditing = Boolean(paciente)

  // Máscaras
  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11)
    if (digits.length === 0) return ""
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const formatCpfOrCnpj = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 14)
    if (digits.length <= 11) {
      return formatCpf(digits)
    }
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  }

  const formatCurrency = (val: string) => {
    const digits = val.replace(/\D/g, "")
    if (!digits) return ""
    const number = Number(digits) / 100
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number)
  }

  const parseCurrency = (val: string): number | null => {
    const digits = val.replace(/\D/g, "")
    if (!digits) return null
    return Number(digits) / 100
  }

  // Preenche dados quando abrir ou quando mudar o paciente selecionado
  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null)
      setSuccessMsg(null)
      // Conforme solicitado: deixe sempre desativado por padrão ao abrir
      setHasValorFixo(false)

      if (paciente) {
        setNome(paciente.nome || "")
        setCpf(paciente.cpf ? formatCpf(paciente.cpf) : "")
        setEmail(paciente.email || "")
        setTelefone(paciente.telefone ? formatPhone(paciente.telefone) : "")
        setPagadorSecundarioNome(paciente.pagador_secundario_nome || "")
        setPagadorSecundarioCpf(paciente.pagador_secundario_cpf ? formatCpfOrCnpj(paciente.pagador_secundario_cpf) : "")
        if (paciente.valor_consulta) {
          setValorConsulta(formatCurrency(String(Math.round(Number(paciente.valor_consulta) * 100))))
        } else {
          setValorConsulta("")
        }
      } else {
        setNome("")
        setCpf("")
        setEmail("")
        setTelefone("")
        setValorConsulta("")
        setPagadorSecundarioNome("")
        setPagadorSecundarioCpf("")
      }
    }
  }, [isOpen, paciente])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErrorMsg("O nome completo do paciente é obrigatório.")
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const valorFinal = hasValorFixo ? parseCurrency(valorConsulta) : null

      const result = await onSave(
        {
          nome: nome.trim(),
          cpf: cpf.trim() || undefined,
          email: email.trim() || undefined,
          telefone: telefone.trim() || undefined,
          valor_consulta: valorFinal,
          pagador_secundario_nome: pagadorSecundarioNome.trim() || undefined,
          pagador_secundario_cpf: pagadorSecundarioCpf.trim() ? pagadorSecundarioCpf.replace(/\D/g, "") : undefined,
        },
        paciente?.id
      )

      if (result.success) {
        setSuccessMsg(isEditing ? "Paciente atualizado com sucesso!" : "Paciente cadastrado com sucesso!")
        setTimeout(() => {
          setIsLoading(false)
          onClose()
        }, 800)
      } else {
        setIsLoading(false)
        setErrorMsg(result.error || "Erro ao salvar dados do paciente.")
      }
    } catch {
      setIsLoading(false)
      setErrorMsg("Erro inesperado ao salvar paciente.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border border-border bg-card text-foreground shadow-2xl rounded-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div>
            <DialogTitle className="text-base font-semibold text-foreground">
              {isEditing ? "Editar Paciente" : "Novo Paciente"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {isEditing
                ? "Atualize as informações cadastrais do paciente."
                : "Preencha os dados do paciente para emissão de notas e gestão."}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Campo: Nome */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md flex items-center border border-input bg-background focus-within:border-ring transition-all">
              <div className="pl-3 pr-2 flex items-center pointer-events-none text-muted-foreground">
                <User className="size-4" />
              </div>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Mariana Costa Silva"
                className="flex-1 min-w-0 block w-full px-2 py-2 text-xs text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Campo: CPF */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              CPF do Tomador
            </label>
            <div className="relative rounded-md flex items-center border border-input bg-background focus-within:border-ring transition-all">
              <div className="pl-3 pr-2 flex items-center pointer-events-none text-muted-foreground">
                <FileText className="size-4" />
              </div>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="flex-1 min-w-0 block w-full px-2 py-2 text-xs text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Campo: E-mail */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Endereço de E-mail
            </label>
            <div className="relative rounded-md flex items-center border border-input bg-background focus-within:border-ring transition-all">
              <div className="pl-3 pr-2 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="size-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="flex-1 min-w-0 block w-full px-2 py-2 text-xs text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Campo: WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              WhatsApp / Telefone
            </label>
            <div className="relative rounded-md flex items-center border border-input bg-background focus-within:border-ring transition-all overflow-hidden">
              <div className="pl-3 pr-2 py-2 flex items-center justify-center bg-muted/50 border-r border-border">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" className="w-4 h-4 mr-1 rounded-xs">
                  <rect width="72" height="72" fill="#5EAA22" />
                  <polygon points="36,11 65,36 36,61 7,36" fill="#FCDC34" />
                  <circle cx="36" cy="36" r="14" fill="#002776" />
                  <path d="M 23 36 C 23 32 30 25 36 25 C 42 25 49 32 49 36" fill="transparent" stroke="#fff" strokeWidth="2.5" />
                </svg>
                <span className="text-muted-foreground text-xs font-medium">+55</span>
              </div>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                placeholder="(DD) 99999-9999"
                className="flex-1 min-w-0 block w-full px-3 py-2 text-xs text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Switch de Valor Fixo da Consulta (Radix UI Switch) */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="switch-valor-fixo"
                  className="text-xs font-semibold text-foreground cursor-pointer select-none"
                >
                  Valor fixo da consulta
                </label>
                <p className="text-[11px] text-muted-foreground select-none">
                  Aprovar definição de valor pré-definido para este paciente
                </p>
              </div>
              <Switch
                id="switch-valor-fixo"
                checked={hasValorFixo}
                onCheckedChange={setHasValorFixo}
              />
            </div>

            {hasValorFixo && (
              <div className="pt-2 border-t border-border/60 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Valor da Consulta (R$)
                </label>
                <div className="relative rounded-md flex items-center border border-input bg-background focus-within:border-ring transition-all">
                  <div className="pl-3 pr-2 flex items-center pointer-events-none text-muted-foreground">
                    <DollarSign className="size-3.5" />
                  </div>
                  <input
                    type="text"
                    value={valorConsulta}
                    onChange={(e) => setValorConsulta(formatCurrency(e.target.value))}
                    placeholder="0,00"
                    className="flex-1 min-w-0 block w-full px-1 py-1.5 text-xs text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Configurações Avançadas */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="configuracoes-avancadas"
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
              <AccordionContent className="pt-1 pb-3 space-y-3 text-xs">
                <div className="pt-2 border-t border-border/50 space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Users className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Pagador secundário</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Reconhece pagamentos bancários (Pix/TED) recebidos em nome deste terceiro e emite a nota fiscal automaticamente no nome do paciente.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Nome do pagador secundário
                      </label>
                      <input
                        type="text"
                        value={pagadorSecundarioNome}
                        onChange={(e) => setPagadorSecundarioNome(e.target.value)}
                        placeholder="Ex: Mãe, Pai, Cônjuge ou Empresa"
                        className="block w-full px-2.5 py-1.5 text-xs text-foreground bg-background border border-input rounded-md focus:border-ring focus:outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        CPF ou CNPJ do pagador
                      </label>
                      <input
                        type="text"
                        value={pagadorSecundarioCpf}
                        onChange={(e) => setPagadorSecundarioCpf(formatCpfOrCnpj(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={18}
                        className="block w-full px-2.5 py-1.5 text-xs text-foreground bg-background border border-input rounded-md focus:border-ring focus:outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Mensagens de Feedback */}
          {errorMsg && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2.5">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2.5 flex items-center gap-1.5">
              <Check className="size-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Rodapé de Ações */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isEditing ? "Salvar alterações" : "Cadastrar paciente"}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
