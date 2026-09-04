import React, { useRef, useEffect } from 'react';
import type { DoctorOnboardingState } from '../types';
import { ArrowRight } from 'lucide-react';

interface Step1NameProps {
  state: DoctorOnboardingState;
  onUpdate: (data: Partial<DoctorOnboardingState>) => void;
  onNext: () => void;
}

export function Step1Name({ state, onUpdate, onNext }: Step1NameProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.nomeCompleto.trim()) return;
    onNext();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in duration-400">
      {/* Apenas a Frase */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
        Olá! Como devemos chamar você?
      </h1>

      {/* Input sem linha: apenas DR(a). e o cursor piscando */}
      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="flex items-baseline gap-3 text-2xl sm:text-3xl md:text-4xl font-display font-normal text-neutral-900">
          <span className="text-neutral-400 select-none shrink-0 font-light">
            Dr(a).
          </span>
          <input
            ref={inputRef}
            type="text"
            value={state.nomeCompleto}
            onChange={(e) => onUpdate({ nomeCompleto: e.target.value })}
            placeholder="Allan Severo"
            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-neutral-900 placeholder:text-neutral-300 font-display font-medium caret-neutral-900"
            autoFocus
          />
        </div>

        {/* Botão Minimalista Continuar */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={!state.nomeCompleto.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span>Continuar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-neutral-400 hidden sm:inline select-none">
            pressione <kbd className="font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">Enter ↵</kbd>
          </span>
        </div>
      </form>
    </div>
  );
}
