import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  UserRound,
  ShieldCheck,
  Webhook,
  Receipt,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SubMenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
}

export interface SidebarSection {
  id: "dashboard" | "cadastros" | "notas" | "configuracoes";
  title: string;
  icon: React.ReactNode;
  defaultHref: string;
  items: SubMenuItem[];
}

interface AppSidebarProps {
  activePath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

// ─── Configuração das Seções e Submenus ───────────────────────────────────────

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />,
    defaultHref: "/dashboard",
    items: [], // Dashboard não possui segundo sidebar
  },
  {
    id: "cadastros",
    title: "Cadastros",
    icon: <FolderKanban className="h-5 w-5" strokeWidth={1.5} />,
    defaultHref: "/pacientes",
    items: [
      {
        title: "Pacientes",
        href: "/pacientes",
        icon: <Users className="h-4 w-4" strokeWidth={1.5} />,
        description: "Atendimentos, consultas e tomadores",
      },
      {
        title: "Médicos",
        href: "/medicos",
        icon: <Stethoscope className="h-4 w-4" strokeWidth={1.5} />,
        description: "Médicos cadastrados e emissores PJ",
      },
    ],
  },
  {
    id: "notas",
    title: "Notas Fiscais",
    icon: <Receipt className="h-5 w-5" strokeWidth={1.5} />,
    defaultHref: "/notas",
    items: [
      {
        title: "Notas",
        href: "/notas",
        icon: <FileText className="h-4 w-4" strokeWidth={1.5} />,
        description: "Histórico, emissão e XML/PDF de NFS-e",
      },
      {
        title: "Métricas",
        href: "/notas/metricas",
        icon: <BarChart3 className="h-4 w-4" strokeWidth={1.5} />,
        description: "Faturamento, tributos e aprovação",
      },
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    icon: <Settings className="h-5 w-5" strokeWidth={1.5} />,
    defaultHref: "/configuracoes/conta",
    items: [
      {
        title: "Dados da Conta",
        href: "/configuracoes/conta",
        icon: <UserRound className="h-4 w-4" strokeWidth={1.5} />,
        description: "Perfil, e-mail e segurança",
      },
      {
        title: "Meu Plano",
        href: "/planos",
        icon: <CreditCard className="h-4 w-4" strokeWidth={1.5} />,
        description: "Assinatura, faturas e limites de uso",
      },
      {
        title: "Integrações",
        href: "/configuracoes/integracoes",
        icon: <Webhook className="h-4 w-4" strokeWidth={1.5} />,
        description: "Conectores fiscais, bancários e automações",
      },
    ],
  },
];

// Helper para descobrir a seção atual pela rota ativa
function getSectionByPath(path: string): SidebarSection["id"] {
  if (path === "/medicos" || path === "/pacientes" || path === "/") {
    return "cadastros";
  }
  if (path.startsWith("/notas")) {
    return "notas";
  }
  if (path.startsWith("/configuracoes") || path === "/planos") {
    return "configuracoes";
  }
  if (path.startsWith("/dashboard")) {
    return "dashboard";
  }
  return "cadastros";
}

// ─── Componente Dual Sidebar ──────────────────────────────────────────────────

export function AppSidebar({
  activePath = "/pacientes",
  onNavigate,
  onLogout,
}: AppSidebarProps) {
  const currentSectionId = getSectionByPath(activePath);
  const [selectedSectionId, setSelectedSectionId] = useState<SidebarSection["id"]>(currentSectionId);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(true);

  // Sincroniza a seção selecionada quando a rota muda
  useEffect(() => {
    const sec = getSectionByPath(activePath);
    setSelectedSectionId(sec);
    if (sec === "dashboard") {
      setIsSubMenuOpen(false);
    } else {
      setIsSubMenuOpen(true);
    }
  }, [activePath]);

  const activeSection =
    SIDEBAR_SECTIONS.find((s) => s.id === selectedSectionId) || SIDEBAR_SECTIONS[1];

  const hasSubItems = activeSection.items.length > 0;

  const handleSectionClick = (section: SidebarSection) => {
    setSelectedSectionId(section.id);
    if (section.items.length === 0) {
      // Se a seção não tiver subitens (como Dashboard), fecha o submenu e navega direto
      setIsSubMenuOpen(false);
      onNavigate?.(section.defaultHref);
    } else {
      if (selectedSectionId === section.id) {
        // Se clicou na mesma seção, alterna visibilidade
        setIsSubMenuOpen((prev) => !prev);
      } else {
        setIsSubMenuOpen(true);
        onNavigate?.(section.defaultHref);
      }
    }
  };

  const handleSubItemClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    }
  };

  return (
    <aside className="hidden md:flex shrink-0 z-30 h-full select-none">
      {/* ═══════════════════════════════════════════════════════════════════════
          1. RAIL PRIMÁRIO (Ícones Verticais Estreito ~56px)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="w-14 border-r border-border bg-card flex flex-col items-center justify-between py-3 shrink-0">
        {/* Topo: Ícones de Navegação das Seções */}
        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          {SIDEBAR_SECTIONS.map((section) => {
            const isSectionActive = selectedSectionId === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section)}
                title={section.title}
                className={cn(
                  "relative flex items-center justify-center h-10 w-10 rounded-none transition-all cursor-pointer group",
                  isSectionActive
                    ? "bg-[#B7F20B] text-black shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {/* Indicador lateral quando ativo */}
                {isSectionActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-black" />
                )}
                {section.icon}
              </button>
            );
          })}
        </div>

        {/* Rodapé do Rail Primário: Toggle e Logout */}
        <div className="flex flex-col items-center gap-2 w-full px-2 border-t border-border pt-3">
          {/* Botão de Toggle do Submenu (apenas ativo se a seção tiver subitens) */}
          {hasSubItems && (
            <button
              type="button"
              onClick={() => setIsSubMenuOpen((prev) => !prev)}
              title={isSubMenuOpen ? "Recolher menu lateral" : "Expandir menu lateral"}
              className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-none transition-colors cursor-pointer"
            >
              {isSubMenuOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Botão Logout */}
          <button
            type="button"
            onClick={onLogout}
            title="Sair da conta"
            className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. RAIL SECUNDÁRIO (Submenu Flyout Panel ~220px)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isSubMenuOpen && hasSubItems && (
        <div
          className={cn(
            "w-56 border-r border-border bg-background flex flex-col shrink-0 animate-in fade-in-50 slide-in-from-left-2 duration-150"
          )}
        >
          {/* Cabeçalho da Seção Ativa */}
          <div className="px-4 h-12 border-b border-border flex items-center justify-between bg-muted/10">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="h-2 w-2 bg-[#B7F20B]" />
              {activeSection.title}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {activeSection.items.length} itens
            </span>
          </div>

          {/* Lista de Subitens */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeSection.items.map((item) => {
              const isItemActive =
                activePath === item.href ||
                (item.href === "/pacientes" && activePath === "/");

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleSubItemClick(e, item.href)}
                  className={cn(
                    "flex flex-col p-2.5 rounded-none transition-colors cursor-pointer group",
                    isItemActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "transition-colors",
                          isItemActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="text-xs font-display">{item.title}</span>
                    </div>

                    {isItemActive && (
                      <span className="h-2 w-2 rounded-full bg-[#B7F20B] shrink-0" />
                    )}
                  </div>

                  {item.description && (
                    <span className="text-[10px] text-muted-foreground font-normal mt-1 leading-tight line-clamp-1">
                      {item.description}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Rodapé Informativo do Submenu */}
          <div className="p-3 border-t border-border bg-muted/10 flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-[#B7F20B] shrink-0" />
            <span className="truncate">Ambiente Seguro & Sincronizado</span>
          </div>
        </div>
      )}
    </aside>
  );
}
