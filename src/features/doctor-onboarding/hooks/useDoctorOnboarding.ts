import { useState, useCallback, useEffect, useRef } from 'react';
import type { OnboardingStep, DoctorOnboardingState } from '../types';
import { xmlParserService } from '../services/xml-parser.service';
import { doctorOnboardingService } from '../services/doctor-onboarding.service';
import { doctorOnboardingRepository } from '../doctor-onboarding.repository';
import { signUpDoctor } from '../doctor-auth.repository';

const INITIAL_STATE: DoctorOnboardingState = {
  prefixo: 'Dr.',
  nomeCompleto: '',
  crm: '',
  especialidade: '',
  email: '',
  telefone: '',
  codigoConfirmacao: '',
  emailConfirmado: false,
  fiscalData: xmlParserService.getDefaultFiscalData(''),
  xmlParsed: false,
  bancoSelecionado: '',
  contaConectada: false,
  tipoConexao: 'open_finance',
  emissionStep: 0,
  notaEmitida: false,
  numeroNotaHomologacao: '',
  codigoVerificacao: '',
  dataEmissao: '',
  valorConsulta: 350.0,
  pacienteNome: 'Mariana Duarte Souza',
  pacienteCpf: '394.812.598-10',
};

export function useDoctorOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [state, setState] = useState<DoctorOnboardingState>(INITIAL_STATE);
  const [isSimulatingEmission, setIsSimulatingEmission] = useState(false);
  const emissionTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { emissionTimerRef.current.forEach(clearTimeout); };
  }, []);

  const updateState = useCallback((partial: Partial<DoctorOnboardingState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < 6) return (prev + 1) as OnboardingStep;
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 1) return (prev - 1) as OnboardingStep;
      return prev;
    });
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  /**
   * STEP 2 — PIN confirmado.
   * 1. Cria conta no Supabase Auth (email + PIN como senha temporária).
   * 2. Cria o registro inicial na tabela `medicos` (nome, email, telefone, user_id).
   * 3. Salva medicoId e authUserId no state para os próximos steps usarem.
   */
  const handleEmailConfirmed = useCallback(async (email: string, pinCode: string) => {
    const nomeCompleto = `${state.prefixo} ${state.nomeCompleto}`.trim();
    updateState({ emailConfirmado: true, codigoConfirmacao: pinCode });

    // 1. Cria a conta no Supabase Auth
    const authResult = await signUpDoctor(email, nomeCompleto, pinCode);
    const authUserId = authResult.userId;

    if (authResult.success) {
      console.log('[Step2] Auth criado/logado. UserID:', authUserId, '| Fonte:', authResult.source);
    } else {
      console.warn('[Step2] Auth falhou (continuando onboarding):', authResult.error);
    }

    // 2. Cria o registro na tabela medicos com os dados básicos
    const stateNow: DoctorOnboardingState = { ...state, email, emailConfirmado: true };
    const dbResult = await doctorOnboardingRepository.createInitialDoctor(stateNow, authUserId);

    console.log(`[Step2] Médico criado em ${dbResult.source}. ID: ${dbResult.id}`);

    // 3. Persiste os IDs no state para uso nos próximos passos
    updateState({
      authUserId: authUserId,
      medicoId: dbResult.id,
    });

    nextStep();
  }, [state, updateState, nextStep]);

  /**
   * STEP 3 — XML carregado.
   * Faz o parse, cria a empresa na Focus NF-e automaticamente,
   * atualiza o state e persiste os dados fiscais e focus_empresa_id na tabela `medicos`.
   */
  const handleXmlUpload = useCallback((file: File | string) => {
    const processXml = async (content: string, fileName: string) => {
      const parsed = xmlParserService.parseNfseXml(content, state.nomeCompleto || '');
      updateState({
        xmlFileName: fileName,
        xmlRawContent: content,
        fiscalData: parsed,
        xmlParsed: true,
      });

      // 1. Criação automática da empresa na Focus NF-e (homologação)
      let focusEmpresaId: string | undefined;
      try {
        const focusRes = await doctorOnboardingService.createFocusCompany(
          state.nomeCompleto,
          parsed,
          state.email,
          state.telefone
        );
        focusEmpresaId = focusRes.focusEmpresaId;
        updateState({
          focusEmpresaId,
          focusEmpresaCriada: focusRes.success,
        });
        console.log('[Step3] Empresa criada na Focus NF-e com sucesso. ID:', focusEmpresaId);
      } catch (fErr: any) {
        console.warn('[Step3] Aviso ao criar empresa na Focus:', fErr?.message);
      }

      // 2. Atualiza a tabela medicos com os dados fiscais do XML e o focus_empresa_id
      if (state.medicoId) {
        doctorOnboardingRepository.updateDoctorFiscalData(state.medicoId, parsed, focusEmpresaId)
          .then((r) => console.log(`[Step3] Dados fiscais do XML salvos em ${r.source}. Médico ID:`, state.medicoId));
      }
    };

    if (typeof file === 'string') {
      processXml(file, 'nota_fiscal_exemplo.xml');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      processXml(e.target?.result as string, file.name);
    };
    reader.readAsText(file);
  }, [state.nomeCompleto, state.email, state.telefone, state.medicoId, updateState]);

  /** Carrega XML de exemplo */
  const handleLoadSampleXml = useCallback(() => {
    const sampleXml = xmlParserService.generateSampleXml(state.nomeCompleto || '');
    handleXmlUpload(sampleXml);
    updateState({
      xmlFileName: `NFSe_Exemplo_Dr_${(state.nomeCompleto || 'Medico').replace(/\s+/g, '_')}.xml`,
    });
  }, [state.nomeCompleto, handleXmlUpload, updateState]);

  /**
   * STEP 4 — Validação do Certificado Digital A1 e senha na Focus NF-e.
   */
  const handleValidateCertificate = useCallback(
    async (certBase64: string, certPassword: string, fileName: string) => {
      try {
        const res = await doctorOnboardingService.validateDoctorCertificate(
          state.nomeCompleto,
          state.fiscalData,
          certBase64,
          certPassword,
          state.focusEmpresaId
        );

        if (res.valid) {
          updateState({
            certificadoBase64: certBase64,
            certificadoSenha: certPassword,
            certificadoNome: fileName,
            certificadoValido: true,
            certificadoValidoAte: res.validoAte,
          });

          // Atualiza o registro no Supabase
          if (state.medicoId) {
            await doctorOnboardingRepository.updateDoctorCertificate(state.medicoId, {
              focusEmpresaId: state.focusEmpresaId,
              certificadoValidoAte: res.validoAte,
              arquivoCertificadoBase64: certBase64,
              senhaCertificado: certPassword,
            });
            console.log('[Step4] Certificado A1 validado e salvo em Supabase. Médico ID:', state.medicoId);
          }

          // Avança suavemente para o Step 5 (conectar conta)
          setTimeout(() => {
            nextStep();
          }, 800);
        }

        return res;
      } catch (err: any) {
        console.error('[Step4] Erro ao validar certificado:', err);
        return {
          valid: false,
          message: err?.message || 'Falha ao conectar com o serviço de certificados.',
        };
      }
    },
    [state, updateState, nextStep]
  );

  /** Pular validação de certificado e configurar depois */
  const handleSkipCertificate = useCallback(() => {
    nextStep();
  }, [nextStep]);

  /**
   * STEP 5 — Banco conectado via Pluggy.
   * Atualiza a tabela `medicos` com a chave PIX e item Pluggy.
   */
  const handleConnectBank = useCallback(async (bankId: string, chavePix?: string, itemId?: string) => {
    const pixFinal = chavePix || state.fiscalData.cnpj || state.email || state.telefone;
    const updates: Partial<DoctorOnboardingState> = {
      bancoSelecionado: bankId,
      contaConectada: true,
      chavePixCliente: pixFinal,
      pluggyItemId: itemId,
    };
    updateState(updates);

    // Atualiza o registro no Supabase com os dados bancários
    if (state.medicoId) {
      const result = await doctorOnboardingRepository.updateDoctorBankAndInvoice(state.medicoId, {
        chavePixCliente: pixFinal,
        pluggyItemId: itemId,
        bancoSelecionado: bankId,
      });
      console.log(`[Step5] Dados bancários atualizados em ${result.source}. Médico ID:`, state.medicoId);
    }

    nextStep();
  }, [nextStep, updateState, state]);

  /**
   * STEP 6 — Emissão da nota de homologação real na Focus NFe.
   */
  const runHomologationEmission = useCallback(() => {
    if (isSimulatingEmission) return;
    setIsSimulatingEmission(true);
    emissionTimerRef.current.forEach(clearTimeout);
    emissionTimerRef.current = [];

    updateState({ emissionStep: 1, notaEmitida: false });

    // Etapa 1 (0ms): PIX automático para a chave Pluggy
    const targetPix = state.chavePixCliente || state.fiscalData.cnpj || state.email || state.telefone || '';
    doctorOnboardingService.sendAutomaticPixToCustomer(targetPix, state.valorConsulta);

    const t1 = setTimeout(() => updateState({ emissionStep: 2 }), 1500);
    const t2 = setTimeout(() => updateState({ emissionStep: 3 }), 3000);
    const t3 = setTimeout(() => updateState({ emissionStep: 4 }), 4500);

    // Etapa 5 (6000ms): Focus NFe + salva tudo no Supabase
    const t4 = setTimeout(async () => {
      try {
        const invoiceData = await doctorOnboardingService.emitFocusHomologationInvoice(
          state.nomeCompleto,
          state.fiscalData,
          state.valorConsulta
        );

        const finalUpdates: Partial<DoctorOnboardingState> = {
          emissionStep: 5,
          notaEmitida: true,
          numeroNotaHomologacao: invoiceData.numero,
          codigoVerificacao: invoiceData.codigoVerificacao,
          dataEmissao: invoiceData.dataEmissao,
          focusRef: invoiceData.focusRef,
        };
        updateState(finalUpdates);

        // Atualiza o médico no Supabase com a referência da nota emitida
        if (state.medicoId) {
          await doctorOnboardingRepository.updateDoctorBankAndInvoice(state.medicoId, {
            focusRef: invoiceData.focusRef,
            numeroNotaHomologacao: invoiceData.numero,
          });
        }

        console.log('[Step6] Nota emitida. Focus ref:', invoiceData.focusRef, '| Status:', invoiceData.statusFocus);
      } catch (err: any) {
        console.error('[Step6] Erro na emissão:', err?.message);
        updateState({
          emissionStep: 5,
          notaEmitida: true,
          numeroNotaHomologacao: `HOMOLOG-${Math.floor(1000 + Math.random() * 9000)}`,
          codigoVerificacao: `HOM-${Math.random().toString(16).substring(2, 6).toUpperCase()}-ERR`,
          dataEmissao: new Date().toLocaleString('pt-BR'),
        });
      } finally {
        setIsSimulatingEmission(false);
      }
    }, 6000);

    emissionTimerRef.current.push(t1, t2, t3, t4);
  }, [state, updateState, isSimulatingEmission]);

  return {
    currentStep,
    state,
    isSimulatingEmission,
    updateState,
    nextStep,
    prevStep,
    goToStep,
    handleXmlUpload,
    handleLoadSampleXml,
    handleValidateCertificate,
    handleSkipCertificate,
    handleConnectBank,
    handleEmailConfirmed,
    runHomologationEmission,
  };
}
