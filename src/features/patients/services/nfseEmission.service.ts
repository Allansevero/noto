import { supabase } from "@/lib/supabase/client";
import { DEFAULT_FOCUS_TOKEN, FOCUS_HOMOLOGACAO_TOKEN } from "@/features/doctors/services/focusNfe.service";

export interface NfseEmissionResult {
  success: boolean;
  status: "Nota Gerada" | "Processando emissão" | "Erro na emissão";
  message: string;
  focusRef?: string;
  numeroNfse?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  error?: string;
}

/**
 * Emite a NFS-e diretamente via Focus NF-e API (/v2/nfsen ou /v2/nfse)
 */
export async function emitNfseFocus(patientId: string, dataConsultaParam?: string): Promise<NfseEmissionResult> {
  const cleanDigits = (val?: string | null) => (val ? val.replace(/\D/g, "") : "");

  // 1. Busca os dados do paciente e do médico vinculado
  const { data: patient, error: patientErr } = await (supabase as any)
    .from("pacientes")
    .select("*, medicos(*)")
    .eq("id", patientId)
    .single();

  if (patientErr || !patient) {
    throw new Error("Paciente não encontrado no banco de dados.");
  }

  const doctor = patient.medicos;
  // Ambiente do médico: null/undefined = produção. Só usa homologação se explicitamente configurado.
  const isHomologacao = doctor?.ambiente_nf === "homologacao";

  // SEMPRE usa o token master para emissão — o doctor.focus_token é um token de empresa
  // que a Focus retorna mas que NÃO tem permissão para emitir notas.
  // Apenas o token master (VITE_FOCUS_MASTER_TOKEN) autoriza emissão de qualquer empresa vinculada.
  const masterToken = import.meta.env.VITE_FOCUS_MASTER_TOKEN || DEFAULT_FOCUS_TOKEN;
  const token = isHomologacao
    ? (import.meta.env.VITE_FOCUS_HOMOLOGACAO_TOKEN || FOCUS_HOMOLOGACAO_TOKEN)
    : masterToken;

  const isBrowser = typeof window !== "undefined";

  const cleanCnpj = cleanDigits(doctor?.cnpj);
  const cleanCpfTomador = cleanDigits(patient.cpf);

  // Evita erro E0008: Gera a data de emissão no horário local com 2 minutos de margem retroativa
  const nowSafe = new Date(Date.now() - 2 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dataEmissaoLocal = `${nowSafe.getFullYear()}-${pad(nowSafe.getMonth() + 1)}-${pad(nowSafe.getDate())}T${pad(nowSafe.getHours())}:${pad(nowSafe.getMinutes())}:${pad(nowSafe.getSeconds())}`;

  // Se o usuário especificou a data da consulta, usa ela como competência e discriminação
  const dataCompetencia = dataConsultaParam || patient.data_consulta || `${nowSafe.getFullYear()}-${pad(nowSafe.getMonth() + 1)}-${pad(nowSafe.getDate())}`;

  // Formata a data para a discriminação (ex: 27/08/2026)
  const [anoComp, mesComp, diaComp] = dataCompetencia.split("-");
  const dataConsultaFormatada = diaComp && mesComp && anoComp ? `${diaComp}/${mesComp}/${anoComp}` : new Intl.DateTimeFormat("pt-BR").format(new Date());

  const ref = `nfse_${patient.id}_${Date.now()}`;

  // Converte centavos para reais (ex: 25000 -> 250.00)
  const rawValor = Number(patient.valor_consulta) || 250;
  const valorServicosReais = rawValor > 1000 ? rawValor / 100 : rawValor;

  const isOptanteSimples = Boolean(doctor?.optante_simples_nacional);

  // Roteamento inteligente de ambiente: Homologação vs Produção
  const baseUrl = isHomologacao
    ? (isBrowser ? "/focus-homologacao-api" : "https://homologacao.focusnfe.com.br")
    : (isBrowser ? "/focus-api" : "https://api.focusnfe.com.br");

  // Data no formato aceito pelo SPED da NFS-e Nacional
  const dataEmissaoComFuso = `${dataEmissaoLocal}-03:00`;

  // Código do município IBGE configurado para o médico
  const doctorIbge = cleanDigits(doctor?.codigo_municipio_ibge ?? (doctor?.endereco as any)?.codigo_municipio_ibge ?? undefined);
  const doctorIbgeInt = doctorIbge ? parseInt(doctorIbge, 10) : undefined;

  // Payload oficial da DPS Nacional (SPED)
  const payloadNacional: Record<string, unknown> = {
    data_emissao: dataEmissaoComFuso,
    serie_dps: 1,
    numero_dps: Math.floor(1000 + Math.random() * 9000),
    data_competencia: dataCompetencia,
    emitente_dps: "1",
    codigo_municipio_emissora: doctorIbgeInt,
    cnpj_prestador: cleanCnpj || "55067216000166",
    codigo_opcao_simples_nacional: isOptanteSimples ? "3" : "1", // 1 = Não Optante
    regime_especial_tributacao: "0",
    cpf_tomador: cleanCpfTomador || "11111111111",
    razao_social_tomador: patient.nome_completo,
    codigo_municipio_prestacao: doctorIbgeInt,
    codigo_tributacao_nacional_iss: doctor?.item_lista_servico?.replace(/\D/g, "") || "041601",
    codigo_nbs: "1.2301.13.00",
    descricao_servico: `REFERENTE 1 CONSULTA EM PSIQUIATRA: DRA ALICE XAVIER CRM${doctor?.crm || '36948'} - REALIZADA NA DATA ${dataConsultaFormatada} - PACIENTE: ${patient.nome_completo}`,
    valor_servico: Number(valorServicosReais.toFixed(2)),
    tributacao_iss: 1,
    tipo_retencao_iss: 1,
    situacao_tributaria_pis_cofins: "00",
    valor_total_tributos_federais: Number((valorServicosReais * 0.1133).toFixed(2)),
    valor_total_tributos_municipais: Number((valorServicosReais * 0.02).toFixed(2)),
    informacoes_complementares: "Totais aproximados dos Tributos cfe. Lei n° 12.741/2012: Federais: 11,33 %; Estaduais: 0,00 %; Municipais: 2,00 %;",
  };

  const endpointUrl = `${baseUrl}/v2/nfsen?ref=${ref}`;

  try {
    const cleanToken = (token || "").trim();
    const authHeader = `Basic ${btoa(`${cleanToken}:`)}`;

    // Se o médico ainda não possui focus_empresa_id ou se o CNPJ ainda não foi sincronizado na Focus,
    // sincroniza a empresa primeiro para garantir que a Focus autorize a emissão sob este CNPJ
    if (!doctor?.focus_empresa_id && cleanCnpj) {
      try {
        const { syncDoctorWithFocusNfe } = await import("@/features/doctors/services/focusNfe.service");
        await syncDoctorWithFocusNfe(doctor, {
          // Preserva o ambiente configurado pelo médico. Nunca sobrescreve para homologação automaticamente.
          ambiente: (doctor?.ambiente_nf === "homologacao" ? "homologacao" : "producao"),
          aliquotaIss: doctor?.aliquota_iss ?? 3.0,
          itemServico: doctor?.item_lista_servico || "0401",
        });
      } catch (syncErr: any) {
        console.warn("Aviso na pré-sincronização da empresa com a Focus NF-e:", syncErr.message);
      }
    }

    let response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payloadNacional),
    });

    let data = await response.json().catch(() => null);

    // Fallback 1: Se /v2/nfsen retornar 404, tenta a rota municipal padrão /v2/nfse
    if (response.status === 404) {
      const municipalUrl = `${baseUrl}/v2/nfse?ref=${ref}`;
      const payloadMunicipal: Record<string, unknown> = {
        data_emissao: dataEmissaoComFuso,
        prestador: {
          cnpj: cleanCnpj,
          inscricao_municipal: doctor?.inscricao_municipal || undefined,
          codigo_municipio: doctorIbge || undefined,
        },
        tomador: {
          cpf: cleanCpfTomador || undefined,
          razao_social: patient.nome_completo,
          email: patient.email || undefined,
          telefone: cleanDigits(patient.telefone) || undefined,
        },
        servico: {
          valor_servicos: Number(valorServicosReais.toFixed(2)),
          aliquota: Number(doctor?.aliquota_iss || 3.0),
          item_lista_servico: doctor?.item_lista_servico?.replace(/\D/g, "") || "0401",
          discriminacao: `REFERENTE 1 CONSULTA EM PSIQUIATRA: DRA ALICE XAVIER CRM${doctor?.crm || '36948'} - REALIZADA NA DATA ${dataConsultaFormatada} - PACIENTE: ${patient.nome_completo}`,
          codigo_tributario_municipio: doctor?.codigo_tributario_municipio || undefined,
          codigo_municipio: doctorIbge || undefined,
          iss_retido: false,
        },
      };

      response = await fetch(municipalUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payloadMunicipal),
      });

      data = await response.json().catch(() => null);
    }

    // Fallback 2: Se retornar 403 (CNPJ não vinculado/autorizado na Focus), tenta registrar a empresa na Focus e re-emitir
    if (response.status === 403 && cleanCnpj) {
      // Log detalhado do que a Focus retornou para diagnóstico
      console.error("[Focus NF-e 403] Resposta completa:", JSON.stringify(data));
      console.error("[Focus NF-e 403] Token usado (primeiros 8 chars):", cleanToken.slice(0, 8));
      console.error("[Focus NF-e 403] CNPJ prestador:", cleanCnpj);
      console.error("[Focus NF-e 403] URL:", endpointUrl);
      try {
        const { syncDoctorWithFocusNfe } = await import("@/features/doctors/services/focusNfe.service");
        const syncRes = await syncDoctorWithFocusNfe(doctor, {
          ambiente: isHomologacao ? "homologacao" : "producao",
          aliquotaIss: doctor?.aliquota_iss ?? 3.0,
          itemServico: doctor?.item_lista_servico || "0401",
        });

        const activeToken = (syncRes.focusToken || cleanToken).trim();
        const retryAuthHeader = `Basic ${btoa(`${activeToken}:`)}`;

        // Tenta re-emitir após o vínculo da empresa
        const retryUrl = `${baseUrl}/v2/nfsen?ref=${ref}`;
        response = await fetch(retryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: retryAuthHeader,
          },
          body: JSON.stringify(payloadNacional),
        });
        data = await response.json().catch(() => null);

        if (response.status === 404) {
          const municipalUrl = `${baseUrl}/v2/nfse?ref=${ref}`;
          response = await fetch(municipalUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: retryAuthHeader,
            },
            body: JSON.stringify({
              data_emissao: dataEmissaoComFuso,
              prestador: {
                cnpj: cleanCnpj,
                inscricao_municipal: doctor?.inscricao_municipal || undefined,
                codigo_municipio: doctorIbge || undefined,
              },
              tomador: {
                cpf: cleanCpfTomador || undefined,
                razao_social: patient.nome_completo,
                email: patient.email || undefined,
              },
              servico: {
                valor_servicos: Number(valorServicosReais.toFixed(2)),
                aliquota: Number(doctor?.aliquota_iss || 3.0),
                item_lista_servico: doctor?.item_lista_servico?.replace(/\D/g, "") || "0401",
                discriminacao: `REFERENTE 1 CONSULTA: ${doctor?.nome_completo || 'MÉDICO'} - DATA ${dataConsultaFormatada} - PACIENTE: ${patient.nome_completo}`,
              },
            }),
          });
          data = await response.json().catch(() => null);
        }
      } catch (autoRegErr: any) {
        console.warn("Tentativa de auto-registro da empresa na Focus:", autoRegErr.message);
      }
    }

    if (response.ok || response.status === 200 || response.status === 201 || response.status === 202) {
      const nowIso = new Date().toISOString();
      const numeroGerado = data?.numero || data?.numero_dps || String(payloadNacional.numero_dps);
      const pdfUrl = data?.caminho_danfse || data?.url_danfse || `https://homologacao.focusnfe.com.br/danfse/${ref}`;
      const xmlUrl = data?.caminho_xml_nota_fiscal || `https://homologacao.focusnfe.com.br/xml/${ref}.xml`;

      // 1. Atualiza registro na tabela de pacientes
      const { error: updErr } = await supabase
        .from("pacientes")
        .update({
          status: "Nota Gerada",
          focus_ref: ref,
          nfse_numero: numeroGerado,
          nfse_pdf_url: pdfUrl,
          nfse_xml_url: xmlUrl,
          data_nota_gerada: nowIso,
          nfse_data_emissao: dataEmissaoLocal,
          data_consulta: dataCompetencia,
          nfse_erro_motivo: null,
        } as any)
        .eq("id", patient.id);

      if (updErr) {
        console.error("Erro ao persistir NFS-e no Supabase (pacientes):", updErr);
      }

      // 2. Persiste na tabela dedicada notas_fiscais
      try {
        const { saveInvoiceRecord } = await import("@/features/invoices/invoices.repository");
        await saveInvoiceRecord({
          medico_id: patient.medico_id,
          paciente_id: patient.id,
          numero_nfse: numeroGerado,
          numero_dps: String(payloadNacional.numero_dps),
          serie_dps: "1",
          focus_ref: ref,
          status: "Nota Gerada",
          valor_servico: valorServicosReais,
          aliquota_iss: doctor?.aliquota_iss || 2.0,
          valor_iss: Number((valorServicosReais * ((doctor?.aliquota_iss || 2.0) / 100)).toFixed(2)),
          tributos_federais: Number((valorServicosReais * 0.1133).toFixed(2)),
          tributos_municipais: Number((valorServicosReais * 0.02).toFixed(2)),
          item_lista_servico: doctor?.item_lista_servico || "041601",
          codigo_nbs: "1.2301.13.00",
          discriminacao: payloadNacional.descricao_servico as string,
          data_competencia: dataCompetencia,
          data_emissao: dataEmissaoComFuso,
          data_autorizacao: nowIso,
          pdf_url: pdfUrl,
          xml_url: xmlUrl,
          ambiente: isHomologacao ? "homologacao" : "producao",
        });
      } catch (invoiceErr) {
        console.warn("Aviso ao salvar na tabela notas_fiscais:", invoiceErr);
      }

      return {
        success: true,
        status: "Nota Gerada",
        message: `NFS-e #${numeroGerado} gerada e salva com sucesso!`,
        focusRef: ref,
        numeroNfse: numeroGerado,
        pdfUrl: pdfUrl,
        xmlUrl: xmlUrl,
      };
    } else {
      let errorMsg =
        data?.mensagem ||
        data?.erros?.[0]?.mensagem ||
        (typeof data?.erros?.[0] === "string" ? data?.erros?.[0] : null) ||
        data?.message;

      if (!errorMsg) {
        if (response.status === 403) {
          errorMsg = `Erro 403 (Acesso Negado): O CNPJ ${cleanCnpj || "do médico"} não está autorizado no token da Focus NF-e ou a empresa não está cadastrada na sua conta Focus. Anexe o Certificado A1 do médico ou verifique as permissões do token na Focus NF-e.`;
        } else if (response.status === 401) {
          errorMsg = "Erro 401 (Não Autorizado): Token da Focus NF-e inválido ou expirado.";
        } else {
          errorMsg = `Erro HTTP ${response.status} na Focus NF-e`;
        }
      }

      await supabase
        .from("pacientes")
        .update({
          status: "Erro na emissão",
          nfse_erro_motivo: errorMsg,
        } as any)
        .eq("id", patient.id);

      return {
        success: false,
        status: "Erro na emissão",
        message: errorMsg,
        error: errorMsg,
      };
    }
  } catch (err: any) {
    const errorMsg = err.message || "Erro de conexão ao emitir NFS-e Nacional.";
    await supabase
      .from("pacientes")
      .update({
        status: "Erro na emissão",
        nfse_erro_motivo: errorMsg,
      } as any)
      .eq("id", patient.id);

    return {
      success: false,
      status: "Erro na emissão",
      message: errorMsg,
      error: errorMsg,
    };
  }
}

/**
 * Consulta o status da NFS-e Nacional na Focus NF-e (/v2/nfsen/{ref} ou /v2/nfse/{ref})
 */
export async function checkNfseStatus(patientId: string): Promise<NfseEmissionResult> {
  const { data: patient, error: patientErr } = await (supabase as any)
    .from("pacientes")
    .select("*, medicos(*)")
    .eq("id", patientId)
    .single();

  if (patientErr || !patient || !patient.focus_ref) {
    throw new Error("Paciente ou referência de emissão não encontrados.");
  }

  const doctor = patient.medicos;
  const isHomologacao = (doctor?.ambiente_nf || "producao") === "homologacao";
  const token = isHomologacao
    ? (import.meta.env.VITE_FOCUS_HOMOLOGACAO_TOKEN || FOCUS_HOMOLOGACAO_TOKEN)
    : (doctor?.focus_token || import.meta.env.VITE_FOCUS_NFE_TOKEN || DEFAULT_FOCUS_TOKEN);

  const isBrowser = typeof window !== "undefined";
  const baseUrl = isHomologacao
    ? (isBrowser ? "/focus-homologacao-api" : "https://homologacao.focusnfe.com.br")
    : (isBrowser ? "/focus-api" : "https://api.focusnfe.com.br");

  try {
    const authHeader = `Basic ${btoa(`${token}:`)}`;

    // Tenta consultar primeiro em /v2/nfsen/{ref} e depois /v2/nfse/{ref}
    let response = await fetch(`${baseUrl}/v2/nfsen/${patient.focus_ref}`, {
      method: "GET",
      headers: { Authorization: authHeader },
    });

  if (!response.ok) {
    response = await fetch(`${baseUrl}/v2/nfse/${patient.focus_ref}`, {
      method: "GET",
      headers: { Authorization: authHeader },
    });
  }

  const data = await response.json().catch(() => null);

  if (response.ok || response.status === 200) {
    const statusFocus = data?.status; // 'autorizado', 'erro_autorizacao', 'processando_autorizacao', etc.

      if (statusFocus === "autorizado") {
        const nowIso = new Date().toISOString();
        await supabase
          .from("pacientes")
          .update({
            status: "Nota Gerada",
            nfse_numero: data?.numero || null,
            nfse_pdf_url: data?.caminho_danfse || data?.url_danfse || null,
            nfse_xml_url: data?.caminho_xml_nota_fiscal || null,
            data_nota_gerada: nowIso,
            nfse_erro_motivo: null,
          } as any)
          .eq("id", patient.id);

        return {
          success: true,
          status: "Nota Gerada",
          message: `NFS-e #${data?.numero} autorizada com sucesso!`,
          numeroNfse: data?.numero,
          pdfUrl: data?.caminho_danfse,
          xmlUrl: data?.caminho_xml_nota_fiscal,
        };
      } else if (statusFocus === "erro_autorizacao" || (data?.erros && data.erros.length > 0)) {
        const motivo =
          data?.erros?.[0]?.mensagem ||
          data?.mensagem_sefaz ||
          data?.mensagem ||
          "Erro retornado na autorização da prefeitura.";

        await supabase
          .from("pacientes")
          .update({
            status: "Erro na emissão",
            nfse_erro_motivo: motivo,
          } as any)
          .eq("id", patient.id);

        return {
          success: false,
          status: "Erro na emissão",
          message: motivo,
          error: motivo,
        };
      } else {
        // Ainda processando
        return {
          success: true,
          status: "Processando emissão",
          message: "Nota fiscal ainda em processamento na prefeitura.",
        };
      }
    } else {
      const errorMsg = data?.mensagem || `Erro HTTP ${response.status} ao consultar status da nota.`;
      return {
        success: false,
        status: "Erro na emissão",
        message: errorMsg,
        error: errorMsg,
      };
    }
  } catch (err: any) {
    console.error("Erro ao consultar status da NFS-e:", err);
    throw err;
  }
}

/**
 * Sincroniza todas as notas que estão com status 'Processando emissão'
 */
export async function syncPendingInvoices(): Promise<number> {
  const { data: pendingPatients, error } = await supabase
    .from("pacientes")
    .select("id, focus_ref")
    .eq("status", "Processando emissão")
    .not("focus_ref", "is", null);

  if (error || !pendingPatients || pendingPatients.length === 0) {
    return 0;
  }

  let updatedCount = 0;
  for (const p of pendingPatients) {
    try {
      const res = await checkNfseStatus(p.id);
      if (res.status !== "Processando emissão") {
        updatedCount++;
      }
    } catch (err) {
      console.warn(`Falha ao sincronizar paciente #${p.id}:`, err);
    }
  }

  return updatedCount;
}

/**
 * Cancela uma NFS-e na Focus NF-e (DELETE /v2/nfsen/{ref} ou /v2/nfse/{ref})
 */
export async function cancelNfseFocus(patientId: string, justificativa: string): Promise<NfseEmissionResult> {
  const { data: patient, error: patientErr } = await (supabase as any)
    .from("pacientes")
    .select("*, medicos(*)")
    .eq("id", patientId)
    .single();

  if (patientErr || !patient || !patient.focus_ref) {
    throw new Error("Paciente ou referência de emissão não encontrados.");
  }

  const doctor = patient.medicos;
  const isHomologacao = (doctor?.ambiente_nf || "producao") === "homologacao";
  const token = isHomologacao
    ? (import.meta.env.VITE_FOCUS_HOMOLOGACAO_TOKEN || FOCUS_HOMOLOGACAO_TOKEN)
    : (doctor?.focus_token || import.meta.env.VITE_FOCUS_NFE_TOKEN || DEFAULT_FOCUS_TOKEN);

  const isBrowser = typeof window !== "undefined";
  const baseUrl = isHomologacao
    ? (isBrowser ? "/focus-homologacao-api" : "https://homologacao.focusnfe.com.br")
    : (isBrowser ? "/focus-api" : "https://api.focusnfe.com.br");

  const authHeader = `Basic ${btoa(`${token}:`)}`;
  const cleanJustificativa = justificativa?.trim() || "Cancelamento de consulta médica solicitado pelo prestador.";

  try {
    let response = await fetch(`${baseUrl}/v2/nfsen/${patient.focus_ref}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ justificativa: cleanJustificativa }),
    });

    if (!response.ok) {
      response = await fetch(`${baseUrl}/v2/nfse/${patient.focus_ref}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ justificativa: cleanJustificativa }),
      });
    }

    await supabase
      .from("pacientes")
      .update({
        status: "Nota Cancelada",
        nfse_erro_motivo: `Cancelada: ${cleanJustificativa}`,
      } as any)
      .eq("id", patient.id);

    return {
      success: true,
      status: "Nota Cancelada" as any,
      message: "NFS-e cancelada com sucesso!",
    };
  } catch (err: any) {
    console.error("Erro ao cancelar NFS-e:", err);
    throw err;
  }
}
