import type { ExtractedFiscalData } from "../types"

/**
 * Busca o primeiro nó descendente cujo localName corresponda ao nome especificado (ignora namespaces).
 */
function getElementByLocalName(parent: Element | Document, localName: string): Element | null {
  const elements = parent.getElementsByTagName("*")
  const target = localName.toLowerCase()
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if ((el.localName || el.nodeName).toLowerCase() === target) {
      return el
    }
  }
  return null
}

/**
 * Busca elemento seguindo um caminho hierárquico de tags (ex: ["emit", "enderNac", "xLgr"]).
 */
function getElementByPath(root: Element | Document, path: string[]): Element | null {
  let current: Element | Document = root
  for (const seg of path) {
    const el = getElementByLocalName(current, seg)
    if (!el) return null
    current = el
  }
  return current as Element
}

/**
 * Extrai o texto limpo de um nó pelo caminho informado.
 */
function getTextByPath(root: Element | Document, path: string[]): string | undefined {
  const el = getElementByPath(root, path)
  if (!el || !el.textContent) return undefined
  const val = el.textContent.trim()
  return val.length > 0 ? val : undefined
}

/**
 * Remove qualquer caractere não numérico.
 */
function sanitizeDigits(raw?: string): string | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/\D/g, "").trim()
  return cleaned.length > 0 ? cleaned : undefined
}

/**
 * Converte string para número decimal.
 */
function parseDecimal(raw?: string): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(",", ".").trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

/**
 * Converte string para inteiro.
 */
function parseIntSafe(raw?: string): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/\D/g, "").trim()
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? undefined : num
}

/**
 * Parser estrito para o padrão Sped NFSe Nacional (xmlns="http://www.sped.fazenda.gov.br/nfse").
 * Extrai exclusivamente os dados fixos do médico sem condicionais ou valores mocados.
 * Nunca extrai dados do tomador/paciente (toma).
 */
export function parseSpedNfseXml(xmlText: string): ExtractedFiscalData | null {
  if (!xmlText || !xmlText.trim()) {
    return null
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, "application/xml")

    const parseError = doc.getElementsByTagName("parsererror")[0]
    if (parseError) {
      console.warn("[nfseParser] XML malformado:", parseError.textContent)
      return null
    }

    // Raiz ou nós principais
    const emit = getElementByLocalName(doc, "emit")
    const dps = getElementByLocalName(doc, "DPS") || getElementByLocalName(doc, "infDPS") || doc
    const infNFSe = getElementByLocalName(doc, "infNFSe") || doc

    // 1. CNPJ do emitente/prestador (emit/CNPJ ou DPS/infDPS/prest/CNPJ)
    const cnpjEmit = emit ? getTextByPath(emit, ["CNPJ"]) : undefined
    const cnpjPrest = getTextByPath(dps, ["prest", "CNPJ"]) || getTextByPath(doc, ["prest", "CNPJ"])
    const rawCnpj = cnpjEmit || cnpjPrest
    const cnpj = sanitizeDigits(rawCnpj)

    // 2. Razão Social (emit/xNome)
    const razaoSocial = emit ? getTextByPath(emit, ["xNome"]) : getTextByPath(doc, ["emit", "xNome"])

    // 3. Endereço do Prestador (emit/enderNac/*)
    const logradouro = emit ? getTextByPath(emit, ["enderNac", "xLgr"]) : undefined
    const numero = emit ? getTextByPath(emit, ["enderNac", "nro"]) : undefined
    const complemento = emit ? getTextByPath(emit, ["enderNac", "xCpl"]) : undefined
    const bairro = emit ? getTextByPath(emit, ["enderNac", "xBairro"]) : undefined
    const codigoMunicipioIbge = emit ? sanitizeDigits(getTextByPath(emit, ["enderNac", "cMun"])) : undefined
    const uf = emit ? getTextByPath(emit, ["enderNac", "UF"])?.toUpperCase() : undefined
    const cep = emit ? sanitizeDigits(getTextByPath(emit, ["enderNac", "CEP"])) : undefined

    // 4. Contato (emit/fone, emit/email)
    const telefone = emit ? sanitizeDigits(getTextByPath(emit, ["fone"])) : undefined
    const email = emit ? getTextByPath(emit, ["email"]) : undefined

    // 5. Parâmetros tributários do médico (DPS/infDPS/prest/regTrib/*)
    const opcaoSimplesNacional =
      getTextByPath(dps, ["prest", "regTrib", "opSimpNac"]) ||
      getTextByPath(doc, ["regTrib", "opSimpNac"])
    const regimeEspecialTributacao =
      getTextByPath(dps, ["prest", "regTrib", "regEspTrib"]) ||
      getTextByPath(doc, ["regTrib", "regEspTrib"])

    // 6. Município de emissão (DPS/infDPS/cLocEmi)
    const codigoMunicipioEmissao =
      sanitizeDigits(getTextByPath(dps, ["cLocEmi"])) ||
      sanitizeDigits(getTextByPath(doc, ["cLocEmi"]))

    // 7. Serviço e Tributação Nacional (DPS/infDPS/serv/cServ/*)
    const codigoTributacaoNacional =
      getTextByPath(dps, ["serv", "cServ", "cTribNac"]) ||
      getTextByPath(doc, ["cServ", "cTribNac"])
    const codigoNbs =
      getTextByPath(dps, ["serv", "cServ", "cNBS"]) ||
      getTextByPath(doc, ["cServ", "cNBS"])

    // 8. Tributação ISSQN (DPS/infDPS/valores/trib/tribMun/*)
    const tributacaoIssqn =
      getTextByPath(dps, ["valores", "trib", "tribMun", "tribISSQN"]) ||
      getTextByPath(doc, ["tribMun", "tribISSQN"])
    const tipoRetencaoIssqn =
      getTextByPath(dps, ["valores", "trib", "tribMun", "tpRetISSQN"]) ||
      getTextByPath(doc, ["tribMun", "tpRetISSQN"])

    // 9. Alíquotas de Referência
    // infNFSe/valores/pAliqAplic
    const rawAliqIss =
      getTextByPath(infNFSe, ["valores", "pAliqAplic"]) ||
      getTextByPath(doc, ["valores", "pAliqAplic"])
    const aliquotaIssReferencia = parseDecimal(rawAliqIss)

    // DPS/infDPS/valores/trib/totTrib/pTotTrib/pTotTribFed
    const rawPctFed =
      getTextByPath(dps, ["valores", "trib", "totTrib", "pTotTrib", "pTotTribFed"]) ||
      getTextByPath(doc, ["pTotTribFed"])
    const pctTribFederalReferencia = parseDecimal(rawPctFed)

    // 10. Número da última nota (infNFSe/nNFSe)
    const rawNotaNum =
      getTextByPath(infNFSe, ["nNFSe"]) ||
      getTextByPath(doc, ["nNFSe"])
    const ultimaNotaNumero = parseIntSafe(rawNotaNum)

    // Se nenhum CNPJ ou Razão Social foi localizado, o XML não é uma NFS-e válida
    if (!cnpj && !razaoSocial) {
      return null
    }

    const result: ExtractedFiscalData = {
      cnpj,
      razao_social: razaoSocial,
      logradouro,
      numero,
      complemento,
      bairro,
      codigo_municipio_ibge: codigoMunicipioIbge,
      uf,
      cep,
      telefone,
      email,
      opcao_simples_nacional: opcaoSimplesNacional,
      regime_especial_tributacao: regimeEspecialTributacao,
      codigo_municipio_emissao: codigoMunicipioEmissao,
      codigo_tributacao_nacional: codigoTributacaoNacional,
      codigo_nbs: codigoNbs,
      tributacao_issqn: tributacaoIssqn,
      tipo_retencao_issqn: tipoRetencaoIssqn,
      aliquota_iss_referencia: aliquotaIssReferencia,
      pct_trib_federal_referencia: pctTribFederalReferencia,
      ultima_nota_numero: ultimaNotaNumero,
      ultimo_xml_processado_em: new Date().toISOString(),
    }

    return result
  } catch (err) {
    console.warn("[nfseParser] Erro ao analisar XML:", err)
    return null
  }
}
