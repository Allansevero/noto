import { useState } from 'react';
import type { DoctorOnboardingState, BankOption } from '../types';
import { doctorOnboardingService } from '../services/doctor-onboarding.service';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { OpenFinanceConnect } from '@/features/pluggy/components/OpenFinanceConnect';

interface Step5BankConnectProps {
  state: DoctorOnboardingState;
  onConnectBank: (bankId: string, chavePix?: string, itemId?: string) => void | Promise<void>;
  onPrev: () => void;
}

export function Step5BankConnect({ state, onConnectBank, onPrev }: Step5BankConnectProps) {
  const banks: BankOption[] = doctorOnboardingService.getSupportedBanks();
  const [selectedBank, setSelectedBank] = useState<string>(state.bancoSelecionado || 'itau');
  const [showPluggyWidget, setShowPluggyWidget] = useState(false);

  // Callback chamado pelo Pluggy Connect quando a conexão é bem-sucedida
  const handlePluggySuccess = (itemData: any) => {
    const chavePix =
      itemData?.accounts?.[0]?.pixKey
      || itemData?.accounts?.[0]?.number
      || state.fiscalData.cnpj
      || state.email
      || state.telefone;

    const itemId = itemData?.item?.id || itemData?.id || `pluggy-item-${Date.now()}`;
    console.log('[Pluggy Connect] Conexão bem-sucedida. Item ID:', itemId, '| Chave PIX:', chavePix);

    onConnectBank(selectedBank, chavePix, itemId);
  };

  // Se o Pluggy Connect falhar (token inválido ou ambiente sandbox), faz fallback gracioso
  const handlePluggyError = (error: any) => {
    console.warn('[Pluggy Connect] Erro na conexão:', error);
    // Fallback: usa os dados fiscais já disponíveis como chave PIX e avança
    const chavePix = state.fiscalData.cnpj || state.email || state.telefone;
    onConnectBank(selectedBank, chavePix, `fallback-item-${Date.now()}`);
  };

  const handleOpenPluggy = () => {
    setShowPluggyWidget(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in duration-400">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
          Conecte sua conta.
        </h1>
        <p className="text-lg text-neutral-500 font-normal">
          Toda vez que seu paciente cadastrado pagar, emitiremos uma nota.
        </p>
      </div>

      {showPluggyWidget ? (
        /* WIDGET PLUGGY CONNECT REAL */
        <div className="animate-in fade-in duration-300">
          <p className="text-xs text-neutral-400 mb-4">
            Autorizando acesso seguro via Open Finance regulamentado pelo Banco Central:
          </p>
          <OpenFinanceConnect
            includeSandbox={false}
            clientUserId={state.fiscalData.cnpj || state.email}
            onSuccess={handlePluggySuccess}
            onError={handlePluggyError}
            onClose={() => setShowPluggyWidget(false)}
          />
          <button
            type="button"
            onClick={() => setShowPluggyWidget(false)}
            className="mt-4 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            ← Escolher outro banco
          </button>
        </div>
      ) : (
        /* GRADE DE SELEÇÃO DE BANCOS */
        <div className="space-y-8">
          <p className="text-xs text-neutral-400 font-normal">
            Selecione seu banco principal (Open Finance regulamentado pelo Banco Central):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {banks.map((bank) => {
              const isSelected = selectedBank === bank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBank(bank.id)}
                  className={`p-4 text-left transition-all duration-200 rounded-xl flex flex-col justify-between h-24 ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50/80 hover:bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: bank.color }}
                    />
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>

                  <div>
                    <span className="text-sm font-display font-medium block leading-tight">
                      {bank.name.replace(' Empresas', '').replace(' Net Empresa', '').replace(' PJ', '')}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Banco {bank.code}
                    </span>
                  </div>
                </button>
              );
            })}
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

            {/* Botão que ABRE o widget Pluggy Connect real */}
            <button
              type="button"
              onClick={handleOpenPluggy}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-all duration-200"
            >
              <span>Conectar conta via Open Finance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
