"use client"

import * as React from "react"

interface FiscalGlyphMatrixProps {
  className?: string
  color?: string
  accentColor?: string
}

// Tokens fiscais, monetários e alíquotas (personalizáveis para o seu nicho)
const FISCAL_TOKENS = [
  // Preços / Valores
  "R$ 450,00",
  "R$ 380,00",
  "R$ 500,00",
  "R$ 280,00",
  "R$ 650,00",
  "R$ 150,00",
  "R$ 520,00",
  "R$ 800,00",
  "R$ 1.200,00",
  "R$ 350,00",
  "R$ 420,00",
  "R$ 900,00",
  // Alíquotas e Porcentagens
  "ISS: 2,0%",
  "ALÍQ: 2,5%",
  "ALÍQ: 3,0%",
  "ISS: 5,0%",
  "IRRF: 1,5%",
  "PIS: 0,65%",
  "COFINS: 3%",
  "CSLL: 1,0%",
  "RET: 5,85%",
  "TAXA: 0,15",
  "2,0%",
  "2,5%",
  "5,0%",
  // Números e Códigos de Registro
  "NF #2041",
  "NF #3892",
  "NF #4085",
  "NF #5190",
  "NFS-e #809",
  "NFS-e #124",
  "CÓD 04.01",
  "CÓD 14.01",
  "CBO 2251-25",
  "LOTE: 8901",
  "CRM 148.920",
  "CRM 204.311",
  // Termos de Emissão e Status
  "NFS-e",
  "EMITIDA ✓",
  "PIX RECEBIDO",
  "XML VÁLIDO",
  "AUT-BCB ✓",
  "PREFEITURA ✓",
  "DANFE",
  "CONSULTA",
  "PACIENTE",
  "ENVIADA ✓",
]

export function FiscalGlyphMatrix({
  className = "",
  color = "rgba(71, 85, 105, 0.6)",
  accentColor = "#006239",
}: FiscalGlyphMatrixProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let lastTime = 0
    const interval = 110 // Intervalo de atualização em ms
    const mutationRate = 0.03 // Frequência de alteração dos tokens na grade
    const cellWidth = 84 // Largura suficiente para caber tokens
    const cellHeight = 20 // Altura para caber múltiplas linhas no banner

    let currentDpr = window.devicePixelRatio || 1
    let width = 0
    let height = 0
    let cols = 0
    let rows = 0

    interface TokenCell {
      text: string
      isAccent: boolean
      opacity: number
    }

    let grid: TokenCell[][] = []

    const getRandomToken = () => {
      return FISCAL_TOKENS[Math.floor(Math.random() * FISCAL_TOKENS.length)]
    }

    const initGrid = () => {
      grid = []
      for (let r = 0; r < rows; r++) {
        const row: TokenCell[] = []
        for (let c = 0; c < cols; c++) {
          row.push({
            text: getRandomToken(),
            isAccent: Math.random() < 0.08, // 8% de destaque na cor verde primária
            opacity: Math.random() * 0.3 + 0.7,
          })
        }
        grid.push(row)
      }
    }

    const drawFrame = () => {
      if (cols <= 0 || rows <= 0 || !ctx) return

      const effectiveCellW = cellWidth * currentDpr
      const effectiveCellH = cellHeight * currentDpr

      ctx.clearRect(0, 0, width, height)
      ctx.font = `600 ${Math.floor(10.5 * currentDpr)}px "JetBrains Mono", "Source Code Pro", monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r]?.[c]
          if (!cell) continue

          ctx.save()
          if (cell.isAccent) {
            ctx.fillStyle = accentColor
            ctx.globalAlpha = 0.95
            ctx.shadowColor = "rgba(0, 98, 57, 0.45)"
            ctx.shadowBlur = 4 * currentDpr
          } else {
            ctx.fillStyle = color
            ctx.globalAlpha = 0.7
          }
          const x = c * effectiveCellW + effectiveCellW / 2
          const y = r * effectiveCellH + effectiveCellH / 2
          ctx.fillText(cell.text, x, y)
          ctx.restore()
        }
      }
    }

    const updateDimensions = (rectW: number, rectH: number) => {
      currentDpr = window.devicePixelRatio || 1
      const effectiveW = Math.max(100, rectW || canvas.offsetWidth || 300)
      const effectiveH = Math.max(30, rectH || canvas.offsetHeight || 50)

      width = canvas.width = effectiveW * currentDpr
      height = canvas.height = effectiveH * currentDpr

      cols = Math.max(1, Math.floor(width / (cellWidth * currentDpr)))
      rows = Math.max(1, Math.floor(height / (cellHeight * currentDpr)))

      initGrid()
      drawFrame()
    }

    // Inicialização imediata com dimensões atuais
    updateDimensions(canvas.offsetWidth, canvas.offsetHeight)

    // ResizeObserver para garantir cálculo perfeito e dinâmico
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect
          if (w > 0 && h > 0) {
            updateDimensions(w, h)
          }
        }
      })
      resizeObserver.observe(canvas)
    }

    const handleWindowResize = () => {
      updateDimensions(canvas.offsetWidth, canvas.offsetHeight)
    }
    window.addEventListener("resize", handleWindowResize)

    const render = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time

        // Mutação randômica suave de texto e destaque
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = grid[r]?.[c]
            if (!cell) continue

            if (Math.random() < mutationRate) {
              cell.text = getRandomToken()
              if (cell.isAccent && Math.random() < 0.2) {
                cell.isAccent = false
              } else if (!cell.isAccent && Math.random() < 0.03) {
                cell.isAccent = true
              }
            }
          }
        }

        drawFrame()
      }
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener("resize", handleWindowResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      cancelAnimationFrame(animationFrameId)
    }
  }, [color, accentColor])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block pointer-events-none ${className}`}
    />
  )
}
