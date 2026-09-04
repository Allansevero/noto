import React from 'react';
import type { DoctorOnboardingState } from '../types';
import { Copy, Check, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface HomologationInvoicePreviewProps {
  state: DoctorOnboardingState;
}

export function HomologationInvoicePreview({ state }: HomologationInvoicePreviewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.codigoVerificacao || 'HOM-9481-B3A1');
    setCopied(true);
    toast.success('Código de verificação copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-50 p-6 sm:p-8 rounded-2xl space-y-6 text-neutral-900 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
            Focus NF-e • Homologação
          </span>
          <h3 className="text-lg font-display font-medium text-neutral-900">
            NFS-e Eletrônica {state.numeroNotaHomologacao || 'HOMOLOG-4819'}
          </h3>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-neutral-400 font-mono block">
            Código: {state.codigoVerificacao || 'HOM-8491-A1B2'}
          </span>
          <span className="text-[11px] text-neutral-400">
            {state.dataEmissao || new Date().toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
        <div className="space-y-1">
          <span className="text-neutral-400 block uppercase tracking-wider text-[10px]">Prestador (Você)</span>
          <p className="font-medium text-neutral-900 text-sm">{state.fiscalData.razaoSocial}</p>
          <p className="text-neutral-500 font-mono">CNPJ: {state.fiscalData.cnpj}</p>
          <p className="text-neutral-500 font-mono">IM: {state.fiscalData.inscricaoMunicipal}</p>
        </div>

        <div className="space-y-1">
          <span className="text-neutral-400 block uppercase tracking-wider text-[10px]">Tomador (Paciente Teste)</span>
          <p className="font-medium text-neutral-900 text-sm">{state.pacienteNome}</p>
          <p className="text-neutral-500 font-mono">CPF: {state.pacienteCpf}</p>
          <p className="text-neutral-500">Liquidado via PIX</p>
        </div>
      </div>

      <div className="border-t border-neutral-200/80 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5">
          <span className="text-neutral-400 block text-[10px]">Serviço Prestado</span>
          <p className="text-neutral-700 font-medium">{state.fiscalData.codigoServico} - Consulta médica e diagnóstico</p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-neutral-400 block text-[10px]">Valor da Consulta</span>
          <span className="text-xl font-display font-semibold text-neutral-900 font-mono">
            R$ {state.valorConsulta.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end gap-3 text-xs">
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-neutral-900" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copiar código</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
}
