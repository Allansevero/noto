import React, { useState, useRef, useEffect } from 'react';
import type { DoctorOnboardingState } from '../types';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface Step2EmailCodeProps {
  state: DoctorOnboardingState;
  onUpdate: (data: Partial<DoctorOnboardingState>) => void;
  onNext: () => void;
  onPrev: () => void;
  onEmailConfirmed?: (email: string, pinCode: string) => void | Promise<void>;
}

export function Step2EmailCode({ state, onUpdate, onNext, onPrev, onEmailConfirmed }: Step2EmailCodeProps) {
  const [phase, setPhase] = useState<'inputs' | 'pin'>('inputs');
  const [pinCode, setPinCode] = useState(state.codigoConfirmacao || '');
  const emailInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'inputs') {
      emailInputRef.current?.focus();
    } else {
      pinInputRef.current?.focus();
    }
  }, [phase]);

  const handleContinueToPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.email.includes('@')) return;
    setPhase('pin');
  };

  const handlePinChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPinCode(cleaned);
    onUpdate({ codigoConfirmacao: cleaned });
    if (cleaned.length === 6) {
      setTimeout(() => {
        if (onEmailConfirmed) {
          // Cria a conta no Supabase Auth e avança
          void onEmailConfirmed(state.email, cleaned);
        } else {
          onUpdate({ emailConfirmado: true });
          onNext();
        }
      }, 300);
    }
  };

  const handleQuickFillPin = () => {
    const code = '849201';
    setPinCode(code);
    onUpdate({ codigoConfirmacao: code });
    setTimeout(() => {
      if (onEmailConfirmed) {
        void onEmailConfirmed(state.email, code);
      } else {
        onUpdate({ emailConfirmado: true });
        onNext();
      }
    }, 400);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in duration-400">
      {phase === 'inputs' ? (
        /* ─── FASE 1: EMAIL E WHATSAPP MINIMALISTA ─── */
        <form onSubmit={handleContinueToPin} className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
              Qual seu melhor e-mail?
            </h1>
            <input
              ref={emailInputRef}
              type="email"
              value={state.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="allan.severo@medico.com.br"
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-2xl sm:text-3xl text-neutral-900 placeholder:text-neutral-300 font-display font-medium caret-neutral-900"
              autoFocus
            />
          </div>

          <div className="space-y-3 pt-4">
            <label className="text-sm font-normal text-neutral-400">
              E o seu WhatsApp para envio da nota?
            </label>
            <input
              type="tel"
              value={state.telefone}
              onChange={(e) => onUpdate({ telefone: e.target.value })}
              placeholder="(11) 98492-1049"
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-xl sm:text-2xl text-neutral-900 placeholder:text-neutral-300 font-display font-medium caret-neutral-900"
            />
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
              type="submit"
              disabled={!state.email.includes('@')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        /* ─── FASE 2: OBRIGADO + CÓDIGO PIN MINIMALISTA ─── */
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
              Obrigado!
            </h1>
            <p className="text-lg sm:text-xl text-neutral-500 font-normal">
              Te enviamos um código de confirmação em <span className="text-neutral-900 font-medium">{state.email}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <input
              ref={pinInputRef}
              type="text"
              maxLength={6}
              value={pinCode}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="••••••"
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-4xl sm:text-5xl tracking-[0.35em] font-mono text-neutral-900 placeholder:text-neutral-300 caret-neutral-900"
              autoFocus
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleQuickFillPin}
                className="text-xs text-neutral-400 hover:text-neutral-900 underline underline-offset-4 decoration-neutral-200 transition-colors"
              >
                Usar código de teste 849201
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setPhase('inputs')}
              className="text-neutral-400 hover:text-neutral-900 p-2 transition-colors"
              title="Voltar e alterar e-mail"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {pinCode.length === 6 && (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-all duration-200"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
