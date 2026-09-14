"use client"

import * as React from "react"
import {
  Sparkles,
  MoreHorizontal,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  EyeOff,
  Building2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

/**
 * Ícone oficial do Nubank extraído do asset local 30680829.svg
 */
function NubankIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M205.14 342.59H249c.01-.18.03-.35.05-.51.03-.33.06-.62.06-.91-.02-8.74-.03-17.48-.05-26.22-.04-24.28-.08-48.55-.19-72.83-.05-11.01-.65-21.96-3.62-32.64-3.73-13.42-10.18-25.15-21.45-33.75-21.25-16.22-53.32-13.8-72.68 5.39-.39.4-.86.72-1.38.94-.52.22-1.07.33-1.64.33-.57.04-1.15.07-1.72.11-3.32.2-6.64.41-9.89 1.02-24.13 4.53-42.88 24.4-45.61 48.8-.87 7.91-.87 15.95-.87 23.93-.06 20.68-.03 41.35 0 62.03l.03 22.01v2.25h43.95v-82.18c0-2.64-.04-5.28-.08-7.92-.06-4.31-.12-8.63-.03-12.94l.06-3.22c.14-7.23.28-14.5 1.04-21.67 1.23-11.65 5.7-22.06 13.75-30.77.63-.7 1.49-1.13 2.43-1.21 10.33.11 20.09 2.44 28.88 8.05 12.99 8.31 19.87 20.66 23.1 35.38 1.83 8.32 1.84 16.79 1.86 25.25v2.51c.09 20.61.1 41.23.1 61.84 0 8.24 0 16.49.02 24.74v2.2zm216.85-173.22h-43.91v22.67c.05 27.43.09 54.86.13 82.29v.24c.03 8.56.06 17.13-1.48 25.6-1.92 10.58-6.07 20.1-13.43 28.06-.57.65-1.37 1.07-2.23 1.18-11.18-.06-21.61-2.78-30.85-9.25-12-8.4-18.33-20.38-21.35-34.39-1.82-8.41-1.84-16.98-1.86-25.52v-2.24c-.09-20.8-.1-41.61-.11-62.42 0-8.05 0-16.11-.02-24.16v-2.01h-43.84c-.01.17-.03.33-.04.46-.03.29-.05.5-.05.72.03 9.56.05 19.12.07 28.68.05 25.34.11 50.68.3 76.01.06 10.48 1.26 20.88 4.58 30.91 4.4 13.33 11.63 24.65 23.64 32.38 21.32 13.7 51.11 10.37 69.34-7.7.39-.41.85-.74 1.37-.96.52-.22 1.08-.33 1.65-.32 2.86-.04 5.72-.24 8.55-.61 26.39-3.56 47.08-25.27 49.03-51.82.53-7.02.52-14.08.51-21.13V169.36z"
        fill="#ffffff"
        fillRule="evenodd"
      />
    </svg>
  )
}

export function NubankCard() {
  const [isSecurityModalOpen, setIsSecurityModalOpen] = React.useState(false)

  return (
    <>
      {/* Card 1:1 com radium, fundo var(--color-amber-200) */}
      <div
        className="w-full max-w-[390px] aspect-square rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm border border-amber-300/70 transition-all duration-300 hover:shadow-md select-none"
        style={{ backgroundColor: "var(--color-amber-200, #fde68a)" }}
      >
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Ícone com cantos radium e fundo var(--color-purple-800) */}
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: "var(--color-purple-800, #581c87)" }}
            >
              <NubankIcon className="w-8 h-8" />
            </div>

            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Nubank
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-700/90 mt-0.5">
                Noto Sync com Pluggy
              </p>
            </div>
          </div>

          {/* Status Conectado usando sharked verde */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-700/15 text-emerald-800 border border-emerald-600/30 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 fill-emerald-600/40" />
              Conectado
            </span>
            <button
              type="button"
              title="Mais opções"
              className="text-slate-600 hover:text-slate-900 transition-colors p-1 rounded-md"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Descrição falando da parceria com a Pluggy e segurança ao conectar */}
        <div className="my-auto py-2">
          <p className="text-[13px] sm:text-[14px] leading-relaxed text-slate-800 font-normal">
            Nossa parceria oficial com a Pluggy garante conexão bancária
            criptografada e segura pelo Open Finance do Banco Central.
            Identificamos apenas recebimentos de consultas em modo somente
            leitura, com total sigilo e proteção dos seus dados.
          </p>
        </div>

        {/* Botão de segurança (pegue da própria Pluggy) */}
        <div>
          <button
            type="button"
            onClick={() => setIsSecurityModalOpen(true)}
            className="w-full h-11 rounded-xl border border-emerald-600 bg-white/70 hover:bg-white text-emerald-800 text-xs sm:text-sm font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-1.5 shadow-2xs hover:border-emerald-700 active:scale-[0.99] cursor-pointer"
          >
            <span>Saiba mais sobre a segurança</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      </div>

      {/* Modal detalhado sobre a Segurança Pluggy */}
      <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-card text-card-foreground border-border/60">
          <DialogHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Segurança Pluggy Open Finance
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Garantias de segurança e conformidade oficial da nossa infraestrutura bancária.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs leading-relaxed">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <Building2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Regulado pelo Banco Central do Brasil
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  A Pluggy é uma instituição autorizada e regulamentada pelo Bacen no âmbito do Open Finance Brasil como Iniciadora de Pagamentos (ITP).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Criptografia de Nível Bancário (AES-256)
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Todas as comunicações e credenciais utilizam criptografia de ponta a ponta (AES-256 e TLS 1.3), o mesmo padrão de segurança dos maiores bancos do mundo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <EyeOff className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Acesso Estritamente Somente Leitura (Read-Only)
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  O NotoMed e a Pluggy NUNCA podem realizar saques, transferências ou pagamentos. O acesso limita-se exclusivamente a verificar recebimentos de pacientes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-xs">
                  Privacidade Total e Conformidade LGPD
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Seus dados financeiros não são compartilhados com terceiros nem utilizados para fins comerciais. Certificação ISO 27001 contínua.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
            <a
              href="https://pluggy.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              Conhecer a Pluggy (pluggy.ai)
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>

            <Button
              size="sm"
              onClick={() => setIsSecurityModalOpen(false)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
