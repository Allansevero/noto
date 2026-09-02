import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSubscription } from "@/features/billing/hooks/useSubscription";
import { BillingPage } from "@/features/billing/components/BillingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserRound,
  CreditCard,
  Webhook,
  KeyRound,
  Save,
  Check,
  Zap,
  Activity,
  MessageSquare,
  ArrowLeftRight,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

interface SettingsPageProps {
  initialTab?: "conta" | "plano" | "integracoes";
}

interface IntegrationApp {
  id: string;
  name: string;
  category: string;
  description: string;
  isActive?: boolean;
  logoBg?: string;
  svgPath?: string;
  icon?: React.ReactNode;
}

const INTEGRATION_APPS: IntegrationApp[] = [
  // 1. Motor Fiscal Nativo Noto (Primeiro & Ativo)
  {
    id: "noto",
    name: "Noto",
    category: "Emissão Fiscal",
    description: "Motor nativo de validação, aprovação e emissão de NFS-e.",
    isActive: true,
    icon: (
      <div className="size-8 rounded-lg bg-[#B7F20B] text-black font-display font-black text-sm flex items-center justify-center shadow-xs">
        N
      </div>
    ),
  },
  // Sistemas Clínicos & Mensageria
  {
    id: "assistencialize",
    name: "Assistencialize",
    category: "Prontuário",
    description: "Sincronização de prontuários e consultas de pacientes.",
    logoBg: "#0284c7",
    icon: <Activity className="h-6 w-6 text-[#0284c7]" />,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "Comunicação",
    description: "Envio automático de NFS-e e cobranças.",
    logoBg: "#25D366",
    icon: <MessageSquare className="h-6 w-6 text-[#22c55e]" />,
  },
  // Gateways & Adquirentes
  {
    id: "sumup",
    name: "SumUp",
    category: "Pagamentos",
    description: "Conciliação de recebimentos presenciais em maquininhas.",
    logoBg: "#002D4C",
    icon: <CreditCard className="h-6 w-6 text-[#0ea5e9]" />,
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Pagamentos",
    description: "Processamento de pagamentos globais e recorrências.",
    logoBg: "#635BFF",
    icon: <Zap className="h-6 w-6 text-[#6366f1]" />,
  },
  {
    id: "asaas",
    name: "Asaas",
    category: "Pagamentos",
    description: "Cobranças inteligentes via Pix e boleto.",
    svgPath: "/banks-svg/Asaas IP S.A/header-logo-azul.svg",
    logoBg: "#f8fafc",
  },
  {
    id: "infinitepay",
    name: "InfinitePay",
    category: "Pagamentos",
    description: "Recebimento no Pix e cartão com taxa zero.",
    svgPath: "/banks-svg/InfinitePay/InfitePay.svg",
    logoBg: "#000000",
  },
  {
    id: "stone",
    name: "Stone",
    category: "Pagamentos",
    description: "Conciliação automática de recebimentos e maquininhas.",
    svgPath: "/banks-svg/Stone Pagamentos S.A/stone.svg",
    logoBg: "#00A868",
  },
  // Principais Bancos Brasileiros (com SVGs Oficiais)
  {
    id: "itau",
    name: "Itaú",
    category: "Bancos",
    description: "Extratos automáticos e conciliação bancária direta.",
    svgPath: "/banks-svg/Itaú Unibanco S.A/itau-2-laranja.svg",
    logoBg: "#EC7000",
  },
  {
    id: "bradesco",
    name: "Bradesco",
    category: "Bancos",
    description: "Liquidação automática e conciliação de contas.",
    svgPath: "/banks-svg/Bradesco S.A/bradesco.svg",
    logoBg: "#CC092F",
  },
  {
    id: "bb",
    name: "Banco do Brasil",
    category: "Bancos",
    description: "Emissão de boletos e integração financeira.",
    svgPath: "/banks-svg/Banco do Brasil S.A/banco-do-brasil-com-fundo.svg",
    logoBg: "#FCE400",
  },
  {
    id: "santander",
    name: "Santander",
    category: "Bancos",
    description: "Conciliação de recebíveis e faturamento médico.",
    svgPath: "/banks-svg/Banco Santander Brasil S.A/santander-fundo-vermelho.svg",
    logoBg: "#EC0000",
  },
  {
    id: "caixa",
    name: "Caixa Econômica",
    category: "Bancos",
    description: "Extratos bancários e conciliação de faturamento.",
    svgPath: "/banks-svg/Caixa Econômica Federal/caixa-economica-federal-X.svg",
    logoBg: "#005CA9",
  },
  {
    id: "nubank",
    name: "Nubank",
    category: "Bancos",
    description: "Recebimento instantâneo via Pix com conciliação.",
    svgPath: "/banks-svg/Nu Pagamentos S.A/nubank-logo-fundo-roxo2021.svg",
    logoBg: "#820AD1",
  },
  {
    id: "inter",
    name: "Banco Inter",
    category: "Bancos",
    description: "Conta jurídica sem tarifas e conciliação.",
    svgPath: "/banks-svg/Banco Inter S.A/inter.svg",
    logoBg: "#FF7A00",
  },
  {
    id: "c6",
    name: "C6 Bank",
    category: "Bancos",
    description: "Sincronização bancária direta para contas PJ.",
    svgPath: "/banks-svg/Banco C6 S.A/c6 bank.svg",
    logoBg: "#1C1C1C",
  },
  {
    id: "btg",
    name: "BTG Pactual",
    category: "Bancos",
    description: "Gestão de caixa e investimentos corporativos.",
    svgPath: "/banks-svg/Banco BTG Pacutal/btg-pactual.svg",
    logoBg: "#001E3D",
  },
  {
    id: "cora",
    name: "Cora",
    category: "Bancos",
    description: "Gestão de cobranças e conta PJ digital.",
    svgPath: "/banks-svg/Cora Sociedade Credito Direto S.A/icone-cora-com-fundo-pequeno.svg",
    logoBg: "#FE3E6D",
  },
  {
    id: "sicoob",
    name: "Sicoob",
    category: "Bancos",
    description: "Cooperativismo financeiro e conciliação de recebíveis.",
    svgPath: "/banks-svg/Sicoob/sicoob-vector-logo.svg",
    logoBg: "#003641",
  },
  {
    id: "sicredi",
    name: "Sicredi",
    category: "Bancos",
    description: "Crédito corporativo e liquidação de consultas.",
    svgPath: "/banks-svg/Sicredi/logo-svg2.svg",
    logoBg: "#006633",
  },
];

export function SettingsPage({ initialTab = "conta" }: SettingsPageProps) {
  const { session } = useAuth();
  const { subscription } = useSubscription();

  const [activeTab, setActiveTab] = useState<"conta" | "plano" | "integracoes">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Estados: Dados da Conta
  const userEmail = session?.user?.email || "usuario@noto.com.br";
  const [userName, setUserName] = useState(session?.user?.user_metadata?.full_name || "Administrador da Clínica");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Estados: Configurações do Noto (Métodos de Aprovação)
  const [isNotoModalOpen, setIsNotoModalOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState<"manual" | "automatico">("manual");
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação de senha não confere.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveNotoSettings = () => {
    toast.success("Regras de emissão e métodos de aprovação do Noto atualizados!");
    setIsNotoModalOpen(false);
  };

  if (activeTab === "plano") {
    return <BillingPage />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full bg-background font-sans">
      {/* ── Sub-Header ── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs shrink-0 w-full">
        <div className="px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">Configurações</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="capitalize">
              {activeTab === "conta"
                ? "Dados da Conta"
                : "Integrações & Conectores"}
            </span>
          </div>

          {/* Abas Rápidas no Header */}
          <div className="flex items-center gap-1">
            <Button
              variant={activeTab === "conta" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("conta")}
              className={`h-7 text-xs rounded-none ${
                activeTab === "conta" ? "bg-[#B7F20B] text-black font-semibold" : ""
              }`}
            >
              <UserRound className="h-3 w-3 mr-1" />
              Conta
            </Button>
            <Button
              variant={activeTab === "plano" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("plano")}
              className="h-7 text-xs rounded-none"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Meu Plano
            </Button>
            <Button
              variant={activeTab === "integracoes" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("integracoes")}
              className={`h-7 text-xs rounded-none ${
                activeTab === "integracoes" ? "bg-[#B7F20B] text-black font-semibold" : ""
              }`}
            >
              <Webhook className="h-3 w-3 mr-1" />
              Integrações
            </Button>
          </div>
        </div>
      </div>

      {/* ── Conteúdo da Aba Ativa ── */}
      <main className="flex-1 overflow-y-auto py-6 space-y-6 w-full px-6">
        {/* ABA: DADOS DA CONTA */}
        {activeTab === "conta" && (
          <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Dados da Conta & Perfil</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gerencie as informações da sua conta, credenciais de acesso e preferências de segurança.
              </p>
            </div>

            {/* Card: Informações Básicas */}
            <div className="p-5 border border-border bg-card rounded-none space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <UserRound className="h-4 w-4 text-[#B7F20B]" />
                <h3 className="font-display font-semibold text-sm text-foreground">Informações de Acesso</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Nome da Conta / Clínica</Label>
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-9 text-xs rounded-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">E-mail Principal</Label>
                  <Input
                    value={userEmail}
                    disabled
                    className="h-9 text-xs rounded-none font-mono bg-muted/40 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Card: Alterar Senha */}
            <form onSubmit={handleUpdatePassword} className="p-5 border border-border bg-card rounded-none space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <KeyRound className="h-4 w-4 text-[#B7F20B]" />
                <h3 className="font-display font-semibold text-sm text-foreground">Alterar Senha</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Nova Senha</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-9 text-xs rounded-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Confirmar Nova Senha</Label>
                  <Input
                    type="password"
                    placeholder="Digite novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-9 text-xs rounded-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  size="sm"
                  className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none shadow-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  <span>{isUpdatingPassword ? "Atualizando..." : "Salvar Nova Senha"}</span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ABA: INTEGRAÇÕES */}
        {activeTab === "integracoes" && (
          <div className="space-y-6 animate-in fade-in duration-150 w-full">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Conectores & Integrações</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure o motor de emissão fiscal Noto, conciliações bancárias e integrações externas.
              </p>
            </div>

            {/* Grid em 4 Colunas Ocupando Toda a Tela */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {INTEGRATION_APPS.map((app) => (
                <div
                  key={app.id}
                  className={`p-4 border rounded-xl transition-all flex flex-col justify-between gap-3.5 ${
                    app.isActive
                      ? "border-[#B7F20B]/40 bg-[#B7F20B]/[0.02] shadow-2xs"
                      : "border-border bg-transparent hover:border-foreground/30"
                  }`}
                >
                  {/* Bloco Superior: Logo Oficial + Título + Descrição */}
                  <div className="flex items-start gap-3">
                    {/* Logo do App / Ícone padrão sem fundo */}
                    <div className="size-9 flex items-center justify-center shrink-0">
                      {app.svgPath ? (
                        <img
                          src={app.svgPath}
                          alt={app.name}
                          className="h-8 w-8 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        app.icon
                      )}
                    </div>

                    {/* Informações */}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-display font-bold text-sm text-foreground tracking-tight truncate">
                          {app.name}
                        </h3>
                        {app.isActive ? (
                          <span className="text-[10px] font-mono font-bold text-[#B7F20B] tracking-tight flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-[#B7F20B] animate-pulse" />
                            ativo
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-medium text-[#B7F20B] tracking-tight">
                            em breve
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  {/* Divisor Interno */}
                  <div className="border-t border-border/60" />

                  {/* Bloco Inferior: Botão Conexões + Settings + Switch Toggle */}
                  <div className="flex items-center justify-between">
                    {/* Botão de Conexões */}
                    <button
                      type="button"
                      onClick={() => {
                        if (app.id === "noto") {
                          setIsNotoModalOpen(true);
                        } else {
                          toast.info(`Integração com ${app.name} disponível em breve.`);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                        app.isActive
                          ? "border-[#B7F20B]/40 bg-[#B7F20B]/10 text-foreground hover:bg-[#B7F20B]/20 font-semibold"
                          : "border-border bg-transparent hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      <span>{app.isActive ? "Configurar" : "Conexões"}</span>
                    </button>

                    {/* Lado Direito: Engrenagem + Switch Toggle */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (app.id === "noto") {
                            setIsNotoModalOpen(true);
                          } else {
                            toast.info(`Configurações de ${app.name} em breve.`);
                          }
                        }}
                        title={app.isActive ? "Configurar métodos de aprovação" : "Configurações"}
                        className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <SettingsIcon className="h-3.5 w-3.5" />
                      </button>

                      {/* Bolinha de Ativar / Desativar */}
                      {app.isActive ? (
                        <div
                          title="Integração ativa"
                          className="w-8 h-4 rounded-full bg-[#B7F20B] relative flex items-center p-0.5 justify-end cursor-default shadow-xs"
                        >
                          <div className="size-3 rounded-full bg-black shadow-xs" />
                        </div>
                      ) : (
                        <div
                          title="Integração inativa (em breve)"
                          className="w-8 h-4 rounded-full bg-muted/90 border border-border/80 relative flex items-center p-0.5 cursor-not-allowed opacity-60"
                        >
                          <div className="size-3 rounded-full bg-muted-foreground/60 shadow-2xs" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Modal de Configuração do Motor Noto (Métodos de Aprovação & Emissão) ── */}
      <Dialog open={isNotoModalOpen} onOpenChange={setIsNotoModalOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-none border-border bg-card p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-[#B7F20B] text-black font-display font-black text-xs flex items-center justify-center">
                N
              </div>
              <DialogTitle className="font-display font-bold text-lg text-foreground">
                Configurações do Emissor Noto
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Defina as regras de aprovação e transmissão de NFS-e para os atendimentos da clínica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Opções de Fluxo de Emissão */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Método de Aprovação das Consultas</Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Manual */}
                <div
                  onClick={() => setApprovalMode("manual")}
                  className={`p-3.5 border-2 rounded-none cursor-pointer transition-all ${
                    approvalMode === "manual"
                      ? "border-[#B7F20B] bg-[#B7F20B]/5"
                      : "border-border bg-background hover:border-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#B7F20B]" />
                      Aprovação Manual
                    </span>
                    {approvalMode === "manual" && <Check className="h-3.5 w-3.5 text-[#B7F20B]" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                    Transmite para a prefeitura apenas após o clique explícito em &ldquo;Aprovar&rdquo;.
                  </p>
                </div>

                {/* Automático */}
                <div
                  onClick={() => setApprovalMode("automatico")}
                  className={`p-3.5 border-2 rounded-none cursor-pointer transition-all ${
                    approvalMode === "automatico"
                      ? "border-[#B7F20B] bg-[#B7F20B]/5"
                      : "border-border bg-background hover:border-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      Emissão Automática
                    </span>
                    {approvalMode === "automatico" && <Check className="h-3.5 w-3.5 text-[#B7F20B]" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                    Transmite a DPS imediatamente após cadastrar ou importar o atendimento.
                  </p>
                </div>
              </div>
            </div>

            {/* Notificações Pós-Emissão */}
            <div className="p-3.5 border border-border bg-background rounded-none space-y-2.5">
              <span className="font-display font-semibold text-xs text-foreground block">
                Notificações Automáticas aos Pacientes
              </span>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#B7F20B] rounded-none cursor-pointer"
                  />
                  <span>Enviar link da NFS-e via WhatsApp automaticamente</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#B7F20B] rounded-none cursor-pointer"
                  />
                  <span>Enviar XML e PDF da nota por e-mail</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNotoModalOpen(false)}
              className="h-8 text-xs rounded-none border-border"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveNotoSettings}
              size="sm"
              className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Salvar Preferências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
