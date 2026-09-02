import { useState } from "react";
import { DoctorsTable } from "./DoctorsTable";
import { DoctorFormDialog } from "./DoctorFormDialog";
import { DoctorSettingsPage } from "./DoctorSettingsPage";
import { useDoctors } from "../hooks/useDoctors";
import { Button } from "@/components/ui/button";
import { Stethoscope, UserPlus, Users, Building2, CheckCircle2 } from "lucide-react";
import type { Doctor } from "../types";

interface DoctorsPageProps {
  onNavigateToPatients?: () => void;
}

export function DoctorsPage({ onNavigateToPatients }: DoctorsPageProps) {
  const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false);
  const [selectedDoctorForSettings, setSelectedDoctorForSettings] = useState<Doctor | null>(null);
  const { allDoctors } = useDoctors();

  const totalDoctors = allDoctors.length;
  const activeDoctors = allDoctors.filter((d) => d.status === "Ativo").length;
  const totalPatientsServed = allDoctors.reduce((acc, d) => acc + (d.total_pacientes || 0), 0);
  const uniqueSpecialties = new Set(allDoctors.map((d) => d.especialidade).filter(Boolean)).size;

  const handleDoctorCreated = () => {
    // Atualização já tratada via Supabase Realtime
  };

  // Se houver um médico selecionado para configuração detalhada, sincroniza com allDoctors mais recente
  const currentDoctor = selectedDoctorForSettings
    ? allDoctors.find((d) => d.id === selectedDoctorForSettings.id) || selectedDoctorForSettings
    : null;

  if (currentDoctor) {
    return (
      <DoctorSettingsPage
        doctor={currentDoctor}
        onBack={() => setSelectedDoctorForSettings(null)}
        onUpdateSuccess={(updatedDoc) => {
          setSelectedDoctorForSettings(updatedDoc);
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full">
      {/* Barra de Sub-Header e Ações Rápidas */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs shrink-0 w-full">
        <div className="px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">Organização</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Corpo Clínico</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDoctorFormOpen(true)}
              className="h-7 text-xs rounded-none border-border hover:bg-accent font-medium gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Novo Médico</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal Scrollável */}
      <main className="flex-1 overflow-y-auto py-5 space-y-5 w-full">
        {/* Cabeçalho da Página */}
        <div className="px-6 flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
            Médicos & Corpo Clínico
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Gerencie os médicos cadastrados, especialidades, dados fiscais de CNPJ e vínculos de pacientes.
          </p>
        </div>

        {/* Grid de Métricas / Cards no estilo Supabase */}
        <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Total de Médicos</span>
              <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-foreground tracking-tight">
                {totalDoctors}
              </span>
              <span className="text-[11px] text-muted-foreground">profissionais</span>
            </div>
          </div>

          <div className="p-3.5 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Médicos Ativos</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#B7F20B]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-[#B7F20B] tracking-tight">
                {activeDoctors}
              </span>
              <span className="text-[11px] text-muted-foreground">ativos</span>
            </div>
          </div>

          <div className="p-3.5 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Especialidades</span>
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-foreground tracking-tight">
                {uniqueSpecialties}
              </span>
              <span className="text-[11px] text-muted-foreground">áreas médicas</span>
            </div>
          </div>

          <div className="p-3.5 rounded-none border border-border bg-card hover:border-border/80 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Pacientes Vinculados</span>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-foreground tracking-tight">
                {totalPatientsServed}
              </span>
              <span className="text-[11px] text-muted-foreground">atendimentos</span>
            </div>
          </div>
        </div>

        {/* Tabela de Médicos - 100% Width Edge-to-Edge */}
        <div className="w-full pt-1">
          <DoctorsTable
            onOpenNewDoctor={() => setIsDoctorFormOpen(true)}
            onOpenDoctorSettings={(doc) => setSelectedDoctorForSettings(doc)}
          />
        </div>
      </main>

      {/* Dialog de Cadastro */}
      <DoctorFormDialog
        open={isDoctorFormOpen}
        onOpenChange={setIsDoctorFormOpen}
        onSuccess={handleDoctorCreated}
        onNavigateToPatients={onNavigateToPatients}
        onNavigateToInvoices={(createdDoc) => {
          setSelectedDoctorForSettings(createdDoc || null);
        }}
      />
    </div>
  );
}
