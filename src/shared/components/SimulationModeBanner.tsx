import { useSubscription } from "@/features/billing/hooks/useSubscription";
import { ArrowRight } from "lucide-react";

interface SimulationModeBannerProps {
  onUpgradeClick: () => void;
}

export function SimulationModeBanner({ onUpgradeClick }: SimulationModeBannerProps) {
  const { subscription, isLoading } = useSubscription();

  // Não exibe enquanto carrega ou se o usuário já tiver plano ativo
  if (isLoading || subscription?.status === "ativa") {
    return null;
  }

  return (
    <div className="w-full shrink-0 bg-[#fbf7e5] text-[#5c3d05] border-b border-[#ca8a04]/60 py-2 px-4 text-xs select-none transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center flex-wrap leading-tight">
        <img
          width="18"
          height="18"
          src="https://img.icons8.com/puffy-filled/32/b45309/sleep.png"
          alt="Modo Simulação"
          className="h-4 w-4 shrink-0 select-none pointer-events-none"
          onError={(e) => {
            // Fallback caso o endpoint com cor tenha qualquer instabilidade
            (e.currentTarget as HTMLImageElement).src = "https://img.icons8.com/puffy-filled/32/sleep.png";
          }}
        />
        <span className="font-medium text-[#5c3d05]">
          Você está no <strong>Modo Simulação</strong>. Para emitir notas fiscais reais em produção,
        </span>
        <button
          type="button"
          onClick={onUpgradeClick}
          className="font-bold text-[#422006] hover:text-black underline underline-offset-2 inline-flex items-center gap-0.5 cursor-pointer transition-colors"
        >
          <span>adquira um plano</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
