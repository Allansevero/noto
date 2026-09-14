import { HeartHandshake } from "lucide-react"
import { ComingSoonPanel } from "@/components/coming-soon-panel"

export const metadata = {
  title: "Colaboradores | NotoMed",
  description: "Gestão de equipe médica, secretárias e colaboradores da clínica.",
}

export default function ColaboradoresPage() {
  return (
    <ComingSoonPanel
      title="Colaboradores"
      description="Gerenciamento de acessos, secretárias, recepcionistas e equipe médica."
      icon={HeartHandshake}
      highlights={[
        {
          title: "Controle de Acessos",
          detail: "Permissões granulares para secretárias emitirem RPS ou cadastrarem pacientes.",
        },
        {
          title: "Múltiplos Profissionais",
          detail: "Vínculo de múltiplos médicos prestadores sob o mesmo CNPJ ou clínica.",
        },
        {
          title: "Auditoria de Operações",
          detail: "Histórico detalhado de ações realizadas por cada membro da equipe.",
        },
      ]}
    />
  )
}
