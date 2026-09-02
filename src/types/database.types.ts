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
  | 'Nota Cancelada'

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
          foto_perfil: string | null
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
          foto_perfil?: string | null
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
          foto_perfil?: string | null
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
          data_consulta?: string | null
          data_criacao: string
          data_pagamento: string | null
          data_nota_gerada: string | null
          focus_ref: string | null
          nfse_numero: string | null
          nfse_pdf_url: string | null
          nfse_xml_url: string | null
          nfse_erro_motivo: string | null
          nfse_data_emissao: string | null
          created_at?: string | null
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
          data_consulta?: string | null
          data_criacao?: string
          data_pagamento?: string | null
          data_nota_gerada?: string | null
          focus_ref?: string | null
          nfse_numero?: string | null
          nfse_pdf_url?: string | null
          nfse_xml_url?: string | null
          nfse_erro_motivo?: string | null
          nfse_data_emissao?: string | null
          created_at?: string | null
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
          data_consulta?: string | null
          data_criacao?: string
          data_pagamento?: string | null
          data_nota_gerada?: string | null
          focus_ref?: string | null
          nfse_numero?: string | null
          nfse_pdf_url?: string | null
          nfse_xml_url?: string | null
          nfse_erro_motivo?: string | null
          nfse_data_emissao?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_medico_id_fkey"
            columns: ["medico_id"]
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          }
        ]
      }
      notas_fiscais: {
        Row: {
          id: string
          user_id: string | null
          paciente_id: string | null
          medico_id: string | null
          focus_ref: string | null
          numero_dps: string | null
          serie_dps: string | null
          numero_nfse: string | null
          codigo_verificacao: string | null
          status: string
          xml_url: string | null
          pdf_url: string | null
          data_emissao: string | null
          data_autorizacao: string | null
          data_expiracao: string | null
          mensagem_erro: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          paciente_id?: string | null
          medico_id?: string | null
          focus_ref?: string | null
          numero_dps?: string | null
          serie_dps?: string | null
          numero_nfse?: string | null
          codigo_verificacao?: string | null
          status?: string
          xml_url?: string | null
          pdf_url?: string | null
          data_emissao?: string | null
          data_autorizacao?: string | null
          data_expiracao?: string | null
          mensagem_erro?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          paciente_id?: string | null
          medico_id?: string | null
          focus_ref?: string | null
          numero_dps?: string | null
          serie_dps?: string | null
          numero_nfse?: string | null
          codigo_verificacao?: string | null
          status?: string
          xml_url?: string | null
          pdf_url?: string | null
          data_emissao?: string | null
          data_autorizacao?: string | null
          data_expiracao?: string | null
          mensagem_erro?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      planos: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price_cents: number
          billing_interval: string
          max_doctors: number
          max_notes_per_month: number
          features: Json
          payment_link: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price_cents: number
          billing_interval?: string
          max_doctors?: number
          max_notes_per_month?: number
          features?: Json
          payment_link?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price_cents?: number
          billing_interval?: string
          max_doctors?: number
          max_notes_per_month?: number
          features?: Json
          payment_link?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          external_subscription_id: string | null
          notes_used_this_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          external_subscription_id?: string | null
          notes_used_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          external_subscription_id?: string | null
          notes_used_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      faturas_cobranca: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          amount_cents: number
          status: string
          invoice_url: string | null
          pdf_url: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          amount_cents: number
          status?: string
          invoice_url?: string | null
          pdf_url?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          amount_cents?: number
          status?: string
          invoice_url?: string | null
          pdf_url?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      consultas: {
        Row: {
          id: string
          user_id: string | null
          medico_id: string | null
          paciente_id: string | null
          valor: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          medico_id?: string | null
          paciente_id?: string | null
          valor: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          medico_id?: string | null
          paciente_id?: string | null
          valor?: number
          status?: string
          created_at?: string
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
