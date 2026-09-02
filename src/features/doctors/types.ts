export type DoctorStatus = 'Ativo' | 'Inativo' | 'Arquivado';
export type TipoEmissor = 'Pessoa Física' | 'Pessoa Jurídica';
export type AmbienteNf = 'homologacao' | 'producao';

export interface DoctorEndereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Doctor {
  id: string;
  user_id?: string;
  nome_completo: string;
  nome?: string;
  sobrenome?: string;
  foto_perfil?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  crm?: string;
  especialidade?: string;
  tipo_emissor?: TipoEmissor;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_municipal?: string;
  endereco?: DoctorEndereco;
  chave_pix?: string;
  status: DoctorStatus;
  created_at: string;
  // Campos Calculados / UI
  total_pacientes?: number;
  emissora?: string;
  // Campos Fiscais Focus NFe
  focus_empresa_id?: string | null;
  ambiente_nf?: AmbienteNf;
  item_lista_servico?: string | null;
  aliquota_iss?: number | null;
  optante_simples_nacional?: boolean | null;
  regime_especial_tributacao?: string | null;
  codigo_tributario_municipio?: string | null;
  codigo_municipio_ibge?: string | null;
}

export interface CreateDoctorInput {
  nome_completo: string;
  nome?: string;
  sobrenome?: string;
  foto_perfil?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  crm?: string;
  especialidade?: string;
  tipo_emissor?: TipoEmissor;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_municipal?: string;
  endereco?: DoctorEndereco;
  chave_pix?: string;
  status?: DoctorStatus;
  emissora?: string;
  // Campos Fiscais Focus NFe
  ambiente_nf?: AmbienteNf;
  item_lista_servico?: string;
  aliquota_iss?: number;
  optante_simples_nacional?: boolean;
  regime_especial_tributacao?: string;
  codigo_tributario_municipio?: string;
  codigo_municipio_ibge?: string;
}
