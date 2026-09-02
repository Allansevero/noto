/**
 * Serviço Ultra Resiliente de Leitura e Extração de Dados Fiscais de XML de NFS-e
 * Suporta qualquer layout: ABRASF (v1/v2), Padrão Nacional SPED (DPS/NFS-e), IPM, Betha, Ginfes, WebISS, Procempa
 */

export interface ParsedNfseData {
  cnpj?: string;
  cpf?: string;
  inscricaoMunicipal?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  codigoMunicipioIbge?: string;
  cidade?: string;
  uf?: string;
  optanteSimplesNacional?: boolean;
  regimeTributario?: string;
  regimeEspecialTributacao?: string;
  itemListaServico?: string;
  codigoTributarioMunicipio?: string;
  aliquotaIss?: string;
  discriminacaoPadrao?: string;
  numeroNota?: string;
  dataEmissao?: string;
  tipoPadrao?: "SPED Nacional" | "ABRASF / Municipal" | "Padrão XML";
}

export function parseNfseXml(rawXml: string): ParsedNfseData {
  if (!rawXml || typeof rawXml !== "string") {
    throw new Error("Conteúdo XML vazio ou inválido.");
  }

  // Remove BOM e limpa espaços
  const xml = rawXml.replace(/^\uFEFF/, "").trim();

  // Função auxiliar com Regex para extrair conteúdo de qualquer tag (mesmo com namespaces tipo <ns2:tag>)
  const extractTag = (tagName: string): string => {
    const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${tagName}>`, "i");
    const match = xml.match(regex);
    if (!match || !match[1]) return "";
    return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
  };

  const getFirstTag = (...tags: string[]): string => {
    for (const tag of tags) {
      const val = extractTag(tag);
      if (val) return val;
    }
    return "";
  };

  const cleanDigits = (val?: string) => (val ? val.replace(/\D/g, "") : "");

  // 1. Extração de Identificação do Prestador (Prestador / Emitente / emit / prestador)
  let cnpj = cleanDigits(getFirstTag("cnpj_prestador", "CNPJ", "Cnpj", "cnpj", "CpfCnpj"));
  let cpf = cleanDigits(getFirstTag("cpf_prestador", "CPF", "Cpf", "cpf"));
  const im = getFirstTag("inscricao_municipal_prestador", "InscricaoMunicipal", "IM", "im", "inscricao_municipal");
  const razaoSocial = getFirstTag("razao_social_prestador", "xNome", "RazaoSocial", "NomeRazaoSocial", "nome");
  const nomeFantasia = getFirstTag("nome_fantasia", "xFant", "NomeFantasia", "fantasia");
  const email = getFirstTag("email_prestador", "email", "Email", "xEmail");
  const telefone = cleanDigits(getFirstTag("telefone_prestador", "fone", "Telefone", "telefone"));

  // 2. Extração de Endereço
  const cep = cleanDigits(getFirstTag("cep_prestador", "CEP", "Cep", "cep"));
  const logradouro = getFirstTag("logradouro_prestador", "xLgr", "Endereco", "Logradouro", "logradouro");
  const numero = getFirstTag("numero_prestador", "nro", "Numero", "numero");
  const complemento = getFirstTag("complemento_prestador", "xCpl", "Complemento", "complemento");
  const bairro = getFirstTag("bairro_prestador", "xBairro", "Bairro", "bairro");
  const rawCidade = getFirstTag("municipio", "xCidade", "xMun", "NomeMunicipio", "cidade");
  const cleanCidade = rawCidade
    ? rawCidade.replace(/\s*-\s*\d+$/, "").replace(/\s*\/\s*[A-Za-z]{2}$/, "").trim()
    : "Porto Alegre";
  const ufRaw = getFirstTag("uf", "UF", "xEstProvReg", "Uf");
  const uf = ufRaw ? ufRaw.slice(0, 2).toUpperCase() : "RS";
  const codigoMunicipio = cleanDigits(getFirstTag("codigo_municipio_prestador", "cLocEmi", "cMun", "CodigoMunicipio", "codigo_municipio"));

  // 3. Extração de Parâmetros Fiscais
  const opSimpNac = getFirstTag("codigo_opcao_simples_nacional", "opSimpNac", "OptanteSimplesNacional", "optante_simples_nacional");
  const isOptante = opSimpNac === "1" ? false : opSimpNac === "2" || opSimpNac === "3" || opSimpNac === "true" || opSimpNac === "SIM";
  const regimeTrib = opSimpNac === "1" ? "3" : opSimpNac === "2" ? "4" : opSimpNac === "3" ? "1" : "3";
  const regEspTrib = getFirstTag("regime_especial_tributacao", "regEspTrib", "RegimeEspecialTributacao");

  // 4. Extração de Serviço & Alíquota
  let itemServico = cleanDigits(getFirstTag("codigo_tributacao_nacional_iss", "cTribNac", "ItemListaServico", "item_lista_servico", "CodigoItemListaServico"));
  if (itemServico.length === 4) itemServico = `${itemServico}01`;
  if (!itemServico || itemServico.length < 4) itemServico = "040101";

  const codTribMun = getFirstTag("codigo_tributacao_municipal_iss", "cTribMun", "CodigoTributacaoMunicipio", "codigo_tributario_municipio");
  
  let aliquota = getFirstTag("aliquota", "pAliq", "Aliquota", "aliquota_iss");
  if (aliquota) {
    const num = parseFloat(aliquota.replace(",", "."));
    if (!isNaN(num)) {
      aliquota = (num < 1 && num > 0 ? num * 100 : num).toFixed(2);
    }
  } else {
    aliquota = "3.00";
  }

  const discriminacao = getFirstTag("descricao_servico", "xDescServ", "Discriminacao", "discriminacao");
  const numeroNota = getFirstTag("numero_dps", "nDPS", "Numero", "numero", "NumeroNfse", "nNF");
  const dataEmissao = getFirstTag("data_emissao", "dhEmi", "DataEmissao", "dCompet");

  const isSpedNacional = /<(\w+:)?DPS\b/i.test(xml) || /<(\w+:)?infDPS\b/i.test(xml) || /<(\w+:)?cTribNac\b/i.test(xml);

  return {
    cnpj: cnpj.length === 14 ? cnpj : undefined,
    cpf: cpf.length === 11 ? cpf : undefined,
    inscricaoMunicipal: im || undefined,
    razaoSocial: razaoSocial || undefined,
    nomeFantasia: nomeFantasia || undefined,
    email: email || undefined,
    telefone: telefone || undefined,
    cep: cep.length === 8 ? cep : undefined,
    logradouro: logradouro || undefined,
    numero: numero || undefined,
    complemento: complemento || undefined,
    bairro: bairro || undefined,
    codigoMunicipioIbge: codigoMunicipio || "4314902",
    cidade: cleanCidade,
    uf: uf,
    optanteSimplesNacional: isOptante,
    regimeTributario: regimeTrib,
    regimeEspecialTributacao: regEspTrib || "0",
    itemListaServico: itemServico,
    codigoTributarioMunicipio: codTribMun || undefined,
    aliquotaIss: aliquota,
    discriminacaoPadrao: discriminacao || undefined,
    numeroNota: numeroNota || undefined,
    dataEmissao: dataEmissao || undefined,
    tipoPadrao: isSpedNacional ? "SPED Nacional" : "ABRASF / Municipal",
  };
}
