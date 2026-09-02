import { supabase } from '@/lib/supabase/client';
import type { Patient, PatientStatus } from './types';

const TABLE = 'pacientes' as const;

// Conversão interna: centavos → reais
function toReais(centavos: number): number {
  return centavos / 100;
}

// Conversão interna: reais → centavos
function toCentavos(reais: number): number {
  return Math.round(reais * 100);
}

function mapRow(row: Record<string, unknown>): Patient {
  return {
    id: row.id as string,
    medico_id: row.medico_id as string | undefined,
    nome_completo: row.nome_completo as string,
    email: row.email as string,
    cpf: row.cpf as string,
    telefone: row.telefone as string,
    valor_consulta: toReais(row.valor_consulta as number),
    status: row.status as PatientStatus,
    data_criacao: row.data_criacao as string,
    data_pagamento: (row.data_pagamento as string | null) ?? undefined,
    data_nota_gerada: (row.data_nota_gerada as string | null) ?? undefined,
    focus_ref: (row.focus_ref as string | null) ?? undefined,
    nfse_numero: (row.nfse_numero as string | null) ?? undefined,
    nfse_pdf_url: (row.nfse_pdf_url as string | null) ?? undefined,
    nfse_xml_url: (row.nfse_xml_url as string | null) ?? undefined,
    nfse_erro_motivo: (row.nfse_erro_motivo as string | null) ?? undefined,
    nfse_data_emissao: (row.nfse_data_emissao as string | null) ?? undefined,
  };
}

export async function getPatientsByDoctor(medicoId?: string): Promise<Patient[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('data_criacao', { ascending: false });

  if (medicoId && medicoId !== '00000000-0000-0000-0000-000000000001') {
    query = query.eq('medico_id', medicoId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function approvePatientPayment(patientId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: 'Aprovado', data_pagamento: new Date().toISOString() })
    .eq('id', patientId);
  if (error) throw error;
}

export async function generatePatientInvoice(patientId: string, dataConsulta?: string): Promise<{ status: PatientStatus; message?: string }> {
  try {
    const { emitNfseFocus } = await import('./services/nfseEmission.service');
    const result = await emitNfseFocus(patientId, dataConsulta);
    return {
      status: result.status,
      message: result.message,
    };
  } catch (err: any) {
    console.error('Erro ao emitir nota via Focus NFe:', err);
    throw err;
  }
}

export async function retryPatientInvoice(patientId: string, dataConsulta?: string): Promise<{ status: PatientStatus; message?: string }> {
  return generatePatientInvoice(patientId, dataConsulta);
}

export interface CreatePatientInput {
  medicoId: string;
  nome_completo: string;
  email: string;
  cpf: string;
  telefone: string;
  valor_consulta: number; // em reais
  data_consulta?: string;
  observacoes?: string;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  // Verificar CPF duplicado para o mesmo médico
  const { data: existing } = await supabase
    .from(TABLE)
    .select('id')
    .eq('medico_id', input.medicoId)
    .eq('cpf', input.cpf)
    .maybeSingle();

  if (existing) {
    throw new Error(`CPF_DUPLICATE:${existing.id}`);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      medico_id: input.medicoId,
      nome_completo: input.nome_completo,
      email: input.email,
      cpf: input.cpf,
      telefone: input.telefone,
      valor_consulta: toCentavos(input.valor_consulta),
      status: 'Pendente',
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

/**
 * Importa múltiplos pacientes em lote para um médico no Supabase
 */
export async function createPatientsBatch(
  patientsInput: Array<{
    medicoId: string;
    nome_completo: string;
    email: string;
    cpf: string;
    telefone: string;
    valor_consulta: number;
    data_consulta?: string;
  }>
): Promise<{ insertedCount: number; errors: string[] }> {
  if (!patientsInput || patientsInput.length === 0) {
    return { insertedCount: 0, errors: [] };
  }

  const rowsToInsert = patientsInput.map((p) => ({
    medico_id: p.medicoId,
    nome_completo: p.nome_completo,
    email: p.email || `${p.nome_completo.toLowerCase().replace(/[^a-z0-9]/g, "") || "paciente"}@paciente.com`,
    cpf: p.cpf,
    telefone: p.telefone || "(11) 99999-9999",
    valor_consulta: toCentavos(p.valor_consulta || 0),
    status: "Pendente" as PatientStatus,
    data_criacao: p.data_consulta ? new Date(p.data_consulta).toISOString() : new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from(TABLE)
    .insert(rowsToInsert)
    .select();

  if (error) {
    throw new Error(error.message || "Erro ao importar pacientes em lote no banco de dados.");
  }

  return {
    insertedCount: data?.length || 0,
    errors: [],
  };
}

/**
 * Escuta alterações em tempo real na tabela de pacientes.
 * Cria canal único para evitar colisão no React StrictMode e retorna função de cleanup.
 */
export function subscribeToPatientsChanges(onChange: () => void): () => void {
  const channelId = `pacientes-changes-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
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


