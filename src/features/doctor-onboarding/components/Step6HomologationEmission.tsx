import { useEffect } from 'react';
import type { DoctorOnboardingState } from '../types';
import { HomologationInvoicePreview } from './HomologationInvoicePreview';
import { ArrowRight, Loader2, Check } from 'lucide-react';

interface Step6HomologationEmissionProps {
  state: DoctorOnboardingState;
  isSimulating: boolean;
  onRunEmission: () => void;
  onFinish: () => void;
}

export function Step6HomologationEmission({
  state,
  onRunEmission,
  onFinish,
}: Step6HomologationEmissionProps) {
  useEffect(() => {
    if (!state.notaEmitida && state.emissionStep === 0) {
      onRunEmission();
    }
  }, [state.notaEmitida, state.emissionStep, onRunEmission]);

  const targetPixDisplay =
    state.chavePixCliente || state.fiscalData.cnpj || state.email || '(11) 98492-1049';

  const timeline = [
    {
      id: 1,
      title: 'Enviando um PIX para sua conta.',
      detail: `Chave puxada via Pluggy: ${targetPixDisplay} (R$ ${state.valorConsulta.toFixed(2)})`,
    },
    {
      id: 2,
      title: 'Reconhecendo pagamento.',
      detail: 'Webhook Open Finance capturou o crédito instantâneo',
    },
    {
      id: 3,
      title: 'Gerando nota fiscal.',
      detail: `Emissão automática de homologação via Focus NF-e (${state.fiscalData.cidade})`,
    },
    {
      id: 4,
      title: 'Enviando para seu WhatsApp.',
      detail: `Disparo da NFS-e para ${state.telefone || '(11) 98492-1049'}`,
    },
    {
      id: 5,
      title: 'Nota emitida e enviada!',
      detail: 'Processo 100% concluído em segundos',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in duration-400">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
          Conectado!
        </h1>
        <p className="text-lg text-neutral-500 font-normal">
          {state.notaEmitida
            ? 'Sua primeira nota de homologação foi gerada e enviada.'
            : 'Simulando recebimento e emissão automática em tempo real...'}
        </p>
      </div>

      {/* LINHA DO TEMPO MINIMALISTA */}
      <div className="space-y-5 py-2">
        {timeline.map((item) => {
          const isDone = state.emissionStep > item.id || state.notaEmitida;
          const isCurrent = state.emissionStep === item.id && !state.notaEmitida;

          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 transition-all duration-300 ${
                isDone || isCurrent ? 'opacity-100' : 'opacity-25'
              }`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-neutral-300" />
                )}
              </div>

              <div className="space-y-0.5">
                <p
                  className={`text-base sm:text-lg font-display ${
                    isDone || isCurrent ? 'text-neutral-900 font-medium' : 'text-neutral-400 font-normal'
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-neutral-400">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* AVISO LEGAL OBRIGATÓRIO — O QUE É REAL E O QUE É DEMO */}
      <div className="space-y-3">
        <div className="p-4 bg-neutral-50 rounded-xl text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-neutral-900 font-mono text-base leading-none mt-0.5">✓</span>
            <p className="text-neutral-700">
              <strong className="font-semibold text-neutral-900">Conta bancária conectada de verdade.</strong>{' '}
              A partir de agora, toda vez que um paciente seu pagar via PIX, reconheceremos automaticamente.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-neutral-400 font-mono text-base leading-none mt-0.5">○</span>
            <p className="text-neutral-500">
              <strong className="font-medium text-neutral-700">Esta nota é uma demonstração.</strong>{' '}
              É real no sistema da Focus NF-e, mas em ambiente de homologação — não tem validade jurídica e não soma no seu imposto.
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-400 text-center">
          Assine um plano e suas próximas notas terão validade jurídica plena. Seus dados fiscais e bancários já estão configurados.
        </p>
      </div>

      {/* ESPELHO DA NOTA FISCAL */}
      {state.notaEmitida && <HomologationInvoicePreview state={state} />}

      {/* BOTÃO FINAL */}
      {state.notaEmitida && (
        <div className="pt-4 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Pronto para começar a emitir no automático
          </span>

          <button
            type="button"
            onClick={onFinish}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all duration-200"
          >
            <span>Concluir e Ir para a Plataforma</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
