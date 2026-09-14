"use client"

import * as React from "react"
import { useMemo } from "react"

import Image from "next/image"

/* -------------------------------------------------------------------------
 * FlowingConnector
 * A thick band of particles travelling left-to-right, each with its own
 * size, opacity, vertical drift and speed — deliberately unsynchronized.
 * ---------------------------------------------------------------------- */
function FlowingConnector({
  width = 110,
  overlap = 16,
  height = 38,
  color = "#B7F20B",
  count = 18,
}: {
  width?: number
  overlap?: number
  height?: number
  color?: string
  count?: number
}) {
  const totalWidth = width + overlap * 2

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const duration = 0.6 + Math.random() * 0.7
      return {
        size: 3 + Math.random() * 5.5,
        y: (Math.random() - 0.5) * height * 0.7,
        opacity: 0.35 + Math.random() * 0.65,
        duration,
        delay: -Math.random() * duration,
      }
    })
  }, [count, height])

  return (
    <div
      style={{
        position: "relative",
        width: totalWidth,
        height,
        flex: "0 0 auto",
        marginLeft: -overlap,
        marginRight: -overlap,
        zIndex: 0,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes flow-particle {
          0%   { transform: translate(0px, var(--y, 0px)); }
          100% { transform: translate(var(--dx, ${totalWidth}px), var(--y, 0px)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flow-particle { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {particles.map((p, i) => (
        <span
          key={i}
          className="flow-particle"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: p.size,
            height: p.size,
            marginTop: -p.size / 2,
            borderRadius: 9999,
            backgroundColor: color,
            opacity: p.opacity,
            // @ts-expect-error CSS variable
            "--y": `${p.y}px`,
            "--dx": `${totalWidth}px`,
            animationName: "flow-particle",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Default icons: NotoMed Logo (Esquerda) e Pluggy Logo (Direita)
 * ---------------------------------------------------------------------- */
function DefaultLeftIcon() {
  return (
    <Image
      src="/logo-notomed.svg"
      alt="NotoMed Logo"
      width={72}
      height={72}
      className="size-full object-contain"
      priority
    />
  )
}

function DefaultRightIcon() {
  return (
    <Image
      src="/logo-pluggy.svg"
      alt="Pluggy Logo"
      width={72}
      height={72}
      className="size-full object-contain"
      priority
    />
  )
}

/* -------------------------------------------------------------------------
 * IconConnectionAnimation
 * Exibe os dois blocos de ícones conectados pelo fluxo de partículas,
 * sem fundo ou container envolvente, flutuando limpo na página.
 * ---------------------------------------------------------------------- */
interface IconConnectionAnimationProps {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  color?: string
  height?: number
}

export function IconConnectionAnimation({
  leftIcon,
  rightIcon,
  color = "#B7F20B",
  height = 140,
}: IconConnectionAnimationProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height,
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
      className="select-none bg-transparent"
    >
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 16 }}>
        {/* Bloco Esquerdo (NotoMed) */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            height: 72,
            width: 72,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          }}
          className="border border-neutral-200/80 dark:border-neutral-800 bg-black shrink-0"
        >
          {leftIcon ?? <DefaultLeftIcon />}
        </div>

        <FlowingConnector color={color} />

        {/* Bloco Direito (Pluggy) */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            height: 72,
            width: 72,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          }}
          className="border border-neutral-200/80 dark:border-neutral-800 bg-[#0C0027] shrink-0"
        >
          {rightIcon ?? <DefaultRightIcon />}
        </div>
      </div>
    </div>
  )
}
