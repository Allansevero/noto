"use client"

import * as React from "react"
import { MousePointerClick } from "lucide-react"
import { FiscalGlyphMatrix } from "@/components/FiscalGlyphMatrix"

interface SandboxBannerProps {
  onExitSandbox: () => void
  isSandbox?: boolean
  onEnterSandbox?: () => void
}

export function SandboxBanner({
  onExitSandbox,
  isSandbox = true,
  onEnterSandbox,
}: SandboxBannerProps) {
  return (
    <div
      data-banner="sandbox"
      className="relative w-full min-h-[52px] overflow-hidden bg-[#fbf7e5] border-b border-[#dfd5a5] py-3 px-4 flex items-center justify-center select-none"
    >
      {/* 1. Camada da Matriz com Máscara Radial Oval: centro transparente para legibilidade e laterais ovais nítidas */}
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        style={{
          maskImage:
            "radial-gradient(ellipse 38% 85% at 50% 50%, transparent 0%, transparent 42%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,1) 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 38% 85% at 50% 50%, transparent 0%, transparent 42%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,1) 90%)",
        }}
      >
        <FiscalGlyphMatrix
          color="rgba(71, 85, 105, 0.65)"
          accentColor="#006239"
        />
      </div>

      {/* 2. Glows sutis de iluminação nas laterais distantes */}
      <div className="absolute top-0 left-0 w-44 h-full bg-[#3ecf8e]/12 blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-44 h-full bg-[#006239]/10 blur-2xl pointer-events-none" />

      {/* 3. Conteúdo em primeiro plano com texto preto e ação clicável verde */}
      <div className="relative z-10 mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs sm:text-sm">
        {isSandbox ? (
          <>
            <span className="text-black font-medium tracking-tight">
              Notas em sandbox não têm valor legal.
            </span>

            <button
              type="button"
              onClick={onExitSandbox}
              title="Clique para sair do modo Sandbox e emitir notas com valor fiscal real"
              className="inline-flex items-center gap-1.5 font-semibold text-[#006239] hover:text-[#004d2c] underline underline-offset-4 cursor-pointer transition-colors group"
            >
              <MousePointerClick
                strokeWidth={1.75}
                className="size-4 shrink-0 text-[#006239] group-hover:scale-110 transition-transform"
              />
              <span>Emita notas reais.</span>
            </button>
          </>
        ) : (
          <>
            <span className="text-black font-medium tracking-tight">
              Modo de Produção ativado. Suas notas fiscais emitidas possuem valor legal.
            </span>

            {onEnterSandbox && (
              <button
                type="button"
                onClick={onEnterSandbox}
                title="Clique para retornar ao ambiente de testes (Sandbox)"
                className="inline-flex items-center gap-1.5 font-semibold text-[#006239] hover:text-[#004d2c] underline underline-offset-4 cursor-pointer transition-colors group"
              >
                <MousePointerClick
                  strokeWidth={1.75}
                  className="size-4 shrink-0 text-[#006239] group-hover:scale-110 transition-transform"
                />
                <span>Voltar para Sandbox</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
