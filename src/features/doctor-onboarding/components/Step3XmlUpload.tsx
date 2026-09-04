import React, { useState, useRef } from 'react';
import type { DoctorOnboardingState } from '../types';
import { ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';

interface Step3XmlUploadProps {
  state: DoctorOnboardingState;
  onXmlUpload: (file: File | string) => void;
  onLoadSample: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step3XmlUpload({
  state,
  onXmlUpload,
  onLoadSample,
  onNext,
  onPrev,
}: Step3XmlUploadProps) {
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showResults, setShowResults] = useState(state.xmlParsed);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startReadingAnimation = (action: () => void) => {
    setIsReading(true);
    setShowResults(false);
    setTimeout(() => {
      action();
      setIsReading(false);
      setShowResults(true);
    }, 1200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      startReadingAnimation(() => onXmlUpload(files[0]));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      startReadingAnimation(() => onXmlUpload(files[0]));
    }
  };

  const handleSampleClick = () => {
    startReadingAnimation(() => onLoadSample());
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in duration-400">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
          Legal! Agora é só arrastar uma nota sua em XML.
        </h1>
        <p className="text-lg text-neutral-500 font-normal">
          Puxamos todos os dados fiscais e configuramos automaticamente.
        </p>
      </div>

      {/* ÁREA DE LEITURA / DROP MINIMALISTA */}
      {!isReading && !showResults && (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-12 sm:p-16 text-center cursor-pointer transition-all duration-300 rounded-2xl ${
              isDragging ? 'bg-neutral-100 scale-[1.01]' : 'bg-neutral-50/80 hover:bg-neutral-100/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xl font-display font-medium text-neutral-900">
              Arraste o arquivo XML aqui
            </p>
            <p className="text-sm text-neutral-400 mt-1">
              ou clique para selecionar do seu computador
            </p>
          </div>

          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={handleSampleClick}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-4 decoration-neutral-300 transition-colors"
            >
              Usar nota de exemplo (Dr. Allan Severo)
            </button>
          </div>
        </div>
      )}

      {/* ANIMAÇÃO DE CARREGANDO E LENDO CONTEÚDO */}
      {isReading && (
        <div className="py-16 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-900" strokeWidth={1.5} />
          <p className="text-base font-display font-medium text-neutral-800">
            Lendo conteúdo e identificando dados fiscais...
          </p>
          <p className="text-xs text-neutral-400 font-mono">
            Analisando CNPJ, regime tributário e alíquota ISS
          </p>
        </div>
      )}

      {/* ANIMAÇÃO DE DADOS OBTIDOS E BOTÃO CONTINUAR */}
      {showResults && !isReading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-neutral-900 font-medium text-sm">
              <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>Dados fiscais identificados com sucesso</span>
            </div>

            {state.focusEmpresaCriada && (
              <span className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full font-normal">
                Empresa vinculada na Focus NF-e
              </span>
            )}
          </div>

          <div className="space-y-4 py-2">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-xs text-neutral-400 block font-normal">Razão Social</span>
              <span className="text-xl sm:text-2xl font-display font-medium text-neutral-900 leading-tight">
                {state.fiscalData.razaoSocial}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-1">
              <div>
                <span className="text-xs text-neutral-400 block">CNPJ</span>
                <span className="text-base font-mono font-medium text-neutral-900">
                  {state.fiscalData.cnpj}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block">Município Emissor</span>
                <span className="text-base font-display font-medium text-neutral-900">
                  {state.fiscalData.cidade} - {state.fiscalData.uf}
                  <span className="text-xs font-mono text-neutral-400 block">
                    IBGE {state.fiscalData.municipioIbge}
                  </span>
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block">Alíquota ISS</span>
                <span className="text-base font-mono font-medium text-neutral-900">
                  {state.fiscalData.aliquotaIss}%
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block">Regime Tributário</span>
                <span className="text-sm font-display font-medium text-neutral-900">
                  {state.fiscalData.regimeTributario}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block">Código de Serviço</span>
                <span className="text-sm font-mono font-medium text-neutral-900">
                  {state.fiscalData.codigoServico}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block">Inscrição Municipal</span>
                <span className="text-sm text-neutral-700 font-mono">
                  {state.fiscalData.inscricaoMunicipal || 'Não consta no XML nacional'}
                </span>
              </div>
            </div>

            {state.fiscalData.logradouro && (
              <div className="pt-2 text-xs text-neutral-400 border-t border-neutral-50">
                Endereço:{' '}
                <span className="text-neutral-700 font-medium">
                  {state.fiscalData.logradouro}
                  {state.fiscalData.numero ? `, ${state.fiscalData.numero}` : ''}
                  {state.fiscalData.bairro ? ` - ${state.fiscalData.bairro}` : ''}
                  {state.fiscalData.cep ? ` • CEP ${state.fiscalData.cep}` : ''}
                </span>
              </div>
            )}
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
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!isReading && !showResults && (
        <div className="flex items-center pt-4">
          <button
            type="button"
            onClick={onPrev}
            className="text-neutral-400 hover:text-neutral-900 p-2 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
