import { useState, useEffect } from "react";
import { PatientsTable } from "@/features/patients/components/PatientsTable";
import { DoctorFormDialog } from "@/features/doctors/components/DoctorFormDialog";
import { DoctorsPage } from "@/features/doctors/components/DoctorsPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { InvoicesPage } from "@/features/invoices/components/InvoicesPage";
import { InvoiceMetricsPage } from "@/features/invoices/components/InvoiceMetricsPage";
import { BillingPage } from "@/features/billing/components/BillingPage";
import { SettingsPage } from "@/features/settings/components/SettingsPage";
import { DoctorOnboardingWizard } from "@/features/doctor-onboarding/components/DoctorOnboardingWizard";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { authService } from "@/features/auth/services/auth.service";
import { SiteHeader } from "@/shared/components/site-header";
import { AppSidebar } from "@/shared/components/app-sidebar";
import { SimulationModeBanner } from "@/shared/components/SimulationModeBanner";
import { usePatients } from "@/features/patients/hooks/usePatients";
import { useSubscription } from "@/features/billing/hooks/useSubscription";
import { SubscriptionRequiredDialog } from "@/features/billing/components/SubscriptionRequiredDialog";

export function PatientsDashboardContent({ onOpenDoctorDialog }: { onOpenDoctorDialog: () => void }) {
  const patientState = usePatients();
  const { allPatients } = patientState;

  const totalPatients = allPatients.length;
  const approvedCount = allPatients.filter((p) => p.status === "Aprovado" || p.status === "Nota Gerada").length;
  const pendingCount = allPatients.filter((p) => p.status === "Pendente" || p.status === "Processando emissão").length;
  const errorCount = allPatients.filter((p) => p.status === "Erro na emissão").length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Barra de Sub-Header e Ações Rápidas */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs shrink-0">
        <div className="px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">Organização</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Pacientes & Atendimentos</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDoctorDialog}
              className="h-8 text-xs rounded-none border-border hover:bg-accent font-medium gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Novo Médico</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal Scrollável */}
      <main className="flex-1 overflow-y-auto space-y-6 w-full">
        {/* Cabeçalho da Página e Métricas com padding px-6 */}
        <div className="px-6 pt-6 space-y-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
              Pacientes & Faturamento
            </h1>
            <p className="text-sm text-muted-foreground font-sans">
              Gerencie o fluxo de consultas, aprovação de pagamentos e emissão automatizada de NFSe via Focus NFe.
            </p>
          </div>

          {/* Grid de Métricas / Cards no estilo Supabase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground font-display">Total de Pacientes</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-display font-semibold text-foreground tracking-tight">
                  {totalPatients}
                </span>
                <span className="text-[11px] text-muted-foreground">cadastrados</span>
              </div>
            </div>

            <div className="p-4 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground font-display">Pagos / Concluídos</span>
                <CheckCircle2 className="h-4 w-4 text-[#B7F20B]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-display font-semibold text-[#B7F20B] tracking-tight">
                  {approvedCount}
                </span>
                <span className="text-[11px] text-muted-foreground">consultas</span>
              </div>
            </div>

            <div className="p-4 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground font-display">Pendentes</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-display font-semibold text-amber-600 dark:text-amber-400 tracking-tight">
                  {pendingCount}
                </span>
                <span className="text-[11px] text-muted-foreground">aguardando ação</span>
              </div>
            </div>

            <div className="p-4 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground font-display">Erros de Emissão</span>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-display font-semibold text-destructive tracking-tight">
                  {errorCount}
                </span>
                <span className="text-[11px] text-muted-foreground">necessitam revisão</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Pacientes Edge-to-Edge (100% de largura) */}
        <div className="w-full pb-8">
          <PatientsTable patientState={patientState} />
        </div>
      </main>
    </div>
  );
}

function App() {
  const { session, loading } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<"doctor" | "patient" | "invoice" | "general">("doctor");

  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      const search = window.location.search;
      if (
        hash === "#onboarding-medico" ||
        hash === "#medico" ||
        path === "/onboarding-medico" ||
        path === "/medico" ||
        path === "/comecar" ||
        search.includes("origem=vendas") ||
        search.includes("ref=sales") ||
        search.includes("medico")
      ) {
        setCurrentPath("/onboarding-medico");
      }
    };
    checkRoute();
    window.addEventListener("hashchange", checkRoute);
    return () => window.removeEventListener("hashchange", checkRoute);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenDoctorCreation = () => {
    if (!hasActiveSubscription) {
      setPaywallAction("doctor");
      setIsPaywallOpen(true);
      return;
    }
    setIsDoctorFormOpen(true);
  };

  const handleDoctorCreated = () => {
    // Atualização realtime
  };

  // Fluxo Imersivo de Onboarding do Médico (quando vem da página de vendas, sem exigir login da secretária)
  if (
    currentPath === "/onboarding-medico" ||
    currentPath === "/medico" ||
    currentPath === "/comecar"
  ) {
    return (
      <>
        <DoctorOnboardingWizard
          onExit={() => setCurrentPath("/")}
          onFinish={() => setCurrentPath("/pacientes")}
        />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-sm text-muted-foreground">
        Carregando sistema...
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LoginForm />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  const isDashboardPage = currentPath === "/dashboard" || currentPath === "/dashboard/metricas";
  const isDoctorsPage = currentPath === "/medicos";
  const isInvoicesPage = currentPath === "/notas" || currentPath === "/notas/requisicoes";
  const isInvoiceMetricsPage = currentPath === "/notas/metricas";
  const isBillingPage = currentPath === "/planos" || currentPath === "/configuracoes/plano";
  const isSettingsPage = currentPath.startsWith("/configuracoes") && currentPath !== "/configuracoes/plano";

  let pageTitle = "Pacientes";
  if (isDashboardPage) pageTitle = "Dashboard";
  if (isDoctorsPage) pageTitle = "Médicos";
  if (isInvoicesPage) pageTitle = "Notas Fiscais - Requisições";
  if (isInvoiceMetricsPage) pageTitle = "Notas Fiscais - Métricas";
  if (isBillingPage) pageTitle = "Planos & Cobrança";
  if (isSettingsPage) pageTitle = "Configurações";

  let settingsTab: "conta" | "plano" | "integracoes" = "conta";
  if (currentPath === "/configuracoes/integracoes" || currentPath === "/configuracoes/aprovacao") {
    settingsTab = "integracoes";
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden font-sans">
      {/* Banner de Modo Simulação / Sem Plano Ativo (100% largura) */}
      <SimulationModeBanner onUpgradeClick={() => setCurrentPath("/planos")} />

      {/* Header fixo no topo */}
      <SiteHeader pageTitle={pageTitle} onLogout={handleLogout} onNavigate={(path) => setCurrentPath(path)} />

      {/* Linha: Dual Sidebar + Conteúdo Principal */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          activePath={currentPath}
          onNavigate={(path) => setCurrentPath(path)}
          onLogout={handleLogout}
        />

        {isDashboardPage ? (
          <DashboardPage
            onNavigateToPatients={() => setCurrentPath("/pacientes")}
            onNavigateToDoctors={() => setCurrentPath("/medicos")}
          />
        ) : isDoctorsPage ? (
          <DoctorsPage
            onNavigateToPatients={() => setCurrentPath("/pacientes")}
          />
        ) : isInvoiceMetricsPage ? (
          <InvoiceMetricsPage />
        ) : isInvoicesPage ? (
          <InvoicesPage />
        ) : isBillingPage ? (
          <BillingPage />
        ) : isSettingsPage ? (
          <SettingsPage initialTab={settingsTab} />
        ) : (
          <PatientsDashboardContent
            onOpenDoctorDialog={handleOpenDoctorCreation}
          />
        )}
      </div>

      <DoctorFormDialog
        open={isDoctorFormOpen}
        onOpenChange={setIsDoctorFormOpen}
        onSuccess={handleDoctorCreated}
        onNavigateToPatients={() => setCurrentPath("/pacientes")}
      />

      {/* Dialog de Trava / Paywall em Etapas com Cadeados */}
      <SubscriptionRequiredDialog
        open={isPaywallOpen}
        onOpenChange={setIsPaywallOpen}
        actionBlocked={paywallAction}
        onUpgradeClick={() => setCurrentPath("/planos")}
      />

      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
