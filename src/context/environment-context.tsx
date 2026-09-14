"use client"

import * as React from "react"

export type AmbienteFiscal = "homologacao" | "producao"

interface EnvironmentContextType {
  ambiente: AmbienteFiscal
  isSandbox: boolean
  setAmbiente: (amb: AmbienteFiscal) => void
  toggleAmbiente: () => void
}

const EnvironmentContext = React.createContext<EnvironmentContextType | undefined>(undefined)

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [ambiente, setAmbienteState] = React.useState<AmbienteFiscal>("homologacao")

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notomed_env")
      if (saved === "producao") {
        setAmbienteState("producao")
      } else {
        setAmbienteState("homologacao")
      }
    }
  }, [])

  const setAmbiente = React.useCallback((newAmb: AmbienteFiscal) => {
    setAmbienteState(newAmb)
    if (typeof window !== "undefined") {
      localStorage.setItem("notomed_env", newAmb)
      window.dispatchEvent(new Event("notomed_env_change"))
    }
  }, [])

  const toggleAmbiente = React.useCallback(() => {
    setAmbiente(ambiente === "homologacao" ? "producao" : "homologacao")
  }, [ambiente, setAmbiente])

  const isSandbox = ambiente === "homologacao"

  return (
    <EnvironmentContext.Provider
      value={{
        ambiente,
        isSandbox,
        setAmbiente,
        toggleAmbiente,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment(): EnvironmentContextType {
  const ctx = React.useContext(EnvironmentContext)
  if (!ctx) {
    const isClient = typeof window !== "undefined"
    const saved = isClient ? localStorage.getItem("notomed_env") : null
    const amb: AmbienteFiscal = saved === "producao" ? "producao" : "homologacao"
    return {
      ambiente: amb,
      isSandbox: amb === "homologacao",
      setAmbiente: () => {},
      toggleAmbiente: () => {},
    }
  }
  return ctx
}
