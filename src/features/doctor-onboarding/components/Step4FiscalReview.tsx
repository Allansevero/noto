import type { DoctorOnboardingState } from '../types';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface Step4FiscalReviewProps {
  state: DoctorOnboardingState;
  onNext: () => void;
  onPrev: () => void;
}

export function Step4FiscalReview({ state, onNext, onPrev }: Step4FiscalReviewProps) {
  const { fiscalData } = state;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in duration-400">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
          Dados fiscais prontos!
        </h1>
        <p className="text-lg text-neutral-500 font-normal">
          Agora vamos emitir sua primeira nota em dois passos.
        </p>
      </div>

      <div className="space-y-8 py-2">
        <div className="flex items-start gap-4">
          <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center font-display font-semibold text-sm shrink-0 mt-0.5">
            1
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-display font-medium text-neutral-900">
              Conectar sua conta
            </h2>
            <p className="text-neutral-500 text-sm">
              Toda vez que seu paciente cadastrado pagar via PIX, identificamos o recebimento para emitir a nota.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center font-display font-semibold text-sm shrink-0 mt-0.5">
            2
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-display font-medium text-neutral-900">
              Primeira emissão em homologação
            </h2>
            <p className="text-neutral-500 text-sm">
              Enviaremos um PIX automático para testar o ciclo completo e gerar sua nota de teste sem valor fiscal.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 text-xs text-neutral-400">
        Empresa configurada: <span className="text-neutral-900 font-medium">{fiscalData.razaoSocial}</span> • CNPJ: <span className="font-mono text-neutral-700">{fiscalData.cnpj}</span>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="text-neutral-400 hover:text-neutral-900 p-2 transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-all duration-200"
        >
          <span>Conectar conta</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
