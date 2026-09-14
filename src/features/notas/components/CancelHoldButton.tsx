"use client"

import * as React from "react"
import { CircleSlash } from "lucide-react"
import { cn } from "@/lib/utils"

interface CancelHoldButtonProps {
  onCancel: () => void
  disabled?: boolean
  isCanceled?: boolean
}

export function CancelHoldButton({
  onCancel,
  disabled = false,
  isCanceled = false,
}: CancelHoldButtonProps) {
  const [isHolding, setIsHolding] = React.useState(false)
  const [progress, setProgress] = React.useState(0) // 0 to 100
  const holdStartTimeRef = React.useRef<number | null>(null)
  const animFrameRef = React.useRef<number | null>(null)
  const isTriggeredRef = React.useRef(false)

  const HOLD_DURATION = 5000 // 5 seconds

  const startHolding = (e: React.SyntheticEvent) => {
    if (disabled || isCanceled) return
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
        onCancel()
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

  if (isCanceled) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 italic select-none">
        <CircleSlash strokeWidth={1.75} className="size-3" />
        Cancelada
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
      title="Mantenha pressionado por 5 segundos para cancelar esta nota fiscal"
      className={cn(
        // Fundo base bg-destructive-400, raio 100% (rounded-full)
        "relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full bg-destructive-400 px-3 py-1 text-xs font-semibold text-white shadow-xs select-none transition-all cursor-pointer active:scale-[0.98]",
        isHolding && "ring-2 ring-destructive-500/40"
      )}
    >
      {/* Barra de progresso animada em bg-destructive-500 preenchendo da esquerda para a direita */}
      <span
        className="absolute inset-y-0 left-0 bg-destructive-500 pointer-events-none rounded-full transition-[width] duration-75 ease-linear"
        style={{
          width: `${progress}%`,
        }}
      />

      {/* Conteúdo com ícone CircleSlash e tempo restante */}
      <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
        <CircleSlash
          strokeWidth={1.75}
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            isHolding && "animate-spin"
          )}
        />
        <span>
          {isHolding ? `Cancelar (${secondsRemaining}s)` : "Cancelar"}
        </span>
      </span>
    </button>
  )
}
