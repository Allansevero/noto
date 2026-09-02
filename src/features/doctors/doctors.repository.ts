import { supabase } from '@/lib/supabase/client';
import type { Doctor, CreateDoctorInput } from './types';

const TABLE = 'medicos' as const;
const BUCKET_NAME = 'avatares';

function getAvatarUrl(rawUrlOrPath?: string | null): string | undefined {
  if (!rawUrlOrPath) return undefined;
  if (
    rawUrlOrPath.startsWith('http://') ||
    rawUrlOrPath.startsWith('https://') ||
    rawUrlOrPath.startsWith('data:image/')
  ) {
    return rawUrlOrPath;
  }
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(rawUrlOrPath);
  return data.publicUrl;
}

function mapRow(row: Record<string, unknown>, patientCount = 0): Doctor {
  const enderecoObj = (
    typeof row.endereco === 'object' && row.endereco !== null ? row.endereco : {}
  ) as Record<string, unknown>;

  const rawAvatar = (
    row.foto_perfil ??
    row.avatar_url ??
    row.foto ??
    enderecoObj.foto_perfil
  ) as string | undefined;

  const emissoraVal = (
    row.emissora ??
    enderecoObj.emissora ??
    'GOV'
  ) as string;

  const nomeCompleto = (row.nome_completo ?? '') as string;
  const partesNome = nomeCompleto.split(' ');
  const primeiroNome = partesNome[0] || '';
  const sobrenome = (enderecoObj.sobrenome as string) || partesNome.slice(1).join(' ');

  return {
    id: row.id as string,
    user_id: row.user_id as string | undefined,
    nome_completo: nomeCompleto,
    nome: primeiroNome,
    sobrenome: sobrenome,
    foto_perfil: getAvatarUrl(rawAvatar),
    email: (row.email ?? '') as string,
    telefone: (row.telefone ?? '') as string,
    cpf: (row.cpf ?? '') as string,
    crm: (row.crm ?? '') as string,
    especialidade: (row.especialidade ?? 'Clínico Geral') as string,
    tipo_emissor: (row.tipo_emissor ?? 'Pessoa Jurídica') as Doctor['tipo_emissor'],
    cnpj: (row.cnpj ?? '') as string,
    razao_social: (row.razao_social ?? '') as string,
    nome_fantasia: (row.nome_fantasia ?? '') as string,
    inscricao_municipal: (row.inscricao_municipal ?? '') as string,
    endereco: row.endereco as Doctor['endereco'],
    chave_pix: (row.chave_pix ?? '') as string,
    status: (row.status ?? 'Ativo') as Doctor['status'],
    created_at: row.created_at as string,
    total_pacientes: patientCount,
    emissora: emissoraVal,
    // Campos Focus NFe
    focus_empresa_id: (row.focus_empresa_id as string | null) ?? undefined,
    ambiente_nf: (row.ambiente_nf as Doctor['ambiente_nf']) ?? 'producao',
    item_lista_servico: (row.item_lista_servico as string | null) ?? undefined,
    aliquota_iss: (row.aliquota_iss as number | null) ?? undefined,
    optante_simples_nacional: (row.optante_simples_nacional as boolean | null) ?? undefined,
    regime_especial_tributacao: (row.regime_especial_tributacao as string | null) ?? undefined,
    codigo_tributario_municipio: (row.codigo_tributario_municipio as string | null) ?? undefined,
    codigo_municipio_ibge: (row.codigo_municipio_ibge as string | null) ?? undefined,
  };
}

export async function getDoctors(): Promise<Doctor[]> {
  // 1. Obtém o usuário autenticado para filtrar apenas seus médicos
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  // 2. Busca apenas os médicos do usuário logado (RLS também garante isso no banco)
  const { data: doctorsData, error: docError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (docError) {
    console.error('Erro ao buscar médicos:', docError);
    throw new Error(docError.message || 'Erro ao carregar médicos do banco de dados.');
  }

  // 2. Busca contagem de pacientes por médico
  const { data: patientsData } = await supabase
    .from('pacientes')
    .select('medico_id');

  const countMap = new Map<string, number>();
  if (patientsData) {
    for (const p of patientsData) {
      if (p.medico_id) {
        countMap.set(p.medico_id, (countMap.get(p.medico_id) || 0) + 1);
      }
    }
  }

  return (doctorsData ?? []).map((doc) =>
    mapRow(doc, countMap.get(doc.id) || 0)
  );
}

export async function createDoctor(input: CreateDoctorInput): Promise<Doctor> {
  const cleanCnpj = input.cnpj ? input.cnpj.replace(/\D/g, '') : '';
  const fallbackEmail =
    input.email && input.email.includes('@')
      ? input.email.trim()
      : `contato.${cleanCnpj || Date.now()}.${Math.floor(Math.random() * 1000)}@clinica.com`;

  // Salvamos foto_perfil, emissora e sobrenome de forma segura no JSON 'endereco'
  const enderecoPayload = {
    ...(input.endereco || {}),
    foto_perfil: input.foto_perfil || '',
    emissora: input.emissora || 'GOV',
    sobrenome: input.sobrenome || '',
  };

  // Obtém o usuário logado para associar o médico ao seu dono
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  // ATENÇÃO: Enviamos APENAS as colunas existentes no schema do banco, com NULL para opcionais únicos
  const insertPayload: Record<string, unknown> = {
    user_id: user.id, // ← vínculo obrigatório com o usuário dono
    nome_completo: input.nome_completo.trim(),
    email: fallbackEmail,
    telefone: input.telefone ? input.telefone.trim() : null,
    cpf: input.cpf && input.cpf.trim() !== '' ? input.cpf.trim() : null,
    crm: input.crm && input.crm.trim() !== '' ? input.crm.trim() : null,
    especialidade: input.especialidade || 'Clínico Geral',
    tipo_emissor: input.tipo_emissor ?? 'Pessoa Jurídica',
    cnpj: input.cnpj && input.cnpj.trim() !== '' ? input.cnpj.trim() : null,
    razao_social: input.razao_social || input.nome_completo,
    nome_fantasia: input.nome_fantasia || input.razao_social || input.nome_completo,
    inscricao_municipal: input.inscricao_municipal || null,
    endereco: enderecoPayload as any,
    chave_pix: input.chave_pix || null,
    status: input.status ?? 'Ativo',
    // Fiscais Focus NFe
    ambiente_nf: input.ambiente_nf ?? 'producao',
    item_lista_servico: input.item_lista_servico ?? '040101',
    aliquota_iss: input.aliquota_iss ?? 3.0,
    optante_simples_nacional: input.optante_simples_nacional ?? true,
    regime_especial_tributacao: input.regime_especial_tributacao || null,
    codigo_tributario_municipio: input.codigo_tributario_municipio || null,
    codigo_municipio_ibge: input.codigo_municipio_ibge ?? '4314902',
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(insertPayload as any)
    .select()
    .single();

  if (error) {
    console.error('Erro detalhado do Supabase ao cadastrar médico:', error);
    if (error.code === '23505') {
      const details = (error.details || error.message || '').toLowerCase();
      if (details.includes('cnpj')) {
        throw new Error('Este CNPJ já está cadastrado para outro médico no sistema.');
      }
      if (details.includes('email')) {
        throw new Error('Este e-mail já está cadastrado para outro médico no sistema.');
      }
      if (details.includes('crm')) {
        throw new Error('Este CRM já está cadastrado para outro médico no sistema.');
      }
      if (details.includes('cpf')) {
        throw new Error('Este CPF já está cadastrado para outro médico no sistema.');
      }
      throw new Error(`Registro duplicado no sistema: ${error.details || error.message}`);
    }
    throw new Error(error.message || error.details || 'Erro ao cadastrar médico no banco de dados.');
  }

  const createdDoctor = mapRow(data as Record<string, unknown>, 0);

  // Criação automática da empresa na Focus NF-e
  try {
    const { syncDoctorWithFocusNfe } = await import('./services/focusNfe.service');
    const syncRes = await syncDoctorWithFocusNfe(createdDoctor, {
      ambiente: (input.ambiente_nf as 'homologacao' | 'producao') || 'producao',
      aliquotaIss: input.aliquota_iss ?? 3.0,
      itemServico: input.item_lista_servico || '0401',
    });

    if (syncRes.focusEmpresaId) {
      createdDoctor.focus_empresa_id = syncRes.focusEmpresaId;
    }
    if (syncRes.focusToken) {
      createdDoctor.focus_token = syncRes.focusToken;
    }
  } catch (focusErr: any) {
    console.warn('Aviso: Médico salvo no Noto, mas validação da Focus NF-e requer atenção:', focusErr.message);
  }

  return createdDoctor;
}

export async function updateDoctor(
  id: string,
  input: Partial<CreateDoctorInput>
): Promise<Doctor> {
  const updatePayload: Record<string, unknown> = {
    nome_completo: input.nome_completo,
    especialidade: input.especialidade,
    cnpj: input.cnpj,
    razao_social: input.razao_social,
    nome_fantasia: input.nome_fantasia,
    inscricao_municipal: input.inscricao_municipal,
    email: input.email,
    telefone: input.telefone,
    status: input.status,
  };

  if (input.endereco || input.foto_perfil || input.sobrenome || input.emissora) {
    updatePayload.endereco = {
      ...(input.endereco || {}),
      foto_perfil: input.foto_perfil || '',
      emissora: input.emissora || 'GOV',
      sobrenome: input.sobrenome || '',
    };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar médico:', error);
    throw new Error(error.message || 'Erro ao atualizar dados do médico.');
  }

  return mapRow(data as Record<string, unknown>);
}

export async function archiveDoctor(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'Arquivado' } as any)
    .eq('id', id);

  if (error) {
    console.error('Erro ao arquivar médico:', error);
    throw new Error(error.message || 'Erro ao arquivar médico.');
  }
}

export async function unarchiveDoctor(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'Ativo' } as any)
    .eq('id', id);

  if (error) {
    console.error('Erro ao reativar médico:', error);
    throw new Error(error.message || 'Erro ao reativar médico.');
  }
}

export async function archiveDoctorsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'Arquivado' } as any)
    .in('id', ids);

  if (error) {
    console.error('Erro ao arquivar médicos em massa:', error);
    throw new Error(error.message || 'Erro ao arquivar médicos selecionados.');
  }
}

export async function unarchiveDoctorsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'Ativo' } as any)
    .in('id', ids);

  if (error) {
    console.error('Erro ao reativar médicos em massa:', error);
    throw new Error(error.message || 'Erro ao reativar médicos selecionados.');
  }
}

export async function deleteDoctor(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir médico:', error);
    throw new Error(error.message || 'Erro ao excluir médico.');
  }
}

export async function deleteDoctorsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Erro ao excluir médicos em massa:', error);
    throw new Error(error.message || 'Erro ao excluir médicos selecionados.');
  }
}

export function subscribeToDoctorsChanges(onChange: () => void): () => void {
  const channelId = `medicos-changes-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
