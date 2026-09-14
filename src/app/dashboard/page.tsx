import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserPlus, FilePlus2 } from "lucide-react"
import { NotasEmitidasProgressCard } from "@/features/dashboard/components/NotasEmitidasProgressCard"
import { PlaceholderCard } from "@/features/dashboard/components/PlaceholderCard"

export const metadata = {
  title: "Dashboard | NotoMed",
  description: "Painel de controle NotoMed.",
}

export default function DashboardPage() {
  return (
    <div className="w-full max-w-6xl flex flex-col gap-6 py-2">
      {/* Header do Painel: H1 'Noto analitysc' e em linha os botões de ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
          Noto analitysc
        </h1>

        <div className="flex items-center gap-2.5">
          {/* Botão Secundário: Adicionar paciente */}
          <Link
            href="/dashboard/pacientes"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full h-9 px-4 text-xs font-semibold border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-zinc-900/80 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            )}
          >
            <UserPlus className="size-3.5" />
            Adicionar paciente
          </Link>

          {/* Botão Primário: Gerar notas */}
          <Link
            href="/dashboard/notas"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-full h-9 px-4.5 text-xs font-semibold bg-[#B7F20B] text-neutral-950 hover:bg-[#a6dc0a] shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
            )}
          >
            <FilePlus2 className="size-3.5" />
            Gerar notas
          </Link>
        </div>
      </div>

      {/* Linha Superior: Card Notas Emitidas + Card Longo + Card Quadrado */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full">
        {/* Card 1: Notas Emitidas (fundo #FBF7E5, lateral, bolinhas até 40%, meta 5 notas) */}
        <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0">
          <NotasEmitidasProgressCard className="w-full" targetNotas={5} />
        </div>

        {/* Card 2: Card Longo discreto */}
        <div className="flex-1 min-w-[260px] w-full">
          <PlaceholderCard className="w-full" height="h-[195px]" />
        </div>

        {/* Card 3: Card Quadrado discreto */}
        <div className="w-full lg:w-[195px] shrink-0">
          <PlaceholderCard className="w-full lg:w-[195px]" height="h-[195px]" />
        </div>
      </div>

      {/* Linha Inferior: Três cards do mesmo tamanho com 'Em breve' em cinza */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <PlaceholderCard className="w-full" height="h-[185px]" />
        <PlaceholderCard className="w-full" height="h-[185px]" />
        <PlaceholderCard className="w-full" height="h-[185px]" />
      </div>
    </div>
  )
}
