import * as React from "react"
import { Sparkles, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface ComingSoonPanelProps {
  title: string
  description: string
  icon: React.ComponentType<{ strokeWidth?: number; absoluteStrokeWidth?: boolean; className?: string }>
  highlights?: Array<{
    title: string
    detail: string
  }>
}

export function ComingSoonPanel({
  title,
  description,
  icon: Icon,
  highlights = [],
}: ComingSoonPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header do Painel */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-xs">
            <Icon strokeWidth={1.5} absoluteStrokeWidth className="size-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight font-display">{title}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                <Clock className="size-3" />
                Em breve
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {/* Cartão de Aviso Principal "Em breve" */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            Módulo em Desenvolvimento
          </div>
          <CardTitle className="text-lg font-semibold font-display">
            A área de {title} estará disponível em breve
          </CardTitle>
          <CardDescription>
            Estamos finalizando a integração deste módulo para proporcionar a melhor experiência no controle fiscal e financeiro do seu consultório.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {highlights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border/50 bg-background/50 hover:border-emerald-500/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{h.title}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{h.detail}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
