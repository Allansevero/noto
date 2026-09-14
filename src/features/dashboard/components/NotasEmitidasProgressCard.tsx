"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotasEmitidasProgress } from "../hooks/useNotasEmitidasProgress"
import { cn } from "@/lib/utils"

interface NotasEmitidasProgressCardProps {
  className?: string
  targetNotas?: number
}

const TOTAL_BARS = 36 // Pequenos pausinhos alinhados juntos ocupando a largura

function formatCurrency(val?: number) {
  const v = typeof val === "number" ? val : 0
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function NotasEmitidasProgressCard({
  className,
  targetNotas = 5, // Sandbox fixo em 5 notas
}: NotasEmitidasProgressCardProps) {
  const { totalNotas, progressPercent, valorTotalEmitido, topPacientes, isLoading } =
    useNotasEmitidasProgress(targetNotas)

  const filledBarsCount = Math.min(
    TOTAL_BARS,
    Math.round((progressPercent / 100) * TOTAL_BARS)
  )

  const getInitials = (nome: string) => {
    const parts = nome.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  // Interpolação suave do degradê horizontal da cor da marca (#B7F20B -> #70CC00)
  const getBarGradientColor = (index: number) => {
    const ratio = index / Math.max(1, TOTAL_BARS - 1)
    const r = Math.round(183 - ratio * (183 - 112))
    const g = Math.round(242 - ratio * (242 - 204))
    const b = Math.round(11 - ratio * (11 - 0))
    return `rgb(${r}, ${g}, ${b})`
  }

  const faltamNotas = Math.max(0, targetNotas - totalNotas)

  return (
    <div
      className={cn(
        "relative w-full h-[195px] rounded-[24px] bg-[#FBF7E5] border border-[#EADBBD]/80 p-5 shadow-xs flex flex-col justify-between overflow-hidden text-neutral-900 transition-all select-none",
        className
      )}
      style={{ backgroundColor: "#FBF7E5" }}
    >
      {/* Bolinhas discretas na parte superior até 40% que perdem opacidade até sumir */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%] select-none rounded-t-[24px]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.13) 1.2px, transparent 1.2px)",
          backgroundSize: "13px 13px",
          maskImage:
            "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%)",
        }}
      />

      {/* ========================================================= */}
      {/* 1. PARTE SUPERIOR: NÚMERO MAIOR + TÍTULO E AVATARES EM LINHA */}
      {/* ========================================================= */}
      <div className="relative z-10 flex items-center gap-3.5">
        {/* Número bem maior */}
        <motion.span
          key={totalNotas}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl sm:text-6xl font-black tracking-tight text-neutral-950 font-sans leading-none"
        >
          {isLoading ? "—" : totalNotas}
        </motion.span>

        {/* Em linha com o número: Títulozinho pequenininho e Avatares na parte inferior */}
        <div className="flex flex-col justify-between self-stretch py-0.5">
          <span className="text-xs sm:text-[13px] font-semibold text-neutral-800 tracking-tight leading-tight">
            Notas Emitidas
          </span>

          {/* Avatares dos pacientes na parte inferior em relação ao número */}
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {topPacientes.map((paciente, idx) => (
              <Avatar
                key={paciente.id}
                className="size-6 border-2 border-[#FBF7E5] shadow-2xs cursor-pointer hover:scale-110 hover:z-20 transition-transform"
                title={`${paciente.nome}: ${paciente.total_notas} notas`}
              >
                <AvatarImage src={paciente.avatar_url} alt={paciente.nome} />
                <AvatarFallback
                  className={cn(
                    "text-[9px] font-bold select-none",
                    idx === 0
                      ? "bg-neutral-950 text-white"
                      : idx === 1
                      ? "bg-neutral-800 text-neutral-100"
                      : "bg-neutral-600 text-neutral-100"
                  )}
                >
                  {getInitials(paciente.nome)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PARTE DO MEIO: PEQUENOS PAUSINHOS (BARRAS)             */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full h-8 sm:h-9 flex items-end justify-between gap-[2.5px] sm:gap-[3px]">
        {Array.from({ length: TOTAL_BARS }).map((_, index) => {
          const isFilled = index < filledBarsCount

          return (
            <motion.div
              key={index}
              initial={{ scaleY: 0.3, opacity: 0.4 }}
              animate={{
                scaleY: 1,
                opacity: 1,
              }}
              transition={{
                delay: index * 0.012,
                duration: 0.3,
                ease: "easeOut",
              }}
              className={cn(
                "flex-1 h-full rounded-full transition-colors duration-300 origin-bottom",
                !isFilled && "bg-[#E3DEC7]"
              )}
              style={{
                backgroundColor: isFilled
                  ? getBarGradientColor(index)
                  : undefined,
                boxShadow: isFilled
                  ? "0 1px 3px rgba(183, 242, 11, 0.25)"
                  : undefined,
              }}
            />
          )
        })}
      </div>

      {/* ========================================================= */}
      {/* 3. ABAIXO DAS BARRAS: QUANTIDADE EMITIDA / VALOR E FALTA  */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full flex items-center justify-between text-[11px] sm:text-xs pt-1 border-t border-[#EADBBD]/60">
        {/* Início: Quantidade e Valor emitido */}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-bold text-neutral-950">
            {totalNotas} {totalNotas === 1 ? "emitida" : "emitidas"}
          </span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-700">
            {formatCurrency(valorTotalEmitido)}
          </span>
        </div>

        {/* Final: Quantidade que falta da sandbox (total 5) */}
        <div className="flex items-center gap-1 text-neutral-600 font-medium">
          <span>Faltam</span>
          <span className="font-bold text-neutral-950">
            {faltamNotas}
          </span>
          <span className="text-neutral-500">de {targetNotas}</span>
        </div>
      </div>
    </div>
  )
}
