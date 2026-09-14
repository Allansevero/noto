"use client"

import * as React from "react"
import { getNotasEmitidasProgressData } from "../dashboard.repository"
import type { NotasEmitidasProgressData } from "../types"
import { useEnvironment } from "@/context/environment-context"

export function useNotasEmitidasProgress(targetNotas = 5): NotasEmitidasProgressData {
  const { ambiente } = useEnvironment()
  const [data, setData] = React.useState<NotasEmitidasProgressData>({
    totalNotas: 0,
    targetNotas,
    progressPercent: 0,
    valorTotalEmitido: 0,
    topPacientes: [],
    isLoading: true,
  })

  const loadData = React.useCallback(async () => {
    try {
      const res = await getNotasEmitidasProgressData(targetNotas, ambiente)
      setData({
        ...res,
        isLoading: false,
      })
    } catch {
      setData((prev) => ({ ...prev, isLoading: false }))
    }
  }, [targetNotas, ambiente])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  return data
}
