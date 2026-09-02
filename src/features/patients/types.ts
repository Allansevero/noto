export type PatientStatus = 
  | 'Pendente' 
  | 'Aprovado' 
  | 'Processando emissão' 
  | 'Nota Gerada' 
  | 'Erro na emissão' 
  | 'Cancelado'
  | 'Nota Cancelada';

export interface Patient {
  id: string;
  user_id?: string | null;
  medico_id?: string;
  nome_completo: string;
  email: string;
  cpf: string;
  telefone: string;
  valor_consulta: number;
  status: PatientStatus;
  data_consulta?: string | null;
  data_criacao: string;
  data_pagamento?: string | null;
  data_nota_gerada?: string | null;
  focus_ref?: string | null;
  nfse_numero?: string | null;
  nfse_pdf_url?: string | null;
  nfse_xml_url?: string | null;
  nfse_erro_motivo?: string | null;
  nfse_data_emissao?: string | null;
  created_at?: string | null;
}
