export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PatientStatus = 
  | 'Pendente' 
  | 'Aprovado' 
  | 'Processando emissão' 
  | 'Nota Gerada' 
  | 'Erro na emissão' 
  | 'Cancelado'

export type AmbienteNf = 'homologacao' | 'producao'

export interface Database {
  public: {
    Tables: {
      medicos: {
        Row: {
          id: string
          user_id: string | null
          nome_completo: string | null
          nome: string | null
          email: string
          telefone: string | null
          cpf: string | null
          crm: string
          especialidade: string | null
          tipo_emissor: string | null
          cnpj: string | null
          razao_social: string | null
          nome_fantasia: string | null
          inscricao_municipal: string | null
          endereco: Json | null
          chave_pix: string | null
          status: string | null
          created_at: string
          focus_empresa_id: string | null
          focus_token: string | null
          ambiente_nf: AmbienteNf | null
          item_lista_servico: string | null
          aliquota_iss: number | null
          optante_simples_nacional: boolean | null
          regime_especial_tributacao: string | null
          codigo_tributario_municipio: string | null
          codigo_municipio_ibge: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome_completo?: string | null
          nome?: string | null
          email: string
          telefone?: string | null
          cpf?: string | null
          crm: string
          especialidade?: string | null
          tipo_emissor?: string | null
          cnpj?: string | null
          razao_social?: string | null
          nome_fantasia?: string | null
          inscricao_municipal?: string | null
          endereco?: Json | null
          chave_pix?: string | null
          status?: string | null
          created_at?: string
          focus_empresa_id?: string | null
          focus_token?: string | null
          ambiente_nf?: AmbienteNf | null
          item_lista_servico?: string | null
          aliquota_iss?: number | null
          optante_simples_nacional?: boolean | null
          regime_especial_tributacao?: string | null
          codigo_tributario_municipio?: string | null
          codigo_municipio_ibge?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          nome_completo?: string | null
          nome?: string | null
          email?: string
          telefone?: string | null
          cpf?: string | null
          crm?: string
          especialidade?: string | null
          tipo_emissor?: string | null
          cnpj?: string | null
          razao_social?: string | null
          nome_fantasia?: string | null
          inscricao_municipal?: string | null
          endereco?: Json | null
          chave_pix?: string | null
          status?: string | null
          created_at?: string
          focus_empresa_id?: string | null
          focus_token?: string | null
          ambiente_nf?: AmbienteNf | null
          item_lista_servico?: string | null
          aliquota_iss?: number | null
          optante_simples_nacional?: boolean | null
          regime_especial_tributacao?: string | null
          codigo_tributario_municipio?: string | null
          codigo_municipio_ibge?: string | null
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          id: string
          user_id: string | null
          medico_id: string
          nome_completo: string
          email: string
          cpf: string
          telefone: string
          valor_consulta: number
          status: PatientStatus
          data_criacao: string
          data_pagamento: string | null
          data_nota_gerada: string | null
          focus_ref: string | null
          nfse_numero: string | null
          nfse_pdf_url: string | null
          nfse_xml_url: string | null
          nfse_erro_motivo: string | null
          nfse_data_emissao: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          medico_id: string
          nome_completo: string
          email: string
          cpf: string
          telefone: string
          valor_consulta: number
          status?: PatientStatus
          data_criacao?: string
          data_pagamento?: string | null
          data_nota_gerada?: string | null
          focus_ref?: string | null
          nfse_numero?: string | null
          nfse_pdf_url?: string | null
          nfse_xml_url?: string | null
          nfse_erro_motivo?: string | null
          nfse_data_emissao?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          medico_id?: string
          nome_completo?: string
          email?: string
          cpf?: string
          telefone?: string
          valor_consulta?: number
          status?: PatientStatus
          data_criacao?: string
          data_pagamento?: string | null
          data_nota_gerada?: string | null
          focus_ref?: string | null
          nfse_numero?: string | null
          nfse_pdf_url?: string | null
          nfse_xml_url?: string | null
          nfse_erro_motivo?: string | null
          nfse_data_emissao?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      patient_status: PatientStatus
      ambiente_nf: AmbienteNf
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
