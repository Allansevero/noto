export interface ParsedCsvPatient {
  id?: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  valor_consulta: number;
  data_consulta?: string;
  valido: boolean;
  erros: string[];
}

export interface CsvParseResult {
  patients: ParsedCsvPatient[];
  validCount: number;
  invalidCount: number;
  totalCount: number;
}

/**
 * Normaliza strings de texto removendo acentos e convertendo para minúsculas
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Limpa e valida CPF básico
 */
function cleanCpf(cpfRaw: string): string {
  const digits = cpfRaw.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return cpfRaw.trim();
}

/**
 * Converte strings monetárias variadas (R$ 250,00 / 250.50 / 250) em número Float
 */
function parseMoney(moneyRaw: string | number): number {
  if (typeof moneyRaw === "number") return moneyRaw;
  if (!moneyRaw) return 0;

  const cleaned = String(moneyRaw)
    .replace(/R\$/g, "")
    .replace(/\s+/g, "")
    .trim();

  // Se tiver vírgula como decimal (ex: 250,00 ou 1.250,50)
  if (cleaned.includes(",")) {
    const standardized = cleaned.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(standardized);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Processa o texto bruto de um arquivo CSV
 */
export function parsePatientsCsv(csvText: string): CsvParseResult {
  if (!csvText || !csvText.trim()) {
    return { patients: [], validCount: 0, invalidCount: 0, totalCount: 0 };
  }

  // Detecta quebra de linha
  const lines = csvText.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) {
    return { patients: [], validCount: 0, invalidCount: 0, totalCount: 0 };
  }

  // Detecta delimitador (, ou ; ou \t)
  const firstLine = lines[0];
  const countComma = (firstLine.match(/,/g) || []).length;
  const countSemicolon = (firstLine.match(/;/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  let delimiter = ",";
  if (countSemicolon > countComma && countSemicolon > countTab) {
    delimiter = ";";
  } else if (countTab > countComma && countTab > countSemicolon) {
    delimiter = "\t";
  }

  // Mapeia colunas do cabeçalho
  const rawHeaders = firstLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, "").trim());
  const headerMap: Record<string, number> = {};

  rawHeaders.forEach((h, index) => {
    const norm = normalizeHeader(h);
    if (norm.includes("nome") || norm.includes("paciente")) {
      headerMap["nome"] = index;
    } else if (norm.includes("cpf") || norm.includes("documento")) {
      headerMap["cpf"] = index;
    } else if (norm.includes("email") || norm.includes("mail")) {
      headerMap["email"] = index;
    } else if (norm.includes("telefone") || norm.includes("whatsapp") || norm.includes("fone") || norm.includes("celular")) {
      headerMap["telefone"] = index;
    } else if (norm.includes("valor") || norm.includes("preco") || norm.includes("consulta")) {
      headerMap["valor"] = index;
    } else if (norm.includes("data") || norm.includes("atendimento")) {
      headerMap["data"] = index;
    }
  });

  const parsedPatients: ParsedCsvPatient[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split respeitando aspas simples
    const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, "").trim());

    const nome = headerMap["nome"] !== undefined ? cols[headerMap["nome"]] || "" : cols[0] || "";
    const rawCpf = headerMap["cpf"] !== undefined ? cols[headerMap["cpf"]] || "" : cols[1] || "";
    const email = headerMap["email"] !== undefined ? cols[headerMap["email"]] || "" : cols[2] || "";
    const telefone = headerMap["telefone"] !== undefined ? cols[headerMap["telefone"]] || "" : cols[3] || "";
    const rawValor = headerMap["valor"] !== undefined ? cols[headerMap["valor"]] || "" : cols[4] || "0";
    const dataConsulta = headerMap["data"] !== undefined ? cols[headerMap["data"]] || "" : undefined;

    const cpf = cleanCpf(rawCpf);
    const valorConsulta = parseMoney(rawValor);
    const erros: string[] = [];

    if (!nome || nome.length < 2) {
      erros.push("Nome do paciente inválido");
    }
    if (!rawCpf || rawCpf.replace(/\D/g, "").length !== 11) {
      erros.push("CPF deve conter 11 dígitos");
    }

    parsedPatients.push({
      nome_completo: nome,
      cpf: cpf,
      email: email || `${nome.toLowerCase().replace(/[^a-z0-9]/g, "") || "paciente"}@email.com`,
      telefone: telefone || "(11) 99999-9999",
      valor_consulta: valorConsulta > 0 ? valorConsulta : 250.0,
      data_consulta: dataConsulta,
      valido: erros.length === 0,
      erros,
    });
  }

  const validCount = parsedPatients.filter((p) => p.valido).length;
  const invalidCount = parsedPatients.length - validCount;

  return {
    patients: parsedPatients,
    validCount,
    invalidCount,
    totalCount: parsedPatients.length,
  };
}

/**
 * Gera e dispara o download do arquivo modelo CSV para preenchimento
 */
export function downloadSampleCsv(): void {
  const csvContent =
    "nome_completo,cpf,email,telefone,valor_consulta,data_consulta\n" +
    "Maria Aparecida da Silva,123.456.789-00,maria.silva@exemplo.com,(11) 98765-4321,350.00,2026-09-01\n" +
    "João Pedro de Oliveira,987.654.321-11,joao.pedro@exemplo.com,(21) 99123-4567,280.00,2026-09-01\n" +
    "Ana Beatriz Mendes,456.789.123-44,ana.mendes@exemplo.com,(31) 97654-3210,400.00,2026-09-01\n";

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "modelo_importacao_pacientes_noto.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
