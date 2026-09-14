import { Bolt } from "lucide-react"
import { ComingSoonPanel } from "@/components/coming-soon-panel"

export default function ConfiguracoesPage() {
  return (
    <ComingSoonPanel
      title="Configurações"
      description="Parâmetros cadastrais, alíquotas fiscais e certificados digitais."
      icon={Bolt}
      highlights={[
        {
          title: "Dados Fiscais e Tributários",
          detail: "Configuração do regime Simples Nacional, alíquotas de ISS e códigos NBS.",
        },
        {
          title: "Certificado Digital A1",
          detail: "Visualização do certificado instalado na Focus NFe e data de expiração.",
        },
        {
          title: "Preferências de Notificação",
          detail: "Avisos por e-mail e webhook a cada nota fiscal emitida ou pendência detectada.",
        },
      ]}
    />
  )
}
