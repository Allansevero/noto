import { Puzzle } from "lucide-react"
import { ComingSoonPanel } from "@/components/coming-soon-panel"

export default function IntegracoesPage() {
  return (
    <ComingSoonPanel
      title="Integrações"
      description="Conexões com bancos, plataformas fiscais e prontuários."
      icon={Puzzle}
      highlights={[
        {
          title: "Open Finance (Pluggy)",
          detail: "Gerenciamento de contas bancárias vinculadas, sincronização de extratos e saldo.",
        },
        {
          title: "Focus NFe",
          detail: "Status dos tokens de homologação e produção para transmissão de NFS-e Nacional.",
        },
        {
          title: "Webhooks e APIs Externas",
          detail: "Integração futura com prontuários eletrônicos (iClinic, Feegow) e contas Stone.",
        },
      ]}
    />
  )
}
