"use client"

import * as React from "react"
import { Archive, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArchiveHoldButtonProps {
  onArchive: () => void
  disabled?: boolean
  isArchived?: boolean
}

export function ArchiveHoldButton({
  onArchive,
  disabled = false,
  isArchived = false,
}: ArchiveHoldButtonProps) {
  const [isHolding, setIsHolding] = React.useState(false)
  const [progress, setProgress] = React.useState(0) // 0 to 100
  const holdStartTimeRef = React.useRef<number | null>(null)
  const animFrameRef = React.useRef<number | null>(null)
  const isTriggeredRef = React.useRef(false)

  const HOLD_DURATION = 5000 // 5 seconds (mesma duração do cancelar)

  const startHolding = (e: React.SyntheticEvent) => {
    if (disabled || isArchived) return
    e.preventDefault()

    setIsHolding(true)
    isTriggeredRef.current = false
    holdStartTimeRef.current = performance.now()

    const updateLoop = (now: number) => {
      if (!holdStartTimeRef.current) return
      const elapsed = now - holdStartTimeRef.current
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100)
      setProgress(pct)

      if (elapsed >= HOLD_DURATION && !isTriggeredRef.current) {
        isTriggeredRef.current = true
        setIsHolding(false)
        setProgress(0)
        holdStartTimeRef.current = null
        onArchive()
        return
      }

      animFrameRef.current = requestAnimationFrame(updateLoop)
    }

    animFrameRef.current = requestAnimationFrame(updateLoop)
  }

  const stopHolding = () => {
    if (isTriggeredRef.current) return
    setIsHolding(false)
    setProgress(0)
    holdStartTimeRef.current = null
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
  }

  React.useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  if (isArchived) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 italic select-none">
        <Check strokeWidth={1.75} className="size-3" />
        Arquivado
      </span>
    )
  }

  const secondsRemaining = Math.max(1, Math.ceil(5 - (progress / 100) * 5))

  return (
    <button
      type="button"
      onMouseDown={startHolding}
      onMouseUp={stopHolding}
      onMouseLeave={stopHolding}
      onTouchStart={startHolding}
      onTouchEnd={stopHolding}
      onTouchCancel={stopHolding}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled}
      title="Mantenha pressionado por 5 segundos para arquivar este paciente"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full px-3 py-1 text-xs font-semibold shadow-xs select-none transition-all cursor-pointer active:scale-[0.98]",
        "bg-neutral-600 hover:bg-neutral-700 text-white",
        isHolding && "ring-2 ring-neutral-500/40"
      )}
    >
      {/* Camada de Progresso: Preenchimento animado em 5s */}
      {isHolding && (
        <span
          className="absolute inset-y-0 left-0 bg-neutral-900/40 dark:bg-black/40 pointer-events-none transition-none"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Ícone e Texto */}
      <span className="relative z-10 flex items-center gap-1 text-[11px] font-medium leading-none">
        <Archive strokeWidth={1.75} className="size-3 shrink-0" />
        {isHolding ? (
          <span className="tabular-nums">
            Segure ({secondsRemaining}s)
          </span>
        ) : (
          <span>Arquivar</span>
        )}
      </span>
    </button>
  )
}
