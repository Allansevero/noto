export type InvoiceStatus =
  | "Processando emissão"
  | "Nota Gerada"
  | "Erro na emissão"
  | "Nota Cancelada";

export interface Invoice {
  id: string;
  medico_id: string;
  paciente_id: string;
  numero_nfse?: string | null;
  numero_dps?: string | null;
  serie_dps?: string | null;
  chave_acesso?: string | null;
  codigo_verificacao?: string | null;
  focus_ref: string;
  status: InvoiceStatus;
  valor_servico: number;
  aliquota_iss?: number;
  valor_iss?: number;
  tributos_federais?: number;
  tributos_municipais?: number;
  item_lista_servico?: string;
  codigo_nbs?: string;
  discriminacao?: string;
  data_competencia: string;
  data_emissao?: string;
  data_autorizacao?: string | null;
  pdf_url?: string | null;
  xml_url?: string | null;
  erro_motivo?: string | null;
  ambiente?: "homologacao" | "producao";
  created_at?: string;
  updated_at?: string;

  // Joins opcionais
  pacientes?: {
    id: string;
    nome_completo: string;
    cpf: string;
    email: string;
    telefone: string;
  };
  medicos?: {
    id: string;
    nome_completo: string;
    cnpj: string;
    crm?: string;
    foto_perfil?: string;
  };
}
