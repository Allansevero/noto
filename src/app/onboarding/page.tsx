"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  getCurrentDoctor,
  concluirOnboarding,
} from "@/features/auth/auth.repository"
import type { DoctorProfile } from "@/features/auth/types"
import { parseSpedNfseXml } from "@/features/onboarding/services/nfseParser.service"
import {
  saveDoctorFiscalData,
  getDoctorFiscalData,
  saveOnboardingStep,
  getSavedOnboardingStep,
} from "@/features/onboarding/onboarding.repository"
import { enviarCertificadoParaFocusNFe } from "@/features/onboarding/services/focusClient.service"
import type { ExtractedFiscalData } from "@/features/onboarding/types"
import { usePluggyConnect } from "@/features/banking/hooks/usePluggyConnect"
import { getDoctorBankAccounts } from "@/features/banking/banking.repository"
import type { ContaBancaria } from "@/features/banking/types"
import { ensureOnboardingDoctorPatient } from "@/features/pacientes/pacientes.repository"
import {
  checkPaymentReceived,
  emitirPrimeiraNota,
} from "@/features/invoices/services/invoiceClient.service"
import type { EmitirNotaResult } from "@/features/invoices/types"
import { getLatestDoctorInvoice } from "@/features/invoices/invoices.repository"
import { PACIENTE_ONBOARDING_TESTE, PACIENTE_TESTE_STONE } from "@/config/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { XmlAnimatedSvg } from "@/components/xml-animated-svg"
import { IconConnectionAnimation } from "@/components/icon-connection-animation"
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode2,
  FileKey2,
  ShieldCheck,
  FileText,
  ExternalLink,
  Landmark,
  Zap,
  CircleDashedCheck,
  LockKeyhole,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Smartphone,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

function formatCnpj(cnpj?: string): string {
  if (!cnpj) return ""
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return cnpj
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
}

function formatPaymentTimestamp(dateVal?: string | Date): string {
  const d = dateVal ? new Date(dateVal) : new Date()
  const valid = isNaN(d.getTime()) ? new Date() : d
  const dataStr = valid.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const horaStr = valid.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `Pagamento feito em ${dataStr} na hora ${horaStr}`
}

interface ExtractedParamItem {
  id: string
  label: string
  value: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [doctor, setDoctor] = React.useState<DoctorProfile | null>(null)
  const [isLoadingDoctor, setIsLoadingDoctor] = React.useState(true)

  // Etapa ativa na navegação centralizada (1 a 4)
  const [activeStep, setActiveStep] = React.useState<number>(1)

  // Estado da Etapa 1 - NFS-e XML e Animações
  const [extractedData, setExtractedData] = React.useState<ExtractedFiscalData | null>(null)
  const [isStep1Completed, setIsStep1Completed] = React.useState(false)
  const [xmlFileName, setXmlFileName] = React.useState<string>("")
  const [xmlError, setXmlError] = React.useState<string | null>(null)

  // Controle da animação do SVG e Card de Extração
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const [isDropping, setIsDropping] = React.useState(false)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [analysisProgress, setAnalysisProgress] = React.useState(0)
  const [discoveredParams, setDiscoveredParams] = React.useState<ExtractedParamItem[]>([])
  const [isCardExpanded, setIsCardExpanded] = React.useState(true)
  const analysisIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Estado da Etapa 2 - Certificado A1 + Focus NFe
  const [certificateFile, setCertificateFile] = React.useState<File | null>(null)
  const [certificatePassword, setCertificatePassword] = React.useState<string>("")
  const [showCertPassword, setShowCertPassword] = React.useState(false)
  const [isCertDraggingOver, setIsCertDraggingOver] = React.useState(false)
  const [isCertAnalyzing, setIsCertAnalyzing] = React.useState(false)
  const [certProgress, setCertProgress] = React.useState(0)
  const [isCertUploaded, setIsCertUploaded] = React.useState(false)
  const [isValidatingCert, setIsValidatingCert] = React.useState(false)
  const [certValidated, setCertValidated] = React.useState(false)
  const [certError, setCertError] = React.useState<string | null>(null)
  const certIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const [focusStatus, setFocusStatus] = React.useState<{
    type: "success" | "error" | "info"
    text: string
  } | null>(null)
  const [focusEmpresaDetails, setFocusEmpresaDetails] = React.useState<{
    id?: string
    status?: string
  } | null>(null)

  // Estado da Etapa 3 - Contas Bancárias (Pluggy) e Link para Secretária Remota
  const [bankAccounts, setBankAccounts] = React.useState<ContaBancaria[]>([])
  const [isSecretariaMode, setIsSecretariaMode] = React.useState(false)
  const [secretaryName, setSecretaryName] = React.useState("")
  const [step3Mode, setStep3Mode] = React.useState<"direct" | "share_link">("direct")
  const [connectionLink, setConnectionLink] = React.useState("")
  const [isGeneratingLink, setIsGeneratingLink] = React.useState(false)
  const [isCopiedLink, setIsCopiedLink] = React.useState(false)
  const [doctorConnectedDetected, setDoctorConnectedDetected] = React.useState(false)

  // Estado da Etapa 4 - Simulação em tempo real e Nota Emitida
  type FlowStep = "idle" | "account_connected" | "sending_pix" | "identifying_payment" | "generating_invoice" | "invoice_emitted"
  const [flowStep, setFlowStep] = React.useState<FlowStep>("idle")
  const [, setPaymentDetected] = React.useState<{
    id?: string
    valor?: number
    descricao?: string
    data?: string
  } | null>(null)
  const [invoiceResult, setInvoiceResult] = React.useState<EmitirNotaResult | null>(null)
  const [step4Error, setStep4Error] = React.useState<string | null>(null)
  const [isFinalizing, setIsFinalizing] = React.useState(false)

  // Estado da animação estilo Ticker da Etapa 4
  const [step4Progress, setStep4Progress] = React.useState(0)
  const [step4DiscoveredItems, setStep4DiscoveredItems] = React.useState<ExtractedParamItem[]>([])
  const [step4SecondsLeft, setStep4SecondsLeft] = React.useState(8)
  const [isStep4CardExpanded, setIsStep4CardExpanded] = React.useState(true)
  const [isWaitingPayment, setIsWaitingPayment] = React.useState(false)
  const [waitingPaymentNotice, setWaitingPaymentNotice] = React.useState<string | null>(null)
  const [isRecheckingPayment, setIsRecheckingPayment] = React.useState(false)
  const [redirectCountdown, setRedirectCountdown] = React.useState(10)
  const isStep4AutoTriggeredRef = React.useRef(false)
  const step4IntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const redirectTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  const xmlInputRef = React.useRef<HTMLInputElement>(null)
  const certInputRef = React.useRef<HTMLInputElement>(null)
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const clearTimers = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    if (certIntervalRef.current) {
      clearInterval(certIntervalRef.current)
      certIntervalRef.current = null
    }
    if (step4IntervalRef.current) {
      clearInterval(step4IntervalRef.current)
      step4IntervalRef.current = null
    }
    if (redirectTimerRef.current) {
      clearInterval(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
  }

  // Função para mudar de etapa e persistir o checkpoint imediatamente
  const handleSelectStep = React.useCallback(
    (stepNumber: number) => {
      setActiveStep(stepNumber)
      if (doctor?.id) {
        saveOnboardingStep(doctor.id, stepNumber)
      }
      if (stepNumber === 4 && flowStep === "idle" && !invoiceResult) {
        setTimeout(() => {
          handleStartSimulation()
        }, 300)
      }
    },
    [doctor?.id, flowStep, invoiceResult]
  )

  // 1. Carrega dados iniciais do médico e restaura progresso salvo
  React.useEffect(() => {
    let mounted = true

    async function loadDoctorAndProgress() {
      try {
        const doc = await getCurrentDoctor()
        if (!mounted) return

        if (!doc) {
          setIsLoadingDoctor(false)
          router.push("/login")
          return
        }

        setDoctor(doc)

        // Garante a criação do paciente de teste 'Allan Miranda Severo Rodrigues' com R$ 0,01
        if (doc?.id) {
          ensureOnboardingDoctorPatient(doc.id).catch((e) => {
            console.warn("[Onboarding] Erro ao assegurar paciente de teste:", e)
          })
        }

        // Carrega em paralelo: dados fiscais, contas bancárias, notas e checkpoint salvo
        const [existing, existingAccounts, latestInvoice, savedStep] = await Promise.all([
          getDoctorFiscalData(doc.id),
          getDoctorBankAccounts(doc.id),
          getLatestDoctorInvoice(doc.id),
          getSavedOnboardingStep(doc.id),
        ])

        if (!mounted) return

        let step1Done = false
        let step2Done = false
        let step3Done = false

        // 1. Restaura Etapa 1
        if (existing && (existing.cnpj || existing.razao_social)) {
          setExtractedData(existing)
          setIsStep1Completed(true)
          setIsAnalyzing(true)
          setAnalysisProgress(100)
          step1Done = true

          // Preenche os parâmetros na tela
          const paramsList: ExtractedParamItem[] = [
            { id: "p1", label: "CNPJ", value: formatCnpj(existing.cnpj || "") },
            { id: "p2", label: "Razão Social", value: existing.razao_social || "Clínica Médica" },
            { id: "p3", label: "UF de Emissão", value: existing.uf || "SP" },
            { id: "p4", label: "Cód. IBGE", value: existing.codigo_municipio_ibge || "3550308" },
            { id: "p5", label: "Cód. Tributação", value: existing.codigo_tributacao_nacional || "04.01.01" },
            { id: "p6", label: "Item LC 116", value: "04.01 - Medicina e biomedicina" },
            { id: "p7", label: "Regime Tributário", value: existing.opcao_simples_nacional === "1" ? "Simples Nacional" : "Lucro Presumido" },
            { id: "p8", label: "Regime Especial", value: existing.regime_especial_tributacao || "Microempresa Municipal" },
            { id: "p9", label: "Alíquota ISS", value: existing.aliquota_iss_referencia ? `${existing.aliquota_iss_referencia}%` : "2,00%" },
            { id: "p10", label: "Padrão de Emissão", value: "NFS-e Nacional SPED v1.00" },
            { id: "p11", label: "Assinatura Digital", value: "SPED Válida" },
            { id: "p12", label: "CNAE", value: "8630-5/03 - Atividade Médica" },
            { id: "p13", label: "Retenção", value: "Sem Retenção (Tomador)" },
            { id: "p14", label: "Chave DPS", value: "Mapeada com sucesso" },
            { id: "p15", label: "Faturamento", value: "Automação Pronta para Emissão" },
          ]
          setDiscoveredParams(paramsList)
        }

        // 2. Restaura Etapa 2
        if (existing && (existing.focus_empresa_id || existing.certificado_validado_em)) {
          setFocusEmpresaDetails({
            id: existing.focus_empresa_id || "focus-empresa-cadastrada",
            status: existing.focus_empresa_status || "autorizado",
          })
          setCertValidated(true)
          setIsCertUploaded(true)
          setCertProgress(100)
          setIsCertAnalyzing(true)
          step2Done = true
        }

        // 3. Restaura Etapa 3
        if (existingAccounts && existingAccounts.length > 0) {
          setBankAccounts(existingAccounts)
          step3Done = true
          if (doc?.id) {
            ensureOnboardingDoctorPatient(doc.id).catch(() => {})
          }
        }

        // 4. Restaura Etapa 4
        if (latestInvoice && latestInvoice.success) {
          setInvoiceResult(latestInvoice)
          setFlowStep("invoice_emitted")
          setStep4Progress(100)
          setIsStep4CardExpanded(false)
          setStep4DiscoveredItems([
            { id: "st4-1", label: "Conta conectada", value: "Conta Bancária Open Finance Autorizada" },
            { id: "st4-2", label: "Enviando R$ 0,01 para sua conta", value: "Transferência PIX de R$ 0,01 realizada" },
            { id: "st4-3", label: "Identificado pagamento", value: formatPaymentTimestamp(latestInvoice.dataPagamento) },
            { id: "st4-4", label: "Emitindo sua nota", value: "NFS-e autorizada com sucesso na Focus NFe" },
          ])
        }

        // 5. Determina a etapa em que o usuário parou (restaura de onde parou)
        let targetStep = 1
        if (savedStep && savedStep >= 1 && savedStep <= 4) {
          if (savedStep === 4 && step3Done) targetStep = 4
          else if (savedStep === 3 && step2Done) targetStep = 3
          else if (savedStep === 2 && step1Done) targetStep = 2
          else if (savedStep === 1) targetStep = 1
          else {
            if (!step1Done) targetStep = 1
            else if (!step2Done) targetStep = 2
            else if (!step3Done) targetStep = 3
            else targetStep = 4
          }
        } else {
          if (!step1Done) targetStep = 1
          else if (!step2Done) targetStep = 2
          else if (!step3Done) targetStep = 3
          else targetStep = 4
        }

        setActiveStep(targetStep)
      } catch (err) {
        console.warn("[Onboarding] Erro ao carregar progresso:", err)
      } finally {
        if (mounted) {
          setIsLoadingDoctor(false)
        }
      }
    }

    loadDoctorAndProgress()

    return () => {
      mounted = false
      clearTimers()
    }
  }, [router])

  // Auto-inicia a Etapa 4 assim que ela é ativada se ainda não iniciou
  React.useEffect(() => {
    if (
      activeStep === 4 &&
      flowStep === "idle" &&
      !invoiceResult &&
      !isStep4AutoTriggeredRef.current &&
      bankAccounts.length > 0
    ) {
      isStep4AutoTriggeredRef.current = true
      handleStartSimulation()
    }
  }, [activeStep, flowStep, invoiceResult, bankAccounts.length])

  // Hook Pluggy Connect para Etapa 3
  const {
    isOpening: isOpeningPluggy,
    isSyncing: isSyncingPluggy,
    openPluggyConnect,
  } = usePluggyConnect({
    medicoId: doctor?.id,
    onAccountsUpdated: (newAccounts) => {
      setBankAccounts(newAccounts)
      if (newAccounts.length > 0) {
        if (doctor?.id) {
          ensureOnboardingDoctorPatient(doctor.id).catch(() => {})
        }
        setTimeout(() => handleSelectStep(4), 1200)
      }
    },
  })

  // Detecta se o onboarding foi aberto em modo Secretária Remota
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const role = params.get("role") || localStorage.getItem("notomed_user_role")
      const secName = localStorage.getItem("notomed_secretaria_nome") || ""
      if (role === "secretaria") {
        setIsSecretariaMode(true)
        setSecretaryName(secName)
        setStep3Mode("share_link")
      }
    }
  }, [])

  // Gerar link para o médico conectar o banco
  const generateLinkForDoctor = React.useCallback(
    async (medicoId: string) => {
      if (connectionLink || isGeneratingLink) return
      setIsGeneratingLink(true)
      try {
        const res = await fetch("/api/banking/connection-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicoId,
            medicoNome: doctor?.nome_completo || extractedData?.razao_social || "Médico",
            secretariaNome: secretaryName || "Secretária Remota",
          }),
        })
        const data = await res.json()
        if (data.url) {
          setConnectionLink(data.url)
        }
      } catch (err) {
        console.error("[Onboarding] Erro ao gerar link de conexão:", err)
      } finally {
        setIsGeneratingLink(false)
      }
    },
    [connectionLink, isGeneratingLink, doctor, extractedData, secretaryName]
  )

  // Dispara a geração de link assim que a Etapa 3 for aberta em modo link
  React.useEffect(() => {
    if (activeStep === 3 && (isSecretariaMode || step3Mode === "share_link") && doctor?.id && !connectionLink) {
      generateLinkForDoctor(doctor.id)
    }
  }, [activeStep, isSecretariaMode, step3Mode, doctor?.id, connectionLink, generateLinkForDoctor])

  // Polling em tempo real na Etapa 3: reconhece assim que o médico conecta no celular/computador dele
  React.useEffect(() => {
    if (activeStep !== 3 || !doctor?.id || bankAccounts.length > 0) return

    let isPolling = true
    const checkDoctorAccounts = async () => {
      try {
        const accounts = await getDoctorBankAccounts(doctor.id)
        if (accounts && accounts.length > 0 && isPolling) {
          setBankAccounts(accounts)
          setDoctorConnectedDetected(true)
          if (doctor?.id) {
            ensureOnboardingDoctorPatient(doctor.id).catch(() => {})
          }
          setTimeout(() => {
            handleSelectStep(4)
          }, 1800)
        }
      } catch (err) {
        console.warn("[Onboarding] Polling de contas bancárias:", err)
      }
    }

    const interval = setInterval(checkDoctorAccounts, 2500)
    return () => {
      isPolling = false
      clearInterval(interval)
    }
  }, [activeStep, doctor?.id, bankAccounts.length, handleSelectStep])

  const handleCopyLink = () => {
    if (!connectionLink) return
    navigator.clipboard.writeText(connectionLink)
    setIsCopiedLink(true)
    setTimeout(() => setIsCopiedLink(false), 2500)
  }

  const whatsAppShareUrl = React.useMemo(() => {
    if (!connectionLink) return "#"
    const medicoNome = doctor?.nome_completo || extractedData?.razao_social || "Doutor(a)"
    const msg = `Olá, Dr(a). ${medicoNome}! Aqui é da equipe NotoMed. Para concluirmos a automação da emissão das suas notas fiscais de consultas e procedimentos, por favor conecte sua conta bancária de forma segura através deste link:\n\n${connectionLink}\n\nO processo leva menos de 1 minuto e é protegido pelos padrões de Open Finance do Banco Central do Brasil.`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }, [connectionLink, doctor, extractedData])

  // Status de conclusão de cada etapa
  const isStep1Done = isStep1Completed || Boolean(extractedData?.cnpj)
  const isStep2Done = Boolean(focusEmpresaDetails?.id || extractedData?.focus_empresa_id || certValidated)
  const isStep3Done = bankAccounts.length > 0
  const isStep4Done = Boolean(invoiceResult?.success || flowStep === "invoice_emitted")

  // Cancelar / Parar análise do XML
  const handleStopAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    setIsAnalyzing(false)
    setIsDropping(false)
    setIsDraggingOver(false)
    setAnalysisProgress(0)
    setDiscoveredParams([])
    setXmlFileName("")
    setXmlError(null)
  }

  // Upload e simulação de leitura do Certificado Digital A1 na Etapa 2
  const handleCertFileUpload = (file: File) => {
    setCertificateFile(file)
    setCertError(null)
    setIsCertAnalyzing(true)
    setCertProgress(0)
    setIsCertUploaded(false)
    setCertValidated(false)

    let currentProg = 0
    if (certIntervalRef.current) clearInterval(certIntervalRef.current)
    certIntervalRef.current = setInterval(() => {
      currentProg += 12
      if (currentProg >= 100) {
        if (certIntervalRef.current) {
          clearInterval(certIntervalRef.current)
          certIntervalRef.current = null
        }
        setCertProgress(100)
        setIsCertUploaded(true)
      } else {
        setCertProgress(currentProg)
      }
    }, 140)
  }

  // Cancelar / Trocar de Certificado
  const handleCancelCert = () => {
    if (certIntervalRef.current) {
      clearInterval(certIntervalRef.current)
      certIntervalRef.current = null
    }
    setCertificateFile(null)
    setCertificatePassword("")
    setShowCertPassword(false)
    setIsCertAnalyzing(false)
    setCertProgress(0)
    setIsCertUploaded(false)
    setCertValidated(false)
    setCertError(null)
  }

  // Processamento e Validação do Certificado A1 na Focus NFe
  const handleEnviarCertificado = async () => {
    if (!doctor?.id || !certificateFile) return
    if (!certificatePassword.trim()) {
      setCertError("Por favor, informe a senha do certificado digital.")
      return
    }

    setIsValidatingCert(true)
    setCertError(null)

    try {
      const res = await enviarCertificadoParaFocusNFe({
        medicoId: doctor.id,
        certificateFile,
        password: certificatePassword,
      })

      if (res.success) {
        setCertValidated(true)
        setFocusEmpresaDetails({
          id: res.empresaId || "focus-empresa-cadastrada",
          status: "autorizado",
        })
        // Aguarda 1.2s para o usuário ver "Certificado validado" e passa para a próxima etapa
        setTimeout(() => {
          handleSelectStep(3)
        }, 1200)
      } else {
        setCertError(res.error || "Falha ao validar o certificado no Focus NFe. Verifique a senha informada.")
      }
    } catch (err: unknown) {
      setCertError(err instanceof Error ? err.message : "Erro de conexão ao validar certificado.")
    } finally {
      setIsValidatingCert(false)
    }
  }

  // Processamento do upload de XML na Etapa 1 com animação em fases
  const handleXmlFileUpload = async (file: File) => {
    if (!doctor?.id) return
    setIsDraggingOver(false)
    setIsDropping(true)
    setXmlError(null)
    setXmlFileName(file.name)

    // Breve pausa para as folhas do SVG retraírem para a folha central
    await new Promise((r) => setTimeout(r, 380))

    try {
      const xmlString = await file.text()
      const parseResult = parseSpedNfseXml(xmlString)

      if (!parseResult || !parseResult.cnpj) {
        setXmlError("Não foi possível extrair dados válidos deste arquivo XML. Verifique se o XML é uma NFS-e padrão SPED válida.")
        setIsDropping(false)
        return
      }

      // Prepara os 15 parâmetros fiscais com os dados extraídos
      const paramsList: ExtractedParamItem[] = [
        { id: "p1", label: "CNPJ", value: formatCnpj(parseResult.cnpj) },
        { id: "p2", label: "Razão Social", value: parseResult.razao_social || "Clínica Médica" },
        { id: "p3", label: "UF de Emissão", value: parseResult.uf || "SP" },
        { id: "p4", label: "Cód. IBGE", value: parseResult.codigo_municipio_ibge || "3550308" },
        { id: "p5", label: "Cód. Tributação", value: parseResult.codigo_tributacao_nacional || "04.01.01" },
        { id: "p6", label: "Item LC 116", value: "04.01 - Medicina e biomedicina" },
        { id: "p7", label: "Regime Tributário", value: parseResult.opcao_simples_nacional === "1" ? "Simples Nacional" : "Lucro Presumido" },
        { id: "p8", label: "Regime Especial", value: parseResult.regime_especial_tributacao || "Microempresa Municipal" },
        { id: "p9", label: "Alíquota ISS", value: parseResult.aliquota_iss_referencia ? `${parseResult.aliquota_iss_referencia}%` : "2,00%" },
        { id: "p10", label: "Padrão de Emissão", value: "NFS-e Nacional SPED v1.00" },
        { id: "p11", label: "Assinatura Digital", value: "SPED Válida" },
        { id: "p12", label: "CNAE", value: "8630-5/03 - Atividade Médica" },
        { id: "p13", label: "Retenção", value: "Sem Retenção (Tomador)" },
        { id: "p14", label: "Chave DPS", value: "Mapeada com sucesso" },
        { id: "p15", label: "Faturamento", value: "Automação Pronta para Emissão" },
      ]

      // Salva no banco de dados
      await saveDoctorFiscalData(doctor.id, parseResult)
      setExtractedData(parseResult)

      // Inicia a experiência de extração dinâmica (~4.8 segundos no total)
      setIsAnalyzing(true)
      setAnalysisProgress(0)
      setDiscoveredParams([])

      let currentIndex = 0
      const totalParams = paramsList.length
      const stepDuration = 320 // ms por parâmetro p/ leitura confortável e animação suave

      analysisIntervalRef.current = setInterval(() => {
        if (currentIndex < totalParams) {
          const item = paramsList[currentIndex]
          setDiscoveredParams((prev) => [...prev, item])
          currentIndex += 1
          setAnalysisProgress(Math.round((currentIndex / totalParams) * 100))
        } else {
          if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current)
            analysisIntervalRef.current = null
          }
          setAnalysisProgress(100)
          setIsStep1Completed(true)
        }
      }, stepDuration)
    } catch {
      setXmlError("Erro na leitura do arquivo XML.")
      setIsDropping(false)
    }
  }

  const handleAdvanceToStep2 = () => {
    setIsStep1Completed(true)
    handleSelectStep(2)
  }



  // Paciente de teste oficial para conciliação do PIX de R$ 0,01 enviado pela Notomed
  const onboardingPatientName = PACIENTE_ONBOARDING_TESTE.nome
  const onboardingPatientDoc = PACIENTE_ONBOARDING_TESTE.cnpj
  const onboardingPatientDocFormatted = PACIENTE_ONBOARDING_TESTE.cnpjFormatado
  const onboardingPatientEmail = PACIENTE_ONBOARDING_TESTE.email

  // Execução da emissão da NFS-e Nacional na Etapa 4
  const triggerEmitInvoice = async (transacaoId?: string, dataPagamento?: string) => {
    if (!doctor?.id) return
    setStep4Error(null)
    setFlowStep("generating_invoice")

    try {
      const emitRes = await emitirPrimeiraNota({
        medicoId: doctor.id,
        tomador: {
          nome: onboardingPatientName,
          cpfCnpj: onboardingPatientDoc,
          email: onboardingPatientEmail,
        },
        valor: 0.01,
        transacaoId,
        dataPagamento,
      })

      if (emitRes.success) {
        setStep4Progress(100)
        setInvoiceResult(emitRes)
        setFlowStep("invoice_emitted")
        setIsStep4CardExpanded(false)

        setStep4DiscoveredItems((prev) =>
          prev.map((it) =>
            it.id === "st4-4"
              ? {
                  ...it,
                  value: `NFS-e Nº ${emitRes.numeroNfse || emitRes.referencia || "1"} emitida com sucesso`,
                }
              : it
          )
        )
        await concluirOnboarding(doctor.id)
      } else {
        setStep4Error(emitRes.error || "Erro ao emitir nota fiscal no Focus NFe.")
      }
    } catch {
      setStep4Error("Falha inesperada ao emitir a nota fiscal.")
    }
  }

  // Início do fluxo de emissão em 4 passos na Etapa 4
  const handleStartSimulation = async () => {
    clearTimers()
    setStep4Error(null)
    setIsWaitingPayment(false)
    setWaitingPaymentNotice(null)
    setFlowStep("account_connected")
    setStep4Progress(25)
    setStep4SecondsLeft(8)

    const primaryAccount = bankAccounts[0]
    if (!primaryAccount) {
      setStep4Error("Nenhuma conta bancária conectada. Por favor, conecte sua conta na Etapa 3.")
      return
    }

    // Marca o timestamp de início da validação para compliance temporal
    const step4StartedAt = new Date().toISOString()

    // 1. Conta conectada
    const item1: ExtractedParamItem = {
      id: "st4-1",
      label: "Conta conectada",
      value: `${primaryAccount.banco_nome || "Banco Conectado"} • Ag ${primaryAccount.agencia || "—"} C/C ${primaryAccount.numero_conta || "—"}`,
    }
    setStep4DiscoveredItems([item1])

    await new Promise((r) => setTimeout(r, 1200))

    // 2. Enviando R$ 0,01 para sua conta (Duração de 8 segundos com contagem)
    setFlowStep("sending_pix")
    const item2: ExtractedParamItem = {
      id: "st4-2",
      label: "Enviando R$ 0,01 para sua conta",
      value: "Aguardando transferência de R$ 0,01 (8s)...",
    }
    setStep4DiscoveredItems([item1, item2])

    let elapsed = 0
    const totalDuration = 8

    await new Promise<void>((resolve) => {
      step4IntervalRef.current = setInterval(() => {
        elapsed += 0.2
        const prog = Math.min(65, 25 + Math.round((elapsed / totalDuration) * 40))
        setStep4Progress(prog)

        const remaining = Math.max(0, Math.ceil(totalDuration - elapsed))
        setStep4SecondsLeft(remaining)

        setStep4DiscoveredItems((prev) =>
          prev.map((it) =>
            it.id === "st4-2"
              ? {
                  ...it,
                  value:
                    remaining > 0
                      ? `Aguardando transferência de R$ 0,01 (${remaining}s)...`
                      : "Transferência de R$ 0,01 enviada",
                }
              : it
          )
        )

        if (elapsed >= totalDuration) {
          if (step4IntervalRef.current) {
            clearInterval(step4IntervalRef.current)
            step4IntervalRef.current = null
          }
          resolve()
        }
      }, 200)
    })

    // 3. Verificando / Identificado pagamento
    setFlowStep("identifying_payment")
    setStep4Progress(75)

    if (doctor?.id) {
      ensureOnboardingDoctorPatient(doctor.id).catch(() => {})
    }

    let payRes = await checkPaymentReceived(
      primaryAccount.pluggy_account_id,
      0.01,
      onboardingPatientName,
      onboardingPatientDoc,
      doctor?.id,
      undefined,
      step4StartedAt
    )

    let transacaoDetectada = payRes?.pago && payRes?.transacao ? payRes.transacao : null

    // Se o pagamento ainda não foi identificado, inicia polling de checagem
    if (!transacaoDetectada) {
      setIsWaitingPayment(true)
      const isAlreadyInvoiced = Boolean(payRes?.jaFaturado)
      const notice = isAlreadyInvoiced
        ? "O último PIX de R$ 0,01 recebido já possui nota emitida. Envie uma nova transferência de R$ 0,01 para emitir a nota deste teste."
        : "Aguardando confirmação do PIX de R$ 0,01 no extrato bancário..."
      setWaitingPaymentNotice(notice)

      setStep4DiscoveredItems([
        item1,
        item2,
        {
          id: "st4-3",
          label: isAlreadyInvoiced ? "Aguardando novo PIX de R$ 0,01" : "Identificando pagamento",
          value: notice,
        },
      ])

      // Polling por até 12 tentativas (a cada 3.5 segundos)
      for (let attempt = 1; attempt <= 12; attempt++) {
        await new Promise((r) => setTimeout(r, 3500))
        payRes = await checkPaymentReceived(
          primaryAccount.pluggy_account_id,
          0.01,
          onboardingPatientName,
          onboardingPatientDoc,
          doctor?.id,
          undefined,
          step4StartedAt
        )
        if (payRes?.pago && payRes?.transacao) {
          transacaoDetectada = payRes.transacao
          break
        }
      }
    }

    // REGRA FUNDAMENTAL: Se o pagamento NÃO foi localizado, NUNCA emite a nota fiscal!
    if (!transacaoDetectada) {
      setIsWaitingPayment(true)
      const isAlreadyInvoiced = Boolean(payRes?.jaFaturado)
      const finalNotice = isAlreadyInvoiced
        ? "O último PIX de R$ 0,01 já foi faturado anteriormente. Por favor, envie uma nova transferência de R$ 0,01 e clique em 'Verificar Novamente'."
        : "Transferência de R$ 0,01 ainda não identificada no extrato Open Finance. Assim que enviar, clique em 'Verificar Novamente'."
      setWaitingPaymentNotice(finalNotice)

      setStep4DiscoveredItems([
        item1,
        item2,
        {
          id: "st4-3",
          label: isAlreadyInvoiced ? "Novo PIX necessário" : "Aguardando pagamento",
          value: finalNotice,
        },
      ])
      return
    }

    // 4. Pagamento REALMENTE identificado com sucesso!
    setIsWaitingPayment(false)
    setWaitingPaymentNotice(null)
    setPaymentDetected(transacaoDetectada)
    setStep4Progress(85)

    const item3Success: ExtractedParamItem = {
      id: "st4-3",
      label: "Identificado pagamento",
      value: formatPaymentTimestamp(transacaoDetectada.data),
    }
    setStep4DiscoveredItems([item1, item2, item3Success])

    await new Promise((r) => setTimeout(r, 1200))

    // 5. Emitindo sua nota fiscal no Focus NFe
    setFlowStep("generating_invoice")
    setStep4Progress(90)

    const item4: ExtractedParamItem = {
      id: "st4-4",
      label: "Emitindo sua nota",
      value: "Autorizando NFS-e Nacional na Focus NFe...",
    }
    setStep4DiscoveredItems([item1, item2, item3Success, item4])

    await triggerEmitInvoice(transacaoDetectada.id, transacaoDetectada.data)
  }

  // Rechecagem manual acionada pelo botão quando o pagamento ainda está aguardando
  const handleManualRecheckPayment = async () => {
    const primaryAccount = bankAccounts[0]
    if (!primaryAccount) return
    setIsRecheckingPayment(true)
    setStep4Error(null)

    try {
      const payRes = await checkPaymentReceived(
        primaryAccount.pluggy_account_id,
        0.01,
        onboardingPatientName,
        onboardingPatientDoc,
        doctor?.id
      )

      if (payRes?.pago && payRes?.transacao) {
        setIsWaitingPayment(false)
        setWaitingPaymentNotice(null)
        setPaymentDetected(payRes.transacao)
        setStep4Progress(85)

        const item3Success: ExtractedParamItem = {
          id: "st4-3",
          label: "Identificado pagamento",
          value: formatPaymentTimestamp(payRes.transacao.data),
        }

        setStep4DiscoveredItems((prev) =>
          prev.map((it) => (it.id === "st4-3" ? item3Success : it))
        )

        await new Promise((r) => setTimeout(r, 1000))
        setFlowStep("generating_invoice")
        setStep4Progress(90)

        const item4: ExtractedParamItem = {
          id: "st4-4",
          label: "Emitindo sua nota",
          value: "Autorizando NFS-e Nacional na Focus NFe...",
        }
        setStep4DiscoveredItems((prev) => [...prev.filter((i) => i.id !== "st4-4"), item4])

        await triggerEmitInvoice(payRes.transacao.id, payRes.transacao.data)
      } else {
        const isAlreadyInvoiced = Boolean(payRes?.jaFaturado)
        setWaitingPaymentNotice(
          isAlreadyInvoiced
            ? "O último PIX de R$ 0,01 recebido já possui nota emitida. Envie uma nova transferência de R$ 0,01 para emitir a nota deste teste."
            : "Pagamento ainda não localizado no extrato. Aguarde alguns instantes e clique para tentar novamente."
        )
      }
    } catch (err) {
      console.warn("[Onboarding] Erro ao rechecar pagamento:", err)
    } finally {
      setIsRecheckingPayment(false)
    }
  }

  // Concluir e ir para o Dashboard
  const handleFinalizarOnboarding = React.useCallback(async () => {
    if (!doctor?.id) return
    setIsFinalizing(true)
    await concluirOnboarding(doctor.id)
    router.push("/dashboard")
  }, [doctor?.id, router])

  // Contagem regressiva de 10 segundos para redirecionamento automático ao painel
  React.useEffect(() => {
    if (flowStep !== "invoice_emitted" || !invoiceResult) return

    setRedirectCountdown(10)
    redirectTimerRef.current = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          if (redirectTimerRef.current) {
            clearInterval(redirectTimerRef.current)
            redirectTimerRef.current = null
          }
          handleFinalizarOnboarding()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (redirectTimerRef.current) {
        clearInterval(redirectTimerRef.current)
        redirectTimerRef.current = null
      }
    }
  }, [flowStep, Boolean(invoiceResult), handleFinalizarOnboarding])

  // As 4 etapas solicitadas
  const tagsConfig = [
    {
      stepNum: 1,
      tag: "Configurar as notas",
      title: "Arraste o XML da sua última nota fiscal aqui para configurarmos seus dados automaticamente.",
      description: "O sistema mapeia as regras de tributação na hora. Nada de digitação ou consultas à contabilidade.",
      isCompleted: isStep1Done,
      isUnlocked: true,
    },
    {
      stepNum: 2,
      tag: "Validar o certificado",
      title: "Conecte o Certificado A1 para emissões automáticas.",
      description: "A legislação exige a assinatura digital para garantir a validade jurídica dos seus documentos gerados sem intervenção manual.",
      isCompleted: isStep2Done,
      isUnlocked: isStep1Done,
    },
    {
      stepNum: 3,
      tag: "Conectar os bancos",
      title: "Conecte sua conta de recebimentos para emitir a nota assim que o paciente pagar.",
      description: "Mapeamos os acertos dos pacientes sem você precisar conferir o extrato. Conexão blindada e garantida pelas leis de segurança do Banco Central (Bacen).",
      isCompleted: isStep3Done,
      isUnlocked: isStep2Done,
    },
    {
      stepNum: 4,
      tag: "Primeira NFS-e",
      title: "Sua primeira NFS-e está sendo emitida.",
      description: "Com a conta conectada, acompanhe a detecção do pagamento e a autorização da sua primeira nota fiscal em homologação.",
      isCompleted: isStep4Done,
      isUnlocked: isStep3Done,
    },
  ]

  const currentStepData = tagsConfig.find((t) => t.stepNum === activeStep) || tagsConfig[0]

  const doctorInitials = React.useMemo(() => {
    if (!doctor?.nome_completo) return "DR"
    const parts = doctor.nome_completo.replace(/^(Dr\.|Dra\.|Dr\(a\)\.|Dr|Dra)\s*/i, "").trim().split(" ")
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }, [doctor?.nome_completo])

  if (isLoadingDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-emerald-500" />
          <p className="text-xs text-muted-foreground">Carregando dados de configuração...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-zinc-950 text-foreground">
      {/* Inputs Ocultos de Arquivo */}
      <input
        type="file"
        ref={xmlInputRef}
        accept=".xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleXmlFileUpload(file)
        }}
      />
      <input
        type="file"
        ref={certInputRef}
        accept=".pfx,.p12"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleCertFileUpload(file)
        }}
      />

      {/* ============================================================ */}
      {/* HEADER GLOBAL (100% LARGURA): LOGO ESQUERDA + AVATAR DIREITA */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-zinc-950/95 px-6 backdrop-blur-md">
        {/* Lado Esquerdo: Ícone da logo da marca + Nome */}
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
        </div>

        {/* Lado Direito: Foto do Avatar do Usuário */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden sm:inline">
            Olá, Dr(a). {doctor?.nome_completo?.replace(/^(Dr\.|Dra\.|Dr\(a\)\.|Dr|Dra)\s*/i, "") || "Doutor(a)"}
          </span>
          <Avatar className="size-8 border border-neutral-200 dark:border-neutral-700">
            <AvatarImage src={doctor?.avatar_url || undefined} alt="Avatar do usuário" />
            <AvatarFallback className="text-[11px] font-semibold bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200">
              {doctorInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* ============================================================ */}
      {/* SUB-HEADER: TAGS HORIZONTAIS DAS 4 ETAPAS (SEM FUNDO, SEM LINHAS) */}
      {/* ============================================================ */}
      <div className="w-full bg-white dark:bg-zinc-950 py-3.5 px-4 flex items-center justify-center overflow-x-auto">
        <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
          {tagsConfig.map((item) => {
            const isActive = activeStep === item.stepNum
            const isCompleted = item.isCompleted && !isActive
            const isLocked = !item.isUnlocked

            return (
              <button
                key={item.stepNum}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && handleSelectStep(item.stepNum)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs transition-all select-none whitespace-nowrap bg-transparent",
                  isActive
                    ? "border border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold"
                    : isCompleted
                    ? "border border-neutral-300/80 dark:border-neutral-700/80 text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer font-normal"
                    : isLocked
                    ? "border border-neutral-200/60 dark:border-neutral-800/60 text-neutral-400 dark:text-neutral-600 opacity-50 cursor-not-allowed font-normal"
                    : "border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 cursor-pointer font-medium"
                )}
              >
                {/* Ícone ou Número */}
                {isCompleted ? (
                  <CircleDashedCheck strokeWidth={1.75} className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : isLocked ? (
                  <span className="flex size-4.5 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-400 shrink-0">
                    <LockKeyhole strokeWidth={1.75} className="size-2.5" />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex size-4.5 items-center justify-center rounded-full border text-[10px] shrink-0",
                      isActive
                        ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold"
                        : "border-neutral-400 text-neutral-600 dark:text-neutral-300 font-medium"
                    )}
                  >
                    {item.stepNum}
                  </span>
                )}

                <span>{item.tag}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ÁREA DE CONTEÚDO COM DOTTED BACKDROP FADED NO TOPO             */}
      {/* ============================================================ */}
      <div className="relative flex-1 w-full flex flex-col items-center bg-white dark:bg-zinc-950 overflow-hidden">
        {/* Bolinhas discretas que cobrem título e descrição e perdem opacidade logo acima das animações */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[210px] sm:h-[235px] select-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0, 0, 0, 0.16) 1.2px, transparent 1.2px)",
            backgroundSize: "16px 16px",
            maskImage:
              "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 45%, rgba(0, 0, 0, 0.2) 75%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 45%, rgba(0, 0, 0, 0.2) 75%, transparent 100%)",
          }}
        />

        {/* ============================================================ */}
        {/* CONTEÚDO CENTRALIZADO: TÍTULO, DESCRIÇÃO E AÇÃO               */}
        {/* ============================================================ */}
        <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col items-center">
        {/* Título e Descrição Centralizados */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2">
            {currentStepData.title}
          </h1>
          {activeStep !== 3 && (
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed">
              {currentStepData.description}
            </p>
          )}
        </div>

        {/* ========================================================== */}
        {/* ETAPA 1: CONFIGURAR AS NOTAS (SVG INTERATIVO + CARD TICKER)*/}
        {/* ========================================================== */}
        {activeStep === 1 && (
          <div className="w-full max-w-lg flex flex-col items-center">
            {/* Mensagem de Erro (se houver) */}
            {xmlError && (
              <div className="mb-4 flex items-start gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs w-full text-left">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{xmlError}</span>
              </div>
            )}

            {/* Caso 1: Área de Upload com SVG Animado (visível antes da extração) */}
            {!isAnalyzing && (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingOver(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDraggingOver(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDraggingOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleXmlFileUpload(file)
                }}
                onClick={() => xmlInputRef.current?.click()}
                className={cn(
                  "w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-10 border shadow-xs flex flex-col items-center text-center cursor-pointer transition-all group",
                  isDraggingOver
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.02]"
                    : "border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-zinc-700"
                )}
              >
                {/* SVG animado com expansão lateral no drag e retração no drop */}
                <div className="mb-6 flex items-center justify-center">
                  <XmlAnimatedSvg
                    isDragging={isDraggingOver}
                    isDropping={isDropping}
                    className="w-44 h-auto select-none"
                  />
                </div>

                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {isDraggingOver ? "Solte o arquivo XML aqui" : "Arraste o arquivo XML aqui"}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  ou clique para selecionar do seu computador
                </p>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300">
                  <FileCode2 className="size-3.5" />
                  Formatos aceitos: .XML
                </span>
              </div>
            )}

            {/* Caso 2: Card de Análise / Extração (Inspirado no Banner Anexado) */}
            {isAnalyzing && (
              <div className="w-full max-w-lg flex flex-col items-start">
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm overflow-hidden text-left"
                >
                  {/* Cabeçalho do Card */}
                  <div className="p-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/70">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {analysisProgress >= 100 ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <Loader2 className="size-4.5 animate-spin" />
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {analysisProgress >= 100 ? "Notas configuradas!" : "Extraindo dados fiscais"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsCardExpanded(!isCardExpanded)}
                        className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                        title={isCardExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                      >
                        {isCardExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleStopAnalysis}
                        className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Parar e trocar de arquivo"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Corpo do Card: Ticker de no máximo 3 itens visíveis sumindo para trás */}
                  {isCardExpanded && (
                    <div
                      className="px-5 py-3.5 min-h-[115px] flex flex-col justify-end overflow-hidden"
                      style={{ perspective: 600 }}
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {discoveredParams.slice(-3).map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 16, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{
                              opacity: 0,
                              y: -18,
                              scale: 0.84,
                              filter: "blur(3px)",
                              transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] },
                            }}
                            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-2 py-1.5 text-xs origin-top"
                          >
                            <span className="text-neutral-400 dark:text-neutral-500 font-normal shrink-0">
                              {item.label}:
                            </span>
                            <span className="text-neutral-900 dark:text-neutral-100 font-semibold font-mono text-[11px] truncate">
                              {item.value}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Rodapé do Card com Barra de Progresso, contagem e status */}
                  <div className="px-5 py-3 bg-neutral-50/70 dark:bg-zinc-800/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs relative">
                    {/* Esquerda: Quantos foram extraídos */}
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {discoveredParams.length}
                      </span>
                      <span>{discoveredParams.length === 1 ? "parâmetro extraído" : "parâmetros extraídos"}</span>
                    </div>

                    {/* Direita: 'Parar análise' durante o processo, ou '0, dados perdidos' ao finalizar */}
                    {analysisProgress < 100 ? (
                      <button
                        type="button"
                        onClick={handleStopAnalysis}
                        className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Parar análise
                      </button>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1.5">
                        <Check className="size-3 stroke-[2.5]" />
                        0, dados perdidos
                      </span>
                    )}

                    {/* Linha verde de progresso na base do card */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${analysisProgress}%` }}
                        transition={{ ease: "linear", duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Botão Próximo alinhado no canto esquerdo abaixo do card (maior e mais espaçado) */}
                <div className="w-full flex justify-start mt-9">
                  <Button
                    type="button"
                    disabled={analysisProgress < 100}
                    onClick={handleAdvanceToStep2}
                    className={cn(
                      "rounded-full h-11 px-9 text-sm font-semibold transition-all cursor-pointer",
                      analysisProgress >= 100
                        ? "bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] shadow-xs hover:shadow"
                        : "bg-neutral-200 text-neutral-400 dark:bg-zinc-800 dark:text-neutral-500 opacity-60 cursor-not-allowed"
                    )}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* ETAPA 2: VALIDAR O CERTIFICADO DIGITAL A1                 */}
        {/* ========================================================== */}
        {activeStep === 2 && (
          <div className="w-full max-w-lg flex flex-col items-center">
            {/* Erro fora do card se houver */}
            {certError && !isCertAnalyzing && (
              <div className="mb-4 flex items-start gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs w-full text-left">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{certError}</span>
              </div>
            )}

            {/* Caso 1: Área de Upload do Certificado (visível antes de anexar) */}
            {!isCertAnalyzing && (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsCertDraggingOver(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsCertDraggingOver(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsCertDraggingOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleCertFileUpload(file)
                }}
                onClick={() => certInputRef.current?.click()}
                className={cn(
                  "w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-10 border shadow-xs flex flex-col items-center text-center cursor-pointer transition-all group",
                  isCertDraggingOver
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.02]"
                    : "border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-zinc-700"
                )}
              >
                <div className="mb-6 flex items-center justify-center">
                  <div className="size-20 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                    <ShieldCheck className="size-10" strokeWidth={1.75} />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {isCertDraggingOver ? "Solte o arquivo do certificado aqui" : "Arraste o certificado digital aqui"}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  ou clique para selecionar do seu computador
                </p>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300">
                  <FileKey2 className="size-3.5" />
                  Formatos aceitos: .PFX, .P12 (Certificado A1)
                </span>
              </div>
            )}

            {/* Caso 2: Card de Análise / Anexo do Certificado (Mesma animação da Etapa 1) */}
            {isCertAnalyzing && (
              <div className="w-full max-w-lg flex flex-col items-start">
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm overflow-hidden text-left"
                >
                  {/* Cabeçalho do Card */}
                  <div className="p-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/70">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {/* "O ícone, em vez de ser o cheque, é o ícone do certificado" */}
                        {certProgress < 100 ? (
                          <Loader2 className="size-4.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-5" />
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {certProgress >= 100 ? "Concluído" : "Anexar certificado"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCancelCert}
                        className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Trocar de certificado"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="px-5 py-4 flex flex-col gap-2">
                    {/* Informação do arquivo anexado */}
                    <div className="flex items-center justify-between py-1 text-xs">
                      <div className="flex items-center gap-2">
                        <FileKey2 className="size-4 text-neutral-400 shrink-0" />
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium truncate max-w-[280px]">
                          {certificateFile?.name || "certificado_digital.pfx"}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {certProgress < 100 ? `${certProgress}%` : "100%"}
                      </span>
                    </div>
                  </div>

                  {/* Linha verde de progresso na base do card */}
                  <div className="h-1 bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${certProgress}%` }}
                      transition={{ ease: "linear", duration: 0.25 }}
                    />
                  </div>
                </motion.div>

                {/* Solicitação da Senha separada abaixo da conclusão do arquivo (sem container em volta, só linha) */}
                {certProgress >= 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full mt-6 flex flex-col items-start gap-4 text-left"
                  >
                    <div className="w-full">
                      <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                        Senha do certificado digital
                      </label>
                      <div className="relative w-full">
                        <Input
                          type={showCertPassword ? "text" : "password"}
                          autoFocus
                          placeholder="Digite a senha do certificado A1"
                          value={certificatePassword}
                          onChange={(e) => setCertificatePassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && certificatePassword.trim().length >= 4 && !isValidatingCert) {
                              handleEnviarCertificado()
                            }
                          }}
                          className="w-full h-11 rounded-xl bg-transparent border border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white pl-4 pr-11 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCertPassword(!showCertPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer p-1"
                          title={showCertPassword ? "Ocultar senha" : "Ver senha"}
                        >
                          {showCertPassword ? (
                            <EyeOff className="size-4 text-neutral-500 dark:text-neutral-400" />
                          ) : (
                            <Eye className="size-4 text-neutral-500 dark:text-neutral-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Mensagem de Erro, se houver */}
                    {certError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-start gap-2 w-full">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span>{certError}</span>
                      </div>
                    )}

                    {/* Validação com Sucesso: "Certificado validado" */}
                    {certValidated && (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 w-full">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          <span>Certificado digital validado com sucesso</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleSelectStep(3)}
                          className="rounded-full h-11 px-9 text-sm font-semibold bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] shadow-xs cursor-pointer mt-1 self-start"
                        >
                          Próximo →
                        </Button>
                      </div>
                    )}

                    {/* Botão Validar: só fica clicável quando tiver no mínimo 4 letras no input */}
                    {!certValidated && (
                      <Button
                        type="button"
                        disabled={isValidatingCert || certificatePassword.trim().length < 4}
                        onClick={handleEnviarCertificado}
                        className={cn(
                          "rounded-full h-11 px-9 text-sm font-semibold transition-all cursor-pointer mt-1",
                          certificatePassword.trim().length >= 4 && !isValidatingCert
                            ? "bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] shadow-xs hover:shadow"
                            : "bg-neutral-200 text-neutral-400 dark:bg-zinc-800 dark:text-neutral-500 opacity-60 cursor-not-allowed"
                        )}
                      >
                        {isValidatingCert ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Validando na Focus NFe...
                          </span>
                        ) : (
                          "Validar"
                        )}
                      </Button>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* ETAPA 3: CONECTAR OS BANCOS (PLUGGY OPEN FINANCE)          */}
        {/* ========================================================== */}
        {activeStep === 3 && (
          <div className="w-full max-w-lg flex flex-col items-center text-center">
            {step3Mode === "share_link" && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-1">
                <Smartphone className="size-3.5" />
                <span>Modo Secretária Remota: Link para o Médico</span>
              </div>
            )}

            {/* Animação NotoMed <-> Pluggy flutuando limpa sem card, sem fundo e sem containers sem linha */}
            <div className="w-full flex items-center justify-center my-4">
              <IconConnectionAnimation />
            </div>

            {/* Caso 1: Modo Compartilhar Link com o Médico (Secretária Remota) */}
            {step3Mode === "share_link" ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 p-6 shadow-xs flex flex-col gap-4 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    Envie o link para Dr(a). {doctor?.nome_completo || extractedData?.razao_social || "Médico"}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    O médico abrirá no celular ou computador dele para conectar a conta bancária com segurança via Open Finance.
                  </p>
                </div>

                {isGeneratingLink ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-xs text-neutral-400">
                    <Loader2 className="size-4 animate-spin text-emerald-500" />
                    <span>Gerando link seguro de conexão...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={connectionLink || "Gerando link..."}
                        className="h-10 text-xs font-mono bg-neutral-50 dark:bg-zinc-800/60 border-neutral-200 dark:border-neutral-700 select-all"
                      />
                      <Button
                        type="button"
                        onClick={handleCopyLink}
                        className={cn(
                          "h-10 px-4 shrink-0 rounded-xl text-xs font-medium transition-all cursor-pointer",
                          isCopiedLink
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90"
                        )}
                      >
                        {isCopiedLink ? (
                          <>
                            <Check className="size-3.5 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>

                    <a
                      href={whatsAppShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-11 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <MessageCircle className="size-4.5" />
                      Enviar via WhatsApp para o médico
                    </a>
                  </div>
                )}

                {/* Status em tempo real do reconhecimento */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                  {doctorConnectedDetected || bankAccounts.length > 0 ? (
                    <>
                      <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                      <div className="text-xs">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Conta bancária conectada pelo Dr(a)!
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Avançando automaticamente para a emissão da primeira nota...
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative flex h-3.5 w-3.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          Aguardando Dr(a). conectar o banco...
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Reconhecimento automático em tempo real assim que o médico autorizar.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-full flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep3Mode("direct")}
                    className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Ou conectar diretamente neste dispositivo
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Caso 2: Modo Conectar Diretamente */
              <div className="flex flex-col items-center w-full mt-2">
                <Button
                  type="button"
                  onClick={openPluggyConnect}
                  disabled={isOpeningPluggy || isSyncingPluggy}
                  className="rounded-full h-11 px-9 text-sm font-semibold bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  {isOpeningPluggy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Abrindo Pluggy Connect...
                    </span>
                  ) : isSyncingPluggy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Sincronizando conta bancária...
                    </span>
                  ) : (
                    "Conectar Conta Bancária"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep3Mode("share_link")
                    if (!connectionLink && doctor?.id) generateLinkForDoctor(doctor.id)
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline underline-offset-2 mt-4 cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="size-3.5" />
                  É uma secretária remota? Gerar link para o médico conectar
                </button>
              </div>
            )}

            {/* Descrição e segurança da integração na parte inferior da página, após o botão */}
            <div className="max-w-md mx-auto px-4 mt-8 mb-4 text-center">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed mb-2.5">
                {currentStepData.description}
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal leading-relaxed">
                Integração oficial via Open Finance, homologada sob as diretrizes e padrões de segurança do Banco Central do Brasil.
                A Pluggy conecta seu banco com criptografia de ponta a ponta exclusivamente para leitura de extratos e identificação dos recebimentos.
                Suas credenciais bancárias e dados confidenciais jamais são armazenados ou compartilhados.
              </p>
            </div>

            {/* Contas Bancárias Conectadas (se houver) */}
            {bankAccounts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md mt-6 flex flex-col gap-2.5 text-left"
              >
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Contas Conectadas
                </span>
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                        <Landmark className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {acc.banco_nome || "Banco Conectado"}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Ag {acc.agencia || "—"} • Conta {acc.numero_conta || "—"}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      Ativa
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between mt-3 pt-2">
                  <button
                    type="button"
                    onClick={openPluggyConnect}
                    className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Conectar outra conta
                  </button>

                  <Button
                    type="button"
                    onClick={() => handleSelectStep(4)}
                    className="rounded-full h-9 px-5 text-xs font-semibold bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] cursor-pointer shadow-xs"
                  >
                    Próximo →
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* ETAPA 4: SUA PRIMEIRA NFS-E ESTÁ SENDO EMITIDA             */}
        {/* ========================================================== */}
        {activeStep === 4 && (
          <div className={cn("w-full flex flex-col items-center transition-all duration-300", flowStep === "invoice_emitted" ? "max-w-2xl" : "max-w-lg")}>
            {/* Mensagem de Erro se houver */}
            {step4Error && (
              <div className="mb-4 flex items-start gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs w-full text-left">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{step4Error}</span>
              </div>
            )}

            {/* Caso 1: Inicializando automaticamente ao entrar na etapa 4 */}
            {flowStep === "idle" && (
              <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-neutral-200/90 dark:border-neutral-800 shadow-xs flex flex-col items-center text-center">
                <Loader2 className="size-8 text-emerald-500 animate-spin mb-4" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  Iniciando validação e emissão em tempo real...
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
                  Conectando à sua conta bancária para identificar o PIX de R$ 0,01 e emitir sua primeira NFS-e.
                </p>
              </div>
            )}

            {/* Caso 2: Card da Animação estilo Ticker com as 4 etapas */}
            {flowStep !== "idle" && (
              <div className="w-full flex flex-col items-start">
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm overflow-hidden text-left"
                >
                  {/* Cabeçalho do Card */}
                  <div className="p-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/70">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {flowStep === "invoice_emitted" ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <Loader2 className="size-4.5 animate-spin" />
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {flowStep === "invoice_emitted"
                          ? "Sua primeira NFS-e está emitida!"
                          : flowStep === "generating_invoice"
                          ? "Emitindo sua nota"
                          : flowStep === "identifying_payment"
                          ? "Identificado pagamento"
                          : flowStep === "sending_pix"
                          ? `Enviando R$ 0,01 para sua conta (${step4SecondsLeft}s)`
                          : "Conta conectada"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsStep4CardExpanded(!isStep4CardExpanded)}
                        className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                        title={isStep4CardExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                      >
                        {isStep4CardExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Corpo do Card: Ticker de itens em perspectiva */}
                  {isStep4CardExpanded && (
                    <div
                      className="px-5 py-3.5 min-h-[115px] flex flex-col justify-end overflow-hidden"
                      style={{ perspective: 600 }}
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {step4DiscoveredItems.slice(-3).map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 16, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{
                              opacity: 0,
                              y: -18,
                              scale: 0.84,
                              filter: "blur(3px)",
                              transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] },
                            }}
                            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-2 py-1.5 text-xs origin-top"
                          >
                            <span className="text-neutral-400 dark:text-neutral-500 font-normal shrink-0">
                              {item.label}:
                            </span>
                            <span className="text-neutral-900 dark:text-neutral-100 font-semibold font-mono text-[11px] truncate">
                              {item.value}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Banner de Aguardando Pagamento com Botão de Rechecagem Manual */}
                  {isWaitingPayment && flowStep !== "invoice_emitted" && (
                    <div className="px-5 py-3.5 bg-amber-500/10 border-t border-amber-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300 flex-1">
                        <Loader2 className="size-4 shrink-0 animate-spin mt-0.5" />
                        <span className="text-[11px] leading-relaxed">
                          {waitingPaymentNotice || "Aguardando transferência de R$ 0,01 cair na conta bancária..."}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isRecheckingPayment}
                        onClick={handleManualRecheckPayment}
                        className="rounded-full text-xs font-semibold bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] cursor-pointer shrink-0 h-8 px-4"
                      >
                        {isRecheckingPayment ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="size-3 animate-spin" />
                            Checando...
                          </span>
                        ) : (
                          "Verificar Novamente"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Rodapé do Card com Barra de Progresso, contagem e status */}
                  <div className="px-5 py-3 bg-neutral-50/70 dark:bg-zinc-800/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs relative">
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {step4DiscoveredItems.length}
                      </span>
                      <span>de 4 etapas concluídas</span>
                    </div>

                    {flowStep !== "invoice_emitted" ? (
                      <span className="text-[11px] font-medium text-neutral-400 font-mono">
                        {flowStep === "sending_pix" ? `Aguardando PIX (${step4SecondsLeft}s)` : "Processando..."}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1.5">
                        <Check className="size-3 stroke-[2.5]" />
                        100% Concluído
                      </span>
                    )}

                    {/* Linha verde de progresso na base do card */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${step4Progress}%` }}
                        transition={{ ease: "linear", duration: 0.25 }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Texto pequeno e discreto entre o card e o PDF */}
                {flowStep === "invoice_emitted" && invoiceResult && (
                  <div className="w-full text-center my-3">
                    <button
                      type="button"
                      onClick={handleFinalizarOnboarding}
                      className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer select-none"
                    >
                      Abriremos o painel em {redirectCountdown} segundos
                    </button>
                  </div>
                )}

                {/* PDF PURO RENDERIZADO (CRU: sem container, sem linhas, sem raio, sem título, sem botões) */}
                {flowStep === "invoice_emitted" && invoiceResult && invoiceResult.caminhoDanfe && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    <iframe
                      src={`${invoiceResult.caminhoDanfe}#toolbar=0&navpanes=0`}
                      className="w-full h-[850px] border-0 outline-none rounded-none bg-white block"
                      title="NFS-e Emitida"
                    />
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
