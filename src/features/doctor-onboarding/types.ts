export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface FiscalData {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoMunicipal: string;
  codigoServico: string;
  descricaoServico: string;
  aliquotaIss: number;
  regimeTributario: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';
  municipioIbge: string;
  cidade: string;
  uf: string;
  optanteSimplesNacional: boolean;
  itemListaServico?: string;
  // Campos detalhados extraídos 100% fiéis ao XML
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  valorServico?: number;
  valorIss?: number;
  numeroNfse?: string;
  numeroDps?: string;
  serie?: string;
  dataEmissao?: string;
  codigoNbs?: string;
  descricaoNbs?: string;
  cLocIncid?: string;
  xLocIncid?: string;
  cLocPrestacao?: string;
  xLocPrestacao?: string;
}

export interface BankOption {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  color: string;
  popular?: boolean;
}

export interface DoctorOnboardingState {
  // IDs de persistência (preenchidos progressivamente durante o fluxo)
  medicoId?: string;    // UUID do registro na tabela medicos (criado no Step 2)
  authUserId?: string;  // UUID do auth.users do Supabase (criado no Step 2)

  // Passo 1
  prefixo: 'Dr.' | 'Dra.';
  nomeCompleto: string;
  crm?: string;
  especialidade?: string;

  // Passo 2
  email: string;
  telefone: string;
  codigoConfirmacao: string;
  emailConfirmado: boolean;

  // Passo 3 & 4 (XML e Focus NFe Empresa)
  xmlFileName?: string;
  xmlRawContent?: string;
  fiscalData: FiscalData;
  xmlParsed: boolean;
  focusEmpresaId?: string;
  focusEmpresaCriada?: boolean;

  // Passo 4 (Certificado Digital A1)
  certificadoNome?: string;
  certificadoBase64?: string;
  certificadoSenha?: string;
  certificadoValido?: boolean;
  certificadoValidoAte?: string;

  // Passo 5 & Pluggy
  bancoSelecionado?: string;
  contaConectada: boolean;
  tipoConexao: 'open_finance' | 'simulacao';
  chavePixCliente?: string;
  pluggyItemId?: string;

  // Passo 6
  emissionStep: number; // 1 to 5
  notaEmitida: boolean;
  numeroNotaHomologacao: string;
  codigoVerificacao: string;
  dataEmissao: string;
  valorConsulta: number;
  pacienteNome: string;
  pacienteCpf: string;
  focusRef?: string;
}
