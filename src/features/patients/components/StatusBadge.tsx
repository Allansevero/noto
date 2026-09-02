import { Badge } from "@/components/ui/badge";
import type { PatientStatus } from "../types";
import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: PatientStatus;
  errorReason?: string | null;
}

export function StatusBadge({ status, errorReason }: StatusBadgeProps) {
  if (status === "Processando emissão") {
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1.5 font-medium rounded-full text-xs shadow-none animate-pulse"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Processando emissão
      </Badge>
    );
  }

  if (status === "Erro na emissão") {
    return (
      <Badge
        variant="outline"
        title={errorReason || "Erro retornado pela prefeitura ou Focus NFe"}
        className="bg-destructive/10 text-destructive dark:text-red-400 border-destructive/20 flex items-center gap-1.5 font-medium rounded-full text-xs shadow-none cursor-help"
      >
        <AlertCircle className="h-3 w-3" />
        Erro na emissão
      </Badge>
    );
  }

  if (status === "Nota Gerada") {
    return (
      <Badge
        variant="outline"
        className="bg-primary/10 text-primary dark:text-[#B7F20B] border-primary/20 flex items-center gap-1.5 font-medium rounded-full text-xs shadow-none"
      >
        <CheckCircle2 className="h-3 w-3" />
        Nota Gerada
      </Badge>
    );
  }

  if (status === "Aprovado") {
    return (
      <Badge
        variant="outline"
        className="bg-primary/10 text-primary dark:text-[#B7F20B] border-primary/20 flex items-center gap-1.5 font-medium rounded-full text-xs shadow-none"
      >
        <CheckCircle2 className="h-3 w-3" />
        Aprovado
      </Badge>
    );
  }

  if (status === "Cancelado") {
    return (
      <Badge
        variant="outline"
        className="bg-muted text-muted-foreground border-border flex items-center gap-1.5 font-medium rounded-full text-xs shadow-none"
      >
        Cancelado
      </Badge>
    );
  }

  // Pendente
  return (
    <Badge
      variant="outline"
      className="bg-secondary text-secondary-foreground flex items-center gap-1.5 font-medium rounded-full text-xs border-border/60 shadow-none"
    >
      <Clock className="h-3 w-3 text-muted-foreground" />
      Pendente
    </Badge>
  );
}
