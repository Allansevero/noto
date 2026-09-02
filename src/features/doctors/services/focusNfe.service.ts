import { supabase } from "@/lib/supabase/client";
import type { Doctor } from "../types";

export const FOCUS_MASTER_TOKEN = import.meta.env.VITE_FOCUS_MASTER_TOKEN || import.meta.env.VITE_FOCUS_NFE_TOKEN || "";
export const FOCUS_HOMOLOGACAO_TOKEN = import.meta.env.VITE_FOCUS_HOMOLOGACAO_TOKEN || FOCUS_MASTER_TOKEN;
export const DEFAULT_FOCUS_TOKEN = FOCUS_MASTER_TOKEN;

export interface SyncFocusParams {
  ambiente?: "homologacao" | "producao";
  aliquotaIss?: number;
  itemServico?: string;
  focusMasterToken?: string;
  regimeTributario?: 1 | 2 | 3 | 4;
  arquivoCertificadoBase64?: string;
  senhaCertificado?: string;
}

export interface SyncFocusResponse {
  success: boolean;
  message: string;
  focusEmpresaId?: string;
  focusToken?: string;
  certificadoValidoAte?: string;
  certificadoCnpj?: string;
  error?: string;
  details?: any;
}

export interface CertificateValidationResult {
  valid: boolean;
  message: string;
  validoAte?: string;
  validoDe?: string;
  cnpj?: string;
  error?: string;
}

/**
 * Valida e instala o Certificado Digital A1 (.pfx/.p12) na Focus NF-e via PUT /v2/empresas/{id} (ou POST se não existir)
 */
export async function validateAndUploadCertificate(
  doctor: Doctor,
  certificateBase64: string,
  password: string,
  tokenOverride?: string
): Promise<CertificateValidationResult> {
  const cleanDigits = (str?: string) => (str ? str.replace(/\D/g, "") : "");
  const token = tokenOverride?.trim() || import.meta.env.VITE_FOCUS_MASTER_TOKEN || FOCUS_MASTER_TOKEN;

  const isBrowser = typeof window !== "undefined";
  const cnpjDigits = cleanDigits(doctor.cnpj);
  const cpfDigits = cleanDigits(doctor.cpf);
  const numParsed = parseInt(doctor.endereco?.numero || "100", 10) || 100;
  const cepDigits = cleanDigits(doctor.endereco?.cep);
  const cepParsed = cepDigits ? parseInt(cepDigits, 10) : 80010000;

  const rawCidade = doctor.endereco?.cidade || "Porto Alegre";
  const cleanCidade = rawCidade.replace(/\s*-\s*\d+$/, "").replace(/\s*\/\s*[A-Za-z]{2}$/, "").trim() || "Porto Alegre";
  const cleanUf = (doctor.endereco?.uf || "RS").toUpperCase().slice(0, 2);

  // Monta a requisição com o schema EmpresaCreate da OpenAPI oficial
  const payload: Record<string, unknown> = {
    nome: doctor.razao_social || doctor.nome_completo,
    nome_fantasia: doctor.nome_fantasia || doctor.razao_social || doctor.nome_completo,
    bairro: doctor.endereco?.bairro || "Centro",
    cep: isNaN(cepParsed) ? 80010000 : cepParsed,
    discrimina_impostos: Boolean(doctor.optante_simples_nacional),
    email: doctor.email || `${(doctor.nome || "medico").toLowerCase().replace(/\s+/g, '')}@clinica.com`,
    enviar_email_destinatario: true,
    habilita_nfse: true,
    habilita_nfe: false,
    habilita_nfce: false,
    mostrar_danfse_badge: true,
    logradouro: doctor.endereco?.logradouro || "Rua Principal",
    numero: numParsed,
    municipio: cleanCidade,
    codigo_municipio: cleanDigits(doctor.codigo_municipio_ibge ?? undefined) || (cleanCidade.toLowerCase().includes("porto alegre") ? "4314902" : undefined),
    uf: cleanUf,
    regime_tributario: doctor.optante_simples_nacional ? 1 : 3,
    telefone: cleanDigits(doctor.telefone) || "51999999999",
    arquivo_certificado_base64: certificateBase64,
    senha_certificado: password,
    certificado_especifico: true,
  };

  if (cnpjDigits && cnpjDigits.length === 14) {
    payload.cnpj = cnpjDigits;
  } else if (cpfDigits && cpfDigits.length === 11) {
    payload.cpf = cpfDigits;
  }

  // Verifica se a empresa já possui ID na Focus NF-e para usar PUT /v2/empresas/{id}
  const hasFocusId = doctor.focus_empresa_id && !doctor.focus_empresa_id.startsWith("focus_");
  const endpointPath = hasFocusId
    ? `/v2/empresas/${doctor.focus_empresa_id}`
    : "/v2/empresas";
  const httpMethod = hasFocusId ? "PUT" : "POST";

  const endpointUrl = isBrowser
    ? `/focus-api${endpointPath}`
    : `https://api.focusnfe.com.br${endpointPath}`;

  try {
    const authHeader = `Basic ${btoa(`${token}:`)}`;

    let response = await fetch(endpointUrl, {
      method: httpMethod,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    // Fallback para POST caso PUT retorne 404
    if (response.status === 404 && httpMethod === "PUT") {
      const fallbackUrl = isBrowser ? "/focus-api/v2/empresas" : "https://api.focusnfe.com.br/v2/empresas";
      response = await fetch(fallbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await response.json().catch(() => null);

    if (response.ok || response.status === 200 || response.status === 201) {
      const validoAte = data?.certificado_valido_ate;
      const cnpjCert = data?.certificado_cnpj;

      // Salva no banco de dados que o certificado está configurado e válido
      await supabase
        .from("medicos")
        .update({
          focus_empresa_id: data?.id ? String(data.id) : doctor.focus_empresa_id,
          focus_token: data?.token_producao || data?.token_homologacao || data?.token || token,
        } as any)
        .eq("id", doctor.id);

      return {
        valid: true,
        message: "Certificado Digital A1 validado e instalado com sucesso na Focus NF-e!",
        validoAte: validoAte ? new Date(validoAte).toLocaleDateString("pt-BR") : undefined,
        cnpj: cnpjCert || cnpjDigits,
      };
    } else if (response.status === 422) {
      if (Array.isArray(data?.erros) && data.erros.length > 0) {
        const certErr = data.erros.find((e: any) => e.campo === "arquivo_certificado_base64" || e.campo === "senha_certificado");
        const msg = certErr ? certErr.mensagem : data.erros.map((e: any) => e.mensagem).join(", ");
        return {
          valid: false,
          message: msg || "Erro de validação do certificado digital.",
          error: msg,
        };
      }
      return {
        valid: false,
        message: data?.mensagem || "Senha incorreta ou formato de certificado inválido.",
        error: data?.mensagem,
      };
    } else {
      return {
        valid: false,
        message: data?.mensagem || `Erro ao validar na Focus NF-e (${response.status})`,
        error: data?.mensagem,
      };
    }
  } catch (err: any) {
    console.error("Erro na validação do certificado:", err);
    return {
      valid: false,
      message: err.message || "Não foi possível conectar com o servidor da Focus NF-e.",
      error: err.message,
    };
  }
}

/**
 * Atualiza ou cria a empresa/médico na Focus NF-e utilizando PUT /v2/empresas/{id} (ou POST)
 */
export async function syncDoctorWithFocusNfe(
  doctor: Doctor,
  params?: SyncFocusParams
): Promise<SyncFocusResponse> {
  const cleanDigits = (str?: string) => (str ? str.replace(/\D/g, "") : "");

  // isHomologacao: kept for future use when endpoint differs per environment
  void ((params?.ambiente || doctor.ambiente_nf || "homologacao") === "homologacao");
  const isBrowser = typeof window !== "undefined";

  const token =
    params?.focusMasterToken?.trim() ||
    import.meta.env.VITE_FOCUS_MASTER_TOKEN ||
    FOCUS_MASTER_TOKEN;

  const cnpjDigits = cleanDigits(doctor.cnpj);
  const cpfDigits = cleanDigits(doctor.cpf);
  const telefoneDigits = cleanDigits(doctor.telefone);
  const cepDigits = cleanDigits(doctor.endereco?.cep);
  const numParsed = parseInt(doctor.endereco?.numero || "100", 10) || 100;
  const cepParsed = cepDigits ? parseInt(cepDigits, 10) : 80010000;

  const isOptanteSimples = (params?.regimeTributario ?? (doctor.optante_simples_nacional ? 1 : 3)) !== 3;

  const rawCidade = doctor.endereco?.cidade || "Porto Alegre";
  const cleanCidade = rawCidade.replace(/\s*-\s*\d+$/, "").replace(/\s*\/\s*[A-Za-z]{2}$/, "").trim() || "Porto Alegre";
  const cleanUf = (doctor.endereco?.uf || "RS").toUpperCase().slice(0, 2);

  // Monta o payload conforme a documentação oficial da Focus NF-e (EmpresaCreate)
  const payload: Record<string, unknown> = {
    nome: doctor.razao_social || doctor.nome_completo,
    nome_fantasia: doctor.nome_fantasia || doctor.razao_social || doctor.nome_completo,
    bairro: doctor.endereco?.bairro || "Centro",
    cep: isNaN(cepParsed) ? 80010000 : cepParsed,
    complemento: doctor.endereco?.complemento || undefined,
    discrimina_impostos: isOptanteSimples,
    email: doctor.email || `${(doctor.nome || "medico").toLowerCase().replace(/\s+/g, '')}@clinica.com`,
    enviar_email_destinatario: true,
    habilita_nfse: true,
    habilita_nfe: false,
    habilita_nfce: false,
    mostrar_danfse_badge: true,
    logradouro: doctor.endereco?.logradouro || "Rua Principal",
    numero: numParsed,
    municipio: cleanCidade,
    codigo_municipio: cleanDigits(doctor.codigo_municipio_ibge ?? undefined) || (cleanCidade.toLowerCase().includes("porto alegre") ? "4314902" : undefined),
    uf: cleanUf,
    regime_tributario: params?.regimeTributario ?? (doctor.optante_simples_nacional ? 1 : 3),
    telefone: telefoneDigits || "51999999999",
  };

  if (params?.arquivoCertificadoBase64) {
    payload.arquivo_certificado_base64 = params.arquivoCertificadoBase64;
    payload.senha_certificado = params.senhaCertificado || "";
    payload.certificado_especifico = true;
  }

  if (cnpjDigits && cnpjDigits.length === 14) {
    payload.cnpj = cnpjDigits;
  } else if (cpfDigits && cpfDigits.length === 11) {
    payload.cpf = cpfDigits;
  }

  if (doctor.inscricao_municipal) {
    const imClean = cleanDigits(doctor.inscricao_municipal);
    payload.inscricao_municipal = imClean ? parseInt(imClean, 10) || doctor.inscricao_municipal : doctor.inscricao_municipal;
  }

  // Verifica se utiliza PUT /v2/empresas/{id} para atualizar ou POST para criar
  const hasFocusId = doctor.focus_empresa_id && !doctor.focus_empresa_id.startsWith("focus_");
  const endpointPath = hasFocusId
    ? `/v2/empresas/${doctor.focus_empresa_id}`
    : "/v2/empresas";
  const httpMethod = hasFocusId ? "PUT" : "POST";

  const endpointUrl = isBrowser
    ? `/focus-api${endpointPath}`
    : `https://api.focusnfe.com.br${endpointPath}`;

  let focusEmpresaId = doctor.focus_empresa_id;
  let focusToken = doctor.focus_token || token;
  let serverMessage = "";
  let certValidoAte: string | undefined = undefined;
  let certCnpj: string | undefined = undefined;

  // 1. Faz a requisição PUT ou POST na API da Focus NF-e
  try {
    const authHeader = `Basic ${btoa(`${token}:`)}`;
    let response = await fetch(endpointUrl, {
      method: httpMethod,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    // Se PUT retornar 404, tenta POST
    if (response.status === 404 && httpMethod === "PUT") {
      const fallbackUrl = isBrowser ? "/focus-api/v2/empresas" : "https://api.focusnfe.com.br/v2/empresas";
      response = await fetch(fallbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await response.json().catch(() => null);

    if (response.ok || response.status === 200 || response.status === 201) {
      focusEmpresaId = data?.id ? String(data.id) : (focusEmpresaId || `focus_${cnpjDigits || cpfDigits}`);
      focusToken = data?.token_producao || data?.token_homologacao || data?.token || token;
      certValidoAte = data?.certificado_valido_ate;
      certCnpj = data?.certificado_cnpj;
      serverMessage = `Dados fiscais atualizados com sucesso na Focus NF-e (ID #${focusEmpresaId})!`;
    } else if (response.status === 422) {
      if (data?.codigo === "empresa_ja_cadastrada") {
        focusEmpresaId = data?.id ? String(data.id) : (focusEmpresaId || `focus_${cnpjDigits || cpfDigits}`);
        focusToken = token;
        serverMessage = `Empresa vinculada com sucesso (ID #${focusEmpresaId}).`;
      } else if (Array.isArray(data?.erros) && data.erros.length > 0) {
        const errList = data.erros.map((e: any) => `${e.campo || ''}: ${e.mensagem}`).join(", ");
        throw new Error(`Validação Focus NF-e: ${errList || data.mensagem}`);
      } else {
        throw new Error(data?.mensagem || "Dados inválidos segundo a Focus NF-e.");
      }
    } else if (response.status === 401) {
      throw new Error("HTTP Basic: Acesso negado. Verifique o token da Focus NF-e.");
    } else {
      throw new Error(data?.mensagem || `Erro Focus NF-e (${response.status})`);
    }
  } catch (err: any) {
    console.error("[Focus NFe Sync Error]", err);
    throw err;
  }

  // 2. Persiste os dados fiscais e os identificadores na tabela 'medicos'
  const updatePayload: Record<string, unknown> = {
    focus_empresa_id: focusEmpresaId,
    focus_token: focusToken,
    ambiente_nf: params?.ambiente || "producao",
    aliquota_iss: params?.aliquotaIss ?? (doctor.aliquota_iss || 3.0),
    item_lista_servico: params?.itemServico || (doctor.item_lista_servico || "0401"),
    optante_simples_nacional: (params?.regimeTributario ?? 1) === 1,
  };

  const { error: dbErr } = await supabase
    .from("medicos")
    .update(updatePayload as any)
    .eq("id", doctor.id);

  if (dbErr) {
    console.error("Erro ao salvar dados fiscais no banco:", dbErr);
    throw new Error(dbErr.message || "Erro ao persistir os dados fiscais no banco.");
  }

  return {
    success: true,
    message: serverMessage || `Dr(a). ${doctor.nome_completo} atualizado com sucesso na Focus NF-e!`,
    focusEmpresaId,
    focusToken,
    certificadoValidoAte: certValidoAte,
    certificadoCnpj: certCnpj,
  };
}
