export interface VolumeDataPoint {
  date: string;
  label: string;
  notasNormais: number;
  notasExtras: number;
  total: number;
}

export interface DuplicationReason {
  motivo: string;
  quantidade: number;
  percentual: number;
  cor: string;
  icone?: string;
  impacto: string;
}

export interface TimeSavedMetrics {
  totalNotasEmitidas: number;
  minutosEconomizadosMin: number; // notas * 3 min
  minutosEconomizadosMax: number; // notas * 5 min
  minutosEconomizadosMedia: number; // notas * 4 min
  horasEconomizadas: number;
  diasUteisPoupados: number; // horas / 8
  valorEconomizadoEstimado: number; // R$ baseado em custo/hora de faturista R$ 35/h
}

export interface SlaQueueMetrics {
  notasNaFilaTempoReal: number;
  tempoMedioProcessamentoSegundos: number;
  percentualDentroDoSla: number; // ex: 99.4%
  percentualAtrasadas: number; // ex: 0.6%
  tempoMedioChamadaApiMs: number;
  tempoMaximoRegistradoSegundos: number;
}

export interface SystemHealthMetrics {
  uptimePercent: number; // ex: 99.98%
  apiStatus: "operacional" | "instabilidade" | "fora_do_ar";
  prefeiturasStatus: "operacional" | "lentidao_parcial" | "indisponivel";
  falhasIntegracao: number;
  notasTravadasQueda: number;
  taxaSucessoPrimeiraTentativa: number;
  tempoMedioResolucaoMin: number;
}

export interface DashboardSummary {
  periodo: "7d" | "30d" | "90d" | "ano";
  volumeTotal: number;
  volumeExtras: number;
  taxaDuplicacao: number;
  tempoEconomizado: TimeSavedMetrics;
  slaQueue: SlaQueueMetrics;
  saudeSistema: SystemHealthMetrics;
  volumeHistorico: VolumeDataPoint[];
  motivosDuplicacao: DuplicationReason[];
}
