import jsPDF from "jspdf"
import type { NotaFiscal } from "../types"
import type { DoctorProfile } from "@/features/auth/types"

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val)
}

function formatDateBr(dateStr?: string): string {
  if (!dateStr) return "-"
  const parts = dateStr.split("-")
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

/**
 * Constrói a instância do jsPDF contendo o Documento Auxiliar
 * da NFS-e Nacional (DANFSE) formatado segundo o padrão nacional.
 */
export function buildNotaFiscalPdfDoc(nota: NotaFiscal, doctor?: DoctorProfile | null): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = 210
  const margin = 14
  const contentWidth = pageWidth - margin * 2 // 182mm

  // Cores
  const darkColor: [number, number, number] = [17, 24, 39] // gray-900
  const grayColor: [number, number, number] = [107, 114, 128] // gray-500
  const lightBg: [number, number, number] = [243, 244, 246] // gray-100
  const borderCol: [number, number, number] = [209, 213, 219] // gray-300
  const brandGreen: [number, number, number] = [0, 98, 57] // brand dark green

  let y = margin

  // 1. CABEÇALHO DO DOCUMENTO FISCAL
  doc.setDrawColor(...borderCol)
  doc.setLineWidth(0.4)
  doc.setFillColor(...lightBg)
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...darkColor)
  doc.text("SISTEMA NACIONAL DA NOTA FISCAL DE SERVIÇO ELETRÔNICA", margin + 6, y + 7)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...grayColor)
  doc.text("DANFSE - Documento Auxiliar da NFS-e Nacional", margin + 6, y + 13)

  // Status de Ambiente (Homologação ou Produção)
  if (nota.ambiente === "homologacao") {
    doc.setTextColor(180, 83, 9)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL", margin + 6, y + 19)
  } else {
    doc.setTextColor(...brandGreen)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text("AMBIENTE DE PRODUÇÃO - DOCUMENTO FISCAL OFICIAL", margin + 6, y + 19)
  }

  // Caixa Número da Nota
  const numBoxWidth = 50
  const numBoxX = margin + contentWidth - numBoxWidth
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(numBoxX, y + 2, numBoxWidth - 2, 20, 1.5, 1.5, "FD")

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...grayColor)
  doc.text("NÚMERO DA NOTA", numBoxX + 4, y + 7)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...darkColor)
  doc.text(nota.numero_nfse || nota.numero_rps, numBoxX + 4, y + 13)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...grayColor)
  doc.text(`RPS: #${nota.numero_rps} | Emissão: ${formatDateBr(nota.data_emissao)}`, numBoxX + 4, y + 18)

  y += 28

  // 2. DADOS DO PRESTADOR DE SERVIÇOS (MÉDICO)
  doc.setDrawColor(...borderCol)
  doc.setFillColor(...lightBg)
  doc.rect(margin, y, contentWidth, 6, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...darkColor)
  doc.text("PRESTADOR DE SERVIÇOS", margin + 3, y + 4.2)

  y += 6
  doc.rect(margin, y, contentWidth, 22)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(doctor?.nome_completo || "Dr. Médico - NotoMed", margin + 3, y + 5.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.text(`CNPJ / CPF: ${doctor?.cnpj || "33.841.732/0001-63"}`, margin + 3, y + 10.5)
  doc.text(`E-mail: ${doctor?.email || "contato@notomed.com.br"}`, margin + 3, y + 15)
  doc.text(`Clínica / Estabelecimento: ${nota.clinica_nome && nota.clinica_nome !== "-" ? nota.clinica_nome : "Consultório Particular"}`, margin + 3, y + 19.5)

  y += 26

  // 3. DADOS DO TOMADOR DE SERVIÇOS (PACIENTE)
  doc.setFillColor(...lightBg)
  doc.rect(margin, y, contentWidth, 6, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...darkColor)
  doc.text("TOMADOR DE SERVIÇOS (PACIENTE)", margin + 3, y + 4.2)

  y += 6
  doc.rect(margin, y, contentWidth, 18)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(nota.tomador_nome || "Paciente Avulso", margin + 3, y + 5.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.text(`CPF / Documento: ${nota.tomador_cpf || "Não informado"}`, margin + 3, y + 10.5)
  doc.text("País: Brasil", margin + 3, y + 15)

  y += 22

  // 4. DISCRIMINAÇÃO DOS SERVIÇOS
  doc.setFillColor(...lightBg)
  doc.rect(margin, y, contentWidth, 6, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...darkColor)
  doc.text("DISCRIMINAÇÃO DOS SERVIÇOS MÉDICOS", margin + 3, y + 4.2)

  y += 6
  const descHeight = 36
  doc.rect(margin, y, contentWidth, descHeight)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...darkColor)
  
  const descLinhas = [
    "04.01 - Consulta médica presencial especializada, anamnese e conduta clínica.",
    `Data da Competência: ${formatDateBr(nota.data_competencia)}`,
    `Origem de Execução: ${nota.executada_por === "open_finance" ? "Faturamento Automático via Noto Sync (Pluggy)" : "Emissão Manual Direta"}`,
    `Status de Transmissão: ${nota.status === "cancelada" ? "CANCELADA" : "AUTORIZADA PELA RECEITA MUNICIPAL"}`,
  ]

  let descY = y + 6
  for (const linha of descLinhas) {
    doc.text(linha, margin + 3, descY)
    descY += 6
  }

  y += descHeight + 4

  // 5. QUADRO DE VALORES E TRIBUTAÇÃO
  doc.setFillColor(...lightBg)
  doc.rect(margin, y, contentWidth, 6, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...darkColor)
  doc.text("CÁLCULO DO IMPOSTO E VALORES TOTAIS", margin + 3, y + 4.2)

  y += 6
  const boxW = contentWidth / 4

  // 4 Colunas
  doc.rect(margin, y, boxW, 16)
  doc.rect(margin + boxW, y, boxW, 16)
  doc.rect(margin + boxW * 2, y, boxW, 16)
  doc.rect(margin + boxW * 3, y, boxW, 16)

  // Col 1
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...grayColor)
  doc.text("VALOR TOTAL DOS SERVIÇOS", margin + 2, y + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...darkColor)
  doc.text(formatCurrency(nota.valor_servico), margin + 2, y + 11)

  // Col 2
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...grayColor)
  doc.text("ALÍQUOTA ISSQN", margin + boxW + 2, y + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...darkColor)
  doc.text("2,00%", margin + boxW + 2, y + 11)

  // Col 3
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...grayColor)
  doc.text("VALOR DO ISS", margin + boxW * 2 + 2, y + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...darkColor)
  doc.text(formatCurrency(nota.valor_servico * 0.02), margin + boxW * 2 + 2, y + 11)

  // Col 4 (Valor Líquido)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...brandGreen)
  doc.text("VALOR LÍQUIDO", margin + boxW * 3 + 2, y + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...brandGreen)
  doc.text(formatCurrency(nota.valor_servico), margin + boxW * 3 + 2, y + 11)

  y += 22

  // 6. INFORMAÇÕES ADICIONAIS / CHAVE DE ACESSO
  doc.setFillColor(...lightBg)
  doc.rect(margin, y, contentWidth, 6, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(...darkColor)
  doc.text("INFORMAÇÕES COMPLEMENTARES E CHAVE DE AUTENTICIDADE", margin + 3, y + 4.2)

  y += 6
  doc.rect(margin, y, contentWidth, 22)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...grayColor)
  doc.text("Chave de Acesso da NFS-e Nacional / Código Verificador:", margin + 3, y + 5.5)

  doc.setFont("courier", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...darkColor)
  const chave = nota.codigo_verificacao || `NFSE-${nota.id.substring(0, 16).toUpperCase()}`
  doc.text(chave, margin + 3, y + 11)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(...grayColor)
  doc.text(
    "Documento emitido eletronicamente pela plataforma NotoMed em conformidade com o padrão nacional NFS-e.",
    margin + 3,
    y + 17
  )

  // Se a nota estiver cancelada, estampar carimbo de CANCELADA em diagonal
  if (nota.status === "cancelada") {
    doc.setTextColor(220, 38, 38)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(36)
    doc.saveGraphicsState()
    doc.setGState(new (doc as any).GState({ opacity: 0.25 }))
    doc.text("CANCELADA", pageWidth / 2 - 40, 140, { angle: 45 })
    doc.restoreGraphicsState()
  }
  return doc
}

export function getNotaFiscalPdfFilename(nota: NotaFiscal): string {
  const numNotaLimpo = (nota.numero_nfse || nota.numero_rps || "00000").replace(/\D/g, "")
  const nomePacienteLimpo = (nota.tomador_nome || "paciente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 20)

  return `NFSe_${numNotaLimpo}_${nomePacienteLimpo}.pdf`
}

/**
 * Dispara o download nativo do arquivo PDF no navegador.
 */
export function downloadNotaFiscalPdf(nota: NotaFiscal, doctor?: DoctorProfile | null): void {
  const doc = buildNotaFiscalPdfDoc(nota, doctor)
  const filename = getNotaFiscalPdfFilename(nota)
  doc.save(filename)
}

/**
 * Retorna o PDF como Blob (útil para upload para o Supabase Storage no browser).
 */
export function generateNotaFiscalPdfBlob(nota: NotaFiscal, doctor?: DoctorProfile | null): Blob {
  const doc = buildNotaFiscalPdfDoc(nota, doctor)
  return doc.output("blob")
}

/**
 * Retorna o PDF como ArrayBuffer.
 */
export function generateNotaFiscalPdfArrayBuffer(nota: NotaFiscal, doctor?: DoctorProfile | null): ArrayBuffer {
  const doc = buildNotaFiscalPdfDoc(nota, doctor)
  return doc.output("arraybuffer")
}
