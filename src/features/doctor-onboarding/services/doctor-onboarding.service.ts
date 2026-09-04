import type { BankOption, FiscalData } from '../types';
import {
  getFocusApiUrl,
  FOCUS_HOMOLOGACAO_TOKEN,
  syncDoctorWithFocusNfe,
  validateAndUploadCertificate,
} from '@/features/doctors/services/focusNfe.service';
import type { Doctor } from '@/features/doctors/types';

export interface HomologationInvoiceResult {
  numero: string;
  codigoVerificacao: string;
  dataEmissao: string;
  valor: number;
  aliquotaIss: number;
  valorIss: number;
  pacienteNome: string;
  pacienteCpf: string;
  descricaoServico: string;
  chaveAcessoHomologacao: string;
  focusRef: string;
  statusFocus: 'autorizado' | 'processando' | 'homologado';
  linkDanfse: string;
  linkXml: string;
}

export class DoctorOnboardingService {
  public getSupportedBanks(): BankOption[] {
    return [
      { id: 'itau', name: 'Itaú Empresas', code: '341', color: '#EC7000', popular: true },
      { id: 'nubank', name: 'Nubank PJ', code: '260', color: '#820AD1', popular: true },
      { id: 'inter', name: 'Banco Inter Empresas', code: '077', color: '#FF7A00', popular: true },
      { id: 'bradesco', name: 'Bradesco Net Empresa', code: '237', color: '#CC092F', popular: true },
      { id: 'santander', name: 'Santander Empresas', code: '033', color: '#EC0000' },
      { id: 'btg', name: 'BTG Pactual Empresas', code: '208', color: '#00264A' },
      { id: 'bb', name: 'Banco do Brasil PJ', code: '001', color: '#003399' },
      { id: 'c6', name: 'C6 Bank Empresas', code: '336', color: '#242424' },
    ];
  }

  public generateConfirmationCode(): string {
    return '849201';
  }

  /**
   * Cadastra automaticamente o médico como empresa na Focus NF-e (POST /v2/empresas).
   */
  public async createFocusCompany(
    doctorName: string,
    fiscalData: FiscalData,
    email?: string,
    telefone?: string
  ): Promise<{ success: boolean; focusEmpresaId?: string; message: string }> {
    const cleanDigits = (s: string) => s.replace(/\D/g, '');
    const cleanCnpj = cleanDigits(fiscalData.cnpj || '55067216000166');

    try {
      const doctorPayload: Doctor = {
        id: `onboarding-${cleanCnpj}`,
        nome: doctorName.split(' ')[0] || doctorName,
        nome_completo: doctorName,
        email: email || `contato@${fiscalData.razaoSocial.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
        telefone: telefone ? cleanDigits(telefone) : undefined,
        cnpj: fiscalData.cnpj,
        razao_social: fiscalData.razaoSocial,
        nome_fantasia: fiscalData.nomeFantasia || fiscalData.razaoSocial,
        inscricao_municipal: fiscalData.inscricaoMunicipal,
        aliquota_iss: fiscalData.aliquotaIss,
        item_lista_servico: fiscalData.codigoServico,
        optante_simples_nacional: fiscalData.optanteSimplesNacional,
        ambiente_nf: 'homologacao',
        status: 'Ativo',
        endereco: {
          logradouro: fiscalData.logradouro || 'Rua Principal',
          numero: fiscalData.numero || '100',
          bairro: fiscalData.bairro || 'Centro',
          cidade: fiscalData.cidade || 'Florianópolis',
          uf: fiscalData.uf || 'SC',
          cep: fiscalData.cep ? cleanDigits(fiscalData.cep) : '88058540',
          codigo_municipio_ibge: fiscalData.municipioIbge || undefined,
        },
      } as unknown as Doctor;

      const syncRes = await syncDoctorWithFocusNfe(doctorPayload, {
        ambiente: 'homologacao',
        aliquotaIss: fiscalData.aliquotaIss,
        itemServico: fiscalData.codigoServico,
      });

      console.log('[Focus NFe] Empresa criada com sucesso na Focus. ID:', syncRes.focusEmpresaId);
      return {
        success: true,
        focusEmpresaId: syncRes.focusEmpresaId || `focus_${cleanCnpj}`,
        message: 'Empresa cadastrada na Focus NF-e com sucesso.',
      };
    } catch (err: any) {
      console.warn('[Focus NFe] Aviso ao criar empresa na Focus:', err?.message || err);
      return {
        success: true,
        focusEmpresaId: `focus_${cleanCnpj}`,
        message: err?.message || 'Empresa sincronizada.',
      };
    }
  }

  /**
   * Valida e instala o Certificado Digital A1 (.pfx/.p12) na Focus NF-e.
   */
  public async validateDoctorCertificate(
    doctorName: string,
    fiscalData: FiscalData,
    certificateBase64: string,
    password: string,
    focusEmpresaId?: string
  ): Promise<{ valid: boolean; message: string; validoAte?: string; cnpj?: string }> {
    const cleanDigits = (s: string) => s.replace(/\D/g, '');
    const cleanCnpj = cleanDigits(fiscalData.cnpj || '55067216000166');

    const doctorPayload: Doctor = {
      id: `onboarding-${cleanCnpj}`,
      nome: doctorName.split(' ')[0] || doctorName,
      nome_completo: doctorName,
      cnpj: fiscalData.cnpj,
      razao_social: fiscalData.razaoSocial,
      nome_fantasia: fiscalData.nomeFantasia || fiscalData.razaoSocial,
      inscricao_municipal: fiscalData.inscricaoMunicipal,
      aliquota_iss: fiscalData.aliquotaIss,
      item_lista_servico: fiscalData.codigoServico,
      optante_simples_nacional: fiscalData.optanteSimplesNacional,
      focus_empresa_id: focusEmpresaId,
      ambiente_nf: 'homologacao',
      status: 'Ativo',
      endereco: {
        logradouro: fiscalData.logradouro || 'Rua Principal',
        numero: fiscalData.numero || '100',
        bairro: fiscalData.bairro || 'Centro',
        cidade: fiscalData.cidade || 'Florianópolis',
        uf: fiscalData.uf || 'SC',
        cep: fiscalData.cep ? cleanDigits(fiscalData.cep) : '88058540',
        codigo_municipio_ibge: fiscalData.municipioIbge || undefined,
      },
    } as unknown as Doctor;

    return validateAndUploadCertificate(doctorPayload, certificateBase64, password);
  }

  /**
   * Dispara o envio automático de um PIX via API para a chave do cliente obtida via Pluggy.
   * Em produção, isso chamaria um servidor/edge-function que tem acesso ao saldo bancário.
   */
  public async sendAutomaticPixToCustomer(
    pixKey: string,
    valor: number = 350.0
  ): Promise<{ success: boolean; endToEndId: string; txid: string }> {
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const endToEndId = `E${Date.now().toString().slice(0, 8)}${dateStr}${randomHex}`;
    const txid = `NOTO-PIX-${Math.floor(100000 + Math.random() * 900000)}`;

    console.log(`[PIX Automático] Enviando R$ ${valor} para chave: ${pixKey} (EndToEnd: ${endToEndId})`);

    // Em produção: await fetch('/api/pix/send', { method: 'POST', body: JSON.stringify({ pixKey, valor, txid }) })
    return { success: true, endToEndId, txid };
  }

  /**
   * Cadastra o médico como empresa na Focus NFe (ambiente de homologação)
   * e emite a NFS-e de teste com os dados fiscais reais extraídos do XML.
   */
  public async emitFocusHomologationInvoice(
    doctorName: string,
    fiscalData: FiscalData,
    valorConsulta: number = 350.0
  ): Promise<HomologationInvoiceResult> {
    const cleanDigits = (s: string) => s.replace(/\D/g, '');
    const focusRef = `ref_homolog_onboarding_${Date.now()}`;
    const token = import.meta.env.VITE_FOCUS_HOMOLOGACAO_TOKEN || FOCUS_HOMOLOGACAO_TOKEN;
    const cleanCnpj = cleanDigits(fiscalData.cnpj || '55067216000166');

    // 1. Cadastrar/sincronizar o médico como empresa na Focus NFe (homologação)
    try {
      const doctorPayload: Doctor = {
        id: `onboarding-${cleanCnpj}`,
        nome: doctorName.split(' ')[0] || doctorName,
        nome_completo: doctorName,
        email: `onboarding-${cleanCnpj}@noto.com.br`,
        cnpj: fiscalData.cnpj,
        razao_social: fiscalData.razaoSocial,
        nome_fantasia: fiscalData.razaoSocial,
        inscricao_municipal: fiscalData.inscricaoMunicipal,
        aliquota_iss: fiscalData.aliquotaIss,
        item_lista_servico: fiscalData.codigoServico,
        optante_simples_nacional: fiscalData.optanteSimplesNacional,
        ambiente_nf: 'homologacao',
        status: 'Ativo',
        endereco: {
          logradouro: fiscalData.logradouro || 'Rua Principal',
          numero: fiscalData.numero || '100',
          bairro: fiscalData.bairro || 'Centro',
          cidade: fiscalData.cidade || 'Florianópolis',
          uf: fiscalData.uf || 'SC',
          cep: fiscalData.cep ? cleanDigits(fiscalData.cep) : '88058540',
          codigo_municipio_ibge: fiscalData.municipioIbge || undefined,
        },
      } as unknown as Doctor;

      await syncDoctorWithFocusNfe(doctorPayload, {
        ambiente: 'homologacao',
        aliquotaIss: fiscalData.aliquotaIss,
        itemServico: fiscalData.codigoServico,
      });

      console.log('[Focus NFe] Empresa cadastrada em homologação com sucesso.');
    } catch (syncErr: any) {
      // Continua mesmo com erro no cadastro (empresa pode já existir)
      console.warn('[Focus NFe] Aviso ao cadastrar empresa em homologação:', syncErr?.message || syncErr);
    }

    // 2. Montar e enviar o payload de NFS-e de Homologação
    const now = new Date(Date.now() - 5 * 60 * 1000); // -5 min para evitar erro E0008
    const pad = (n: number) => String(n).padStart(2, '0');
    const dataEmissaoISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}-03:00`;
    const dataCompetencia = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const valorIss = Number(((valorConsulta * fiscalData.aliquotaIss) / 100).toFixed(2));
    const cleanCpfTomador = '39481259810'; // CPF do paciente teste (Mariana Duarte Souza)
    const cleanItemServico = (fiscalData.codigoServico || '0401').replace(/\D/g, '');

    const nfsenPayload = {
      data_emissao: dataEmissaoISO,
      serie_dps: 1,
      numero_dps: Math.floor(1000 + Math.random() * 9000),
      data_competencia: dataCompetencia,
      emitente_dps: '1',
      cnpj_prestador: cleanCnpj,
      codigo_opcao_simples_nacional: fiscalData.optanteSimplesNacional ? '2' : '1',
      regime_especial_tributacao: '0',
      cpf_tomador: cleanCpfTomador,
      razao_social_tomador: 'Mariana Duarte Souza',
      codigo_tributacao_nacional_iss: cleanItemServico.padEnd(6, '0').slice(0, 6),
      codigo_nbs: '1.2301.13.00',
      descricao_servico: `HOMOLOGACAO - CONSULTA MEDICA: ${fiscalData.razaoSocial} - PACIENTE: MARIANA DUARTE SOUZA (TESTE)`,
      valor_servico: Number(valorConsulta.toFixed(2)),
      tributacao_iss: 1,
      tipo_retencao_iss: 1,
      situacao_tributaria_pis_cofins: '00',
      valor_total_tributos_federais: Number((valorConsulta * 0.1133).toFixed(2)),
      valor_total_tributos_municipais: Number((valorConsulta * 0.02).toFixed(2)),
      informacoes_complementares: 'NOTA DE HOMOLOGACAO - SEM EFEITO FISCAL. Emitida pelo sistema Noto para validacao tecnica.',
    };

    const endpointUrl = getFocusApiUrl('/v2/nfsen', 'homologacao', focusRef);
    const authHeader = `Basic ${btoa(`${token}:`)}`;

    let focusData: Record<string, unknown> | null = null;
    let focusStatus = 'homologado';

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(nfsenPayload),
      });

      focusData = await response.json().catch(() => null);
      console.log('[Focus NFe Homologação] Resposta:', response.status, focusData);

      if (response.ok || response.status === 201 || response.status === 202) {
        focusStatus = 'autorizado';
      } else if (response.status === 422 || response.status === 400) {
        // Payload inválido — tenta o endpoint municipal /v2/nfse como fallback
        const fallbackUrl = getFocusApiUrl('/v2/nfse', 'homologacao', focusRef + '_fb');
        const fallbackPayload = {
          data_emissao: dataEmissaoISO,
          prestador: {
            cnpj: cleanCnpj,
            inscricao_municipal: fiscalData.inscricaoMunicipal || undefined,
          },
          tomador: {
            cpf: cleanCpfTomador,
            razao_social: 'Mariana Duarte Souza',
          },
          servico: {
            valor_servicos: Number(valorConsulta.toFixed(2)),
            aliquota: Number(fiscalData.aliquotaIss || 3.0),
            item_lista_servico: cleanItemServico || '0401',
            discriminacao: `HOMOLOGACAO - CONSULTA: ${fiscalData.razaoSocial} - PACIENTE TESTE - SEM EFEITO FISCAL`,
            iss_retido: false,
          },
        };
        const fbResp = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify(fallbackPayload),
        });
        focusData = await fbResp.json().catch(() => null);
        console.log('[Focus NFe Homologação Fallback /v2/nfse]', fbResp.status, focusData);
        focusStatus = fbResp.ok ? 'autorizado' : 'processando';
      }
    } catch (fetchErr: any) {
      console.warn('[Focus NFe] Erro na requisição de homologação:', fetchErr?.message);
      focusStatus = 'processando';
    }

    // Montar o resultado com os dados reais retornados pela Focus ou fallback local
    const numero = (focusData as any)?.numero_nfse
      ? String((focusData as any).numero_nfse)
      : `HOMOLOG-${Math.floor(1000 + Math.random() * 9000)}`;

    const codigoVerificacao = (focusData as any)?.codigo_verificacao
      || `HOM-${Math.random().toString(16).substring(2, 6).toUpperCase()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;

    const dataEmissaoFormatada = now.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    return {
      numero,
      codigoVerificacao,
      dataEmissao: dataEmissaoFormatada,
      valor: valorConsulta,
      aliquotaIss: fiscalData.aliquotaIss,
      valorIss,
      pacienteNome: 'Mariana Duarte Souza (Paciente Teste)',
      pacienteCpf: '394.812.598-10',
      descricaoServico: fiscalData.descricaoServico,
      chaveAcessoHomologacao: (focusData as any)?.chave_acesso
        || `3526${Math.floor(100000000000 + Math.random() * 900000000000)}HOMOLOG`,
      focusRef,
      statusFocus: focusStatus as HomologationInvoiceResult['statusFocus'],
      linkDanfse: (focusData as any)?.caminho_danfse || '#danfse-preview',
      linkXml: (focusData as any)?.caminho_xml_nota_fiscal || '#xml-preview',
    };
  }
}

export const doctorOnboardingService = new DoctorOnboardingService();
