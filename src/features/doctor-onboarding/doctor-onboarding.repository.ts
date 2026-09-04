import { supabase } from '@/lib/supabase/client';
import type { DoctorOnboardingState, FiscalData } from './types';
import { getCurrentAuthUserId } from './doctor-auth.repository';

export interface SaveDoctorResult {
  success: boolean;
  id?: string;
  source: 'supabase' | 'localStorage';
  error?: string;
}

export class DoctorOnboardingRepository {
  /**
   * ETAPA 2 — Cria o registro básico do médico na tabela `medicos` logo após o auth.
   * Salva: nome, email, telefone, user_id do Supabase Auth.
   * Os dados fiscais (CNPJ, IM, etc.) serão adicionados depois pelo XML (Step 3).
   */
  public async createInitialDoctor(state: DoctorOnboardingState, authUserId?: string): Promise<SaveDoctorResult> {
    const userId = authUserId || await getCurrentAuthUserId().catch(() => null);
    const nomeCompleto = `${state.prefixo} ${state.nomeCompleto}`.trim();

    const payload = {
      nome_completo: nomeCompleto,
      nome: state.nomeCompleto.split(' ')[0] || state.nomeCompleto,
      sobrenome: state.nomeCompleto.split(' ').slice(1).join(' ') || '',
      email: state.email.toLowerCase().trim(),
      telefone: state.telefone || null,
      crm: state.crm || null,
      especialidade: state.especialidade || null,
      status: 'Ativo' as const,
      ambiente_nf: 'homologacao' as const,
      ...(userId ? { user_id: userId } : {}),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('medicos')
          .insert([payload as any])
          .select('id')
          .single();

        if (!error && data) {
          console.log('[Repository] Médico criado no Supabase. ID:', (data as any).id);
          return { success: true, id: (data as any).id, source: 'supabase' };
        }

        // Duplicata de email: busca o registro existente e atualiza
        if (error?.code === '23505') {
          console.warn('[Repository] Email já existe. Buscando registro para atualizar...');
          const { data: existing } = await supabase
            .from('medicos')
            .select('id')
            .eq('email', state.email.toLowerCase().trim())
            .single();

          if (existing) {
            await supabase
              .from('medicos')
              .update({ nome_completo: nomeCompleto, telefone: state.telefone || null, ...(userId ? { user_id: userId } : {}) } as any)
              .eq('id', (existing as any).id);
            return { success: true, id: (existing as any).id, source: 'supabase' };
          }
        }

        console.error('[Repository] Erro ao criar médico:', error?.message);
      } catch (err: any) {
        console.error('[Repository] Exceção ao criar médico:', err?.message);
      }
    }

    // Fallback localStorage
    const localId = `doc-local-${Date.now()}`;
    this._saveLocal({ id: localId, ...payload });
    return { success: true, id: localId, source: 'localStorage', error: 'Supabase indisponível.' };
  }

  /**
   * ETAPA 3 — Atualiza o médico com os dados fiscais extraídos do XML.
   * Requer medicoId salvo no state (obtido no createInitialDoctor do Step 2).
   */
  public async updateDoctorFiscalData(
    medicoId: string,
    fiscalData: FiscalData,
    focusEmpresaId?: string
  ): Promise<SaveDoctorResult> {
    if (!medicoId || medicoId.startsWith('doc-local-')) {
      // Atualiza apenas o localStorage se não há registro no Supabase
      this._updateLocal(medicoId, {
        cnpj: fiscalData.cnpj,
        razao_social: fiscalData.razaoSocial,
        nome_fantasia: fiscalData.nomeFantasia || fiscalData.razaoSocial,
        inscricao_municipal: fiscalData.inscricaoMunicipal,
        aliquota_iss: fiscalData.aliquotaIss,
        item_lista_servico: fiscalData.codigoServico,
        optante_simples_nacional: fiscalData.optanteSimplesNacional,
        cidade: fiscalData.cidade || null,
        uf: fiscalData.uf || null,
        ...(focusEmpresaId ? { focus_empresa_id: focusEmpresaId } : {}),
      });
      return { success: true, id: medicoId, source: 'localStorage' };
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('medicos')
          .update({
            cnpj: fiscalData.cnpj,
            razao_social: fiscalData.razaoSocial,
            nome_fantasia: fiscalData.nomeFantasia || fiscalData.razaoSocial,
            inscricao_municipal: fiscalData.inscricaoMunicipal,
            aliquota_iss: fiscalData.aliquotaIss,
            item_lista_servico: fiscalData.codigoServico,
            optante_simples_nacional: fiscalData.optanteSimplesNacional,
            ...(focusEmpresaId ? { focus_empresa_id: focusEmpresaId } : {}),
          } as any)
          .eq('id', medicoId);

        if (!error) {
          console.log('[Repository] Dados fiscais do XML atualizados no Supabase. Médico ID:', medicoId);
          return { success: true, id: medicoId, source: 'supabase' };
        }

        console.error('[Repository] Erro ao atualizar dados fiscais:', error.message);
      } catch (err: any) {
        console.error('[Repository] Exceção ao atualizar dados fiscais:', err?.message);
      }
    }

    return { success: false, id: medicoId, source: 'localStorage', error: 'Supabase indisponível.' };
  }

  /**
   * ETAPA 4 — Atualiza o médico com o Certificado Digital A1 e focus_empresa_id.
   */
  public async updateDoctorCertificate(
    medicoId: string,
    certData: {
      focusEmpresaId?: string;
      certificadoValidoAte?: string;
      arquivoCertificadoBase64?: string;
      senhaCertificado?: string;
    }
  ): Promise<SaveDoctorResult> {
    if (!medicoId || medicoId.startsWith('doc-local-')) {
      this._updateLocal(medicoId, certData);
      return { success: true, id: medicoId, source: 'localStorage' };
    }

    if (supabase) {
      try {
        const updatePayload: Record<string, unknown> = {};
        if (certData.focusEmpresaId) updatePayload.focus_empresa_id = certData.focusEmpresaId;
        if (certData.arquivoCertificadoBase64) updatePayload.arquivoCertificadoBase64 = certData.arquivoCertificadoBase64;
        if (certData.senhaCertificado) updatePayload.senhaCertificado = certData.senhaCertificado;

        const { error } = await supabase
          .from('medicos')
          .update(updatePayload as any)
          .eq('id', medicoId);

        if (!error) {
          console.log('[Repository] Certificado e Focus Empresa ID salvos no Supabase. Médico ID:', medicoId);
          return { success: true, id: medicoId, source: 'supabase' };
        }
        console.error('[Repository] Erro ao salvar certificado no Supabase:', error.message);
      } catch (err: any) {
        console.error('[Repository] Exceção ao salvar certificado:', err?.message);
      }
    }

    return { success: false, id: medicoId, source: 'localStorage' };
  }

  /**
   * ETAPA 5/6 — Atualiza o médico com dados bancários (Pluggy) e referência da nota de homologação.
   */
  public async updateDoctorBankAndInvoice(
    medicoId: string,
    updates: {
      chavePixCliente?: string;
      pluggyItemId?: string;
      bancoSelecionado?: string;
      focusRef?: string;
      numeroNotaHomologacao?: string;
    }
  ): Promise<SaveDoctorResult> {
    if (!medicoId || medicoId.startsWith('doc-local-')) {
      this._updateLocal(medicoId, updates);
      return { success: true, id: medicoId, source: 'localStorage' };
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('medicos')
          .update(updates as any)
          .eq('id', medicoId);

        if (!error) {
          console.log('[Repository] Dados bancários/nota atualizados. Médico ID:', medicoId);
          return { success: true, id: medicoId, source: 'supabase' };
        }
        console.error('[Repository] Erro ao atualizar dados bancários:', error.message);
      } catch (err: any) {
        console.error('[Repository] Exceção ao atualizar banco/nota:', err?.message);
      }
    }

    return { success: false, id: medicoId, source: 'localStorage' };
  }

  /**
   * Compatibilidade: salva todos os dados de uma vez (usado no Step 6 como fallback completo)
   */
  public async saveOnboardedDoctor(state: DoctorOnboardingState): Promise<SaveDoctorResult> {
    if (state.medicoId) {
      return this.updateDoctorBankAndInvoice(state.medicoId, {
        chavePixCliente: state.chavePixCliente,
        pluggyItemId: state.pluggyItemId,
        bancoSelecionado: state.bancoSelecionado,
        focusRef: state.focusRef,
        numeroNotaHomologacao: state.numeroNotaHomologacao,
      });
    }
    // Se ainda não tem ID (fallback), cria do zero
    return this.createInitialDoctor(state);
  }

  // ─── Helpers localStorage ───────────────────────────────────────────────────

  private _saveLocal(data: Record<string, unknown>): void {
    try {
      const list = JSON.parse(localStorage.getItem('noto_onboarded_doctors') || '[]');
      list.push({ ...data, created_at: new Date().toISOString() });
      localStorage.setItem('noto_onboarded_doctors', JSON.stringify(list));
    } catch { /* silencia */ }
  }

  private _updateLocal(id: string, updates: Record<string, unknown>): void {
    try {
      const list = JSON.parse(localStorage.getItem('noto_onboarded_doctors') || '[]');
      const idx = list.findIndex((d: any) => d.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('noto_onboarded_doctors', JSON.stringify(list));
      }
    } catch { /* silencia */ }
  }
}

export const doctorOnboardingRepository = new DoctorOnboardingRepository();
