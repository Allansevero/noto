export interface CnpjResponseData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  codigo_municipio_ibge?: string;
  telefone?: string;
  email?: string;
  situacao_cadastral?: string;
  optante_simples_nacional?: boolean;
}

/**
 * Formata e normaliza o logradouro unindo o tipo (Rua, Av, etc) e o nome do logradouro
 */
function buildLogradouro(tipo?: string | null, nome?: string | null): string {
  const t = (tipo || "").trim();
  const n = (nome || "").trim();

  if (!t && !n) return "";
  if (!t) return n;
  if (!n) return t;

  // Se o nome já começa com o tipo (ex: "AVENIDA PAULISTA"), não duplica
  if (n.toUpperCase().startsWith(t.toUpperCase())) {
    return n;
  }

  return `${t} ${n}`;
}

/**
 * Normaliza o número (ex: "123", "S/N", etc)
 */
function buildNumero(num: unknown): string {
  if (num === null || num === undefined) return "";
  const str = String(num).trim();
  if (str === "0" || str.toUpperCase() === "SN" || str.toUpperCase() === "S/N") {
    return "S/N";
  }
  return str;
}

/**
 * Consulta dados públicos do CNPJ com múltiplos fallbacks (BrasilAPI -> MinhaReceita -> CNPJ.ws)
 */
export async function fetchCnpjData(rawCnpj: string): Promise<CnpjResponseData> {
  const digits = rawCnpj.replace(/\D/g, "");

  if (digits.length !== 14) {
    throw new Error("CNPJ deve conter 14 dígitos.");
  }

  // 1. Tenta BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (res.ok) {
      const data = await res.json();
      const logradouro = buildLogradouro(
        data.descricao_tipo_de_logradouro || data.tipo_logradouro,
        data.logradouro || data.logradouro_nome
      );
      const numero = buildNumero(data.numero ?? data.num);

      return {
        cnpj: data.cnpj || digits,
        razao_social: data.razao_social || "",
        nome_fantasia: data.nome_fantasia || data.razao_social || "",
        cep: data.cep ? String(data.cep).replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2") : "",
        logradouro: logradouro || data.logradouro || "",
        numero: numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        cidade: data.municipio || data.cidade || "",
        uf: data.uf || "",
        codigo_municipio_ibge: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : undefined,
        telefone: data.ddd_telefone_1 || data.telefone || data.ddd_telefone_2 || "",
        email: data.email || "",
        situacao_cadastral: data.descricao_situacao_cadastral || "",
        optante_simples_nacional: data.opcao_pelo_simples === true,
      };
    }
  } catch (e) {
    console.warn("BrasilAPI falhou, tentando fallback MinhaReceita...", e);
  }

  // 2. Fallback MinhaReceita
  try {
    const res = await fetch(`https://minhareceita.org/${digits}`);
    if (res.ok) {
      const data = await res.json();
      const logradouro = buildLogradouro(
        data.descricao_tipo_de_logradouro || data.tipo_logradouro,
        data.logradouro
      );
      const numero = buildNumero(data.numero);

      return {
        cnpj: data.cnpj || digits,
        razao_social: data.razao_social || "",
        nome_fantasia: data.nome_fantasia || data.razao_social || "",
        cep: data.cep ? String(data.cep).replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2") : "",
        logradouro: logradouro || data.logradouro || "",
        numero: numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        cidade: data.municipio || "",
        uf: data.uf || "",
        codigo_municipio_ibge: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : undefined,
        telefone: data.ddd_telefone_1 || data.telefone || "",
        email: data.email || "",
        situacao_cadastral: data.descricao_situacao_cadastral || "",
        optante_simples_nacional: data.opcao_pelo_simples === true,
      };
    }
  } catch (e) {
    console.warn("Fallback MinhaReceita falhou:", e);
  }

  // 3. Fallback CNPJ.ws (Público)
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`);
    if (res.ok) {
      const data = await res.json();
      const estab = data.estabelecimento || {};
      const logradouro = buildLogradouro(estab.tipo_logradouro, estab.logradouro);
      const numero = buildNumero(estab.numero);

      return {
        cnpj: estab.cnpj || digits,
        razao_social: data.razao_social || "",
        nome_fantasia: estab.nome_fantasia || data.razao_social || "",
        cep: estab.cep ? String(estab.cep).replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2") : "",
        logradouro: logradouro || estab.logradouro || "",
        numero: numero || "",
        complemento: estab.complemento || "",
        bairro: estab.bairro || "",
        cidade: estab.cidade?.nome || "",
        uf: estab.estado?.sigla || "",
        codigo_municipio_ibge: estab.cidade?.ibge_id ? String(estab.cidade.ibge_id) : undefined,
        telefone: estab.telefone1 || estab.ddd1 ? `(${estab.ddd1}) ${estab.telefone1}` : "",
        email: estab.email || "",
        situacao_cadastral: estab.situacao_cadastral || "",
        optante_simples_nacional: data.simples?.optante === "Sim",
      };
    }
  } catch (e) {
    console.error("Fallback CNPJ.ws falhou:", e);
  }

  throw new Error("Não foi possível consultar os dados do CNPJ. Verifique se o número está correto.");
}
