import { useState } from "react";
import { Search, CircleHelp, ChevronRight, UserRound, X, Bug, Plug, Sun, Moon } from "lucide-react";
import { Logo } from "@/shared/components/Logo";
import { cn } from "@/lib/utils";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";
import { useTheme } from "@/shared/hooks/useTheme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SiteHeaderProps {
  /** Título da página atual exibido no breadcrumb */
  pageTitle?: string;
  /** Callback disparado ao clicar no botão de logout (avatar) */
  onLogout?: () => void;
}

export function SiteHeader({ pageTitle = "Pacientes", onLogout }: SiteHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugDescription, setBugDescription] = useState("");
  const [isSendingBug, setIsSendingBug] = useState(false);

  // Hook de controle de tema Black / White
  const { toggleTheme, isDark } = useTheme();

  // Busca a lista de médicos para exibir os avatares no header e alimentar a busca inteligente
  const { allDoctors } = useDoctors();

  const isProducao = allDoctors.length > 0 && allDoctors.some((d) => d.ambiente_nf === "producao");

  const MAX_VISIBLE_AVATARS = 7;
  const visibleDoctors = allDoctors.slice(0, MAX_VISIBLE_AVATARS);
  const extraCount = allDoctors.length > MAX_VISIBLE_AVATARS ? allDoctors.length - MAX_VISIBLE_AVATARS : 0;

  // Busca médico correspondente ao texto digitado
  const cleanQuery = searchQuery.trim().toLowerCase();
  const matchedDoctor = cleanQuery.length >= 2
    ? allDoctors.find(
        (d) =>
          d.nome_completo.toLowerCase().includes(cleanQuery) ||
          (d.nome_fantasia && d.nome_fantasia.toLowerCase().includes(cleanQuery)) ||
          (d.crm && d.crm.toLowerCase().includes(cleanQuery))
      )
    : null;

  const handleSendBugReport = () => {
    if (!bugDescription.trim()) {
      toast.error("Por favor, descreva o erro encontrado.");
      return;
    }
    setIsSendingBug(true);
    setTimeout(() => {
      setIsSendingBug(false);
      setBugModalOpen(false);
      setBugDescription("");
      toast.success("Relatório de erro enviado com sucesso! Nossa equipe técnica já foi notificada.");
    }, 600);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <header className="hidden md:flex h-11 md:h-12 items-center shrink-0 border-b bg-background">
        <div className="flex items-center justify-between h-full pr-3 flex-1 overflow-x-auto gap-x-8 pl-4">

          {/* LEFT — Logo + Breadcrumb */}
          <div className="hidden md:flex items-center text-sm gap-0">
            {/* Logo Dinâmica */}
            <a
              href="/"
              className="flex items-center justify-center shrink-0 mr-2"
              aria-label="Voltar para a home"
            >
              <Logo className="h-[18px] w-auto" />
            </a>

            {/* Separador chevron */}
            <span className="text-muted-foreground/50 pr-2 flex items-center">
              <ChevronRight size={14} strokeWidth={1} />
            </span>

            {/* Título da página */}
            <span className="text-foreground font-medium">{pageTitle}</span>

            {/* Tag de ambiente (Simulação vs Conectado) ao lado de Notas Fiscais */}
            {pageTitle === "Notas Fiscais" && (
              isProducao ? (
                <span
                  className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  style={{ borderRadius: "100px" }}
                >
                  <Plug className="h-3 w-3" />
                  <span>Conectado</span>
                </span>
              ) : (
                <span
                  className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                  style={{ borderRadius: "100px" }}
                >
                  <span>Simulação</span>
                </span>
              )
            )}
          </div>

          {/* RIGHT — Ações */}
          <div className="flex items-center gap-1.5 md:gap-2.5">

            {/* Avatares dos Perfis (Até 7 visíveis + bolinha preta com +X) com Tooltip */}
            {allDoctors.length > 0 && (
              <div className="flex items-center -space-x-1.5 mr-1">
                {visibleDoctors.map((doc) => {
                  const initials = doc.nome_completo
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <Tooltip key={doc.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative inline-block h-6 w-6 rounded-full ring-2 ring-background overflow-hidden shrink-0 bg-muted cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                          style={{ borderRadius: "100%" }}
                        >
                          {doc.foto_perfil ? (
                            <img
                              src={doc.foto_perfil}
                              alt={doc.nome_completo}
                              className="h-full w-full object-cover"
                              style={{ borderRadius: "100%" }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className="h-full w-full flex items-center justify-center text-[9px] font-bold text-foreground bg-muted"
                              style={{ borderRadius: "100%" }}
                            >
                              {initials || "DR"}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[11px] font-medium py-1 px-2">
                        <span>Dr(a). {doc.nome_completo}</span>
                        {doc.especialidade && (
                          <span className="text-muted-foreground text-[10px] block">
                            {doc.especialidade}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Bolinha preta com +X caso ultrapasse 7 médicos */}
                {extraCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="relative inline-flex items-center justify-center h-6 w-6 rounded-full bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold ring-2 ring-background shrink-0 cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                        style={{ borderRadius: "100%" }}
                      >
                        +{extraCount}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] font-medium py-1 px-2">
                      <span>+{extraCount} outros médicos cadastrados</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Botão Feedback com Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toast.info("Obrigado pelo seu feedback! Em breve novidades no portal.")}
                  className={cn(
                    "relative inline-flex items-center justify-center cursor-pointer",
                    "text-center text-xs font-normal",
                    "ease-out duration-200 transition-colors",
                    "border border-transparent hover:bg-accent hover:text-foreground",
                    "text-muted-foreground rounded-full h-[30px] px-2.5 py-1",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <span className="truncate">Feedback</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] py-1 px-2">
                Enviar sugestão ou feedback
              </TooltipContent>
            </Tooltip>

            {/* Search pill com Substituição da Lupa pela Foto do Médico */}
            <div className="flex items-center">
              {searchOpen ? (
                <div className="flex items-center gap-1.5 border border-input rounded-full h-[30px] px-2 bg-popover min-w-[200px] xl:min-w-[240px] transition-all">
                  {/* ÍCONE: Foto do médico encontrado OU Lupa padrão */}
                  {matchedDoctor ? (
                    matchedDoctor.foto_perfil ? (
                      <img
                        src={matchedDoctor.foto_perfil}
                        alt={matchedDoctor.nome_completo}
                        title={`Encontrado: Dr(a). ${matchedDoctor.nome_completo}`}
                        className="rounded-full object-cover shrink-0 ring-1 ring-[#B7F20B] animate-in zoom-in-75 duration-150"
                        style={{
                          width: "16px",
                          height: "16px",
                          minWidth: "16px",
                          minHeight: "16px",
                          maxWidth: "16px",
                          maxHeight: "16px",
                          borderRadius: "100%",
                        }}
                      />
                    ) : (
                      <div
                        title={`Encontrado: Dr(a). ${matchedDoctor.nome_completo}`}
                        className="rounded-full bg-[#B7F20B]/20 text-foreground flex items-center justify-center text-[9px] font-bold shrink-0 ring-1 ring-[#B7F20B] animate-in zoom-in-75 duration-150"
                        style={{
                          width: "16px",
                          height: "16px",
                          minWidth: "16px",
                          minHeight: "16px",
                          maxWidth: "16px",
                          maxHeight: "16px",
                          borderRadius: "100%",
                        }}
                      >
                        {matchedDoctor.nome_completo.slice(0, 2).toUpperCase()}
                      </div>
                    )
                  ) : (
                    <Search size={14} className="text-muted-foreground shrink-0" strokeWidth={1.5} />
                  )}

                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar médico ou paciente..."
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                    onBlur={() => {
                      if (!searchQuery) {
                        setSearchOpen(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    aria-label="Fechar pesquisa"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className={cn(
                        "px-3 py-1 whitespace-nowrap text-sm",
                        "cursor-pointer h-[30px] pl-2 pr-2 items-center justify-between",
                        "bg-transparent text-muted-foreground",
                        "border border-input hover:bg-popover hover:border-border",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "transition-colors hidden md:flex md:min-w-[140px] xl:min-w-[180px]",
                        "rounded-full gap-2",
                      )}
                      aria-label="Abrir pesquisa"
                    >
                      <div className="flex items-center space-x-1.5 text-muted-foreground">
                        {matchedDoctor ? (
                          matchedDoctor.foto_perfil ? (
                            <img
                              src={matchedDoctor.foto_perfil}
                              alt={matchedDoctor.nome_completo}
                              className="rounded-full object-cover shrink-0 ring-1 ring-[#B7F20B]"
                              style={{
                                width: "16px",
                                height: "16px",
                                minWidth: "16px",
                                minHeight: "16px",
                                maxWidth: "16px",
                                maxHeight: "16px",
                                borderRadius: "100%",
                              }}
                            />
                          ) : (
                            <div
                              className="rounded-full bg-[#B7F20B]/20 text-foreground flex items-center justify-center text-[9px] font-bold shrink-0 ring-1 ring-[#B7F20B]"
                              style={{
                                width: "16px",
                                height: "16px",
                                minWidth: "16px",
                                minHeight: "16px",
                                maxWidth: "16px",
                                maxHeight: "16px",
                                borderRadius: "100%",
                              }}
                            >
                              {matchedDoctor.nome_completo.slice(0, 2).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <Search size={14} strokeWidth={1.5} className="shrink-0" />
                        )}
                        <p className="flex text-xs text-muted-foreground/70">
                          {matchedDoctor ? matchedDoctor.nome_completo : "Pesquisar..."}
                        </p>
                      </div>
                      <span aria-hidden="true">
                        <span className="whitespace-nowrap shrink-0 items-center text-[11px] leading-none tracking-tight rounded px-[5px] py-[3px] hidden md:inline-flex h-full border border-border bg-muted text-muted-foreground shadow-sm">
                          Ctrl K
                        </span>
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px] py-1 px-2">
                    Buscar pacientes e médicos (Ctrl + K)
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Botão de Erro / Baratinha (Bug Report) com Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setBugModalOpen(true)}
                  aria-label="Reportar um erro"
                  className={cn(
                    "cursor-pointer text-xs rounded-full w-[30px] h-[30px]",
                    "flex items-center justify-center p-0 group",
                    "bg-transparent border border-input",
                    "hover:border-destructive hover:bg-destructive/10 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <Bug
                    size={15}
                    strokeWidth={1.5}
                    className="text-muted-foreground group-hover:text-destructive transition-colors"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] py-1 px-2">
                Reportar um erro no sistema
              </TooltipContent>
            </Tooltip>

            {/* Botão Help com Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Ajuda"
                  className={cn(
                    "cursor-pointer text-xs rounded-full w-[30px] h-[30px]",
                    "flex items-center justify-center p-0 group",
                    "bg-transparent border border-input",
                    "hover:border-foreground/30 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <CircleHelp
                    size={15}
                    strokeWidth={1.5}
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] py-1 px-2">
                Central de ajuda e suporte
              </TooltipContent>
            </Tooltip>

            {/* Alternador de Tema Black / White com Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Alternar tema"
                  className={cn(
                    "cursor-pointer text-xs rounded-full w-[30px] h-[30px]",
                    "flex items-center justify-center p-0 group",
                    "bg-transparent border border-input",
                    "hover:border-foreground/30 hover:bg-popover transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  {isDark ? (
                    <Sun
                      size={15}
                      strokeWidth={1.5}
                      className="text-[#B7F20B] group-hover:rotate-45 transition-transform"
                    />
                  ) : (
                    <Moon
                      size={15}
                      strokeWidth={1.5}
                      className="text-foreground group-hover:-rotate-12 transition-transform"
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] py-1 px-2">
                {isDark ? "Mudar para Modo White (Claro)" : "Mudar para Modo Black (Escuro)"}
              </TooltipContent>
            </Tooltip>

            {/* Avatar / User com Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Menu do usuário"
                  className={cn(
                    "relative items-center justify-center cursor-pointer",
                    "text-xs border shrink-0 hidden md:flex",
                    "rounded-full overflow-hidden h-[30px] w-[30px] p-0",
                    "bg-background border-input",
                    "hover:border-foreground/30 hover:bg-popover",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <figure className="bg-foreground flex items-center justify-center w-full h-full">
                    <UserRound
                      size={16}
                      strokeWidth={1.5}
                      className="text-background"
                    />
                  </figure>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px] py-1 px-2">
                Minha conta e sair
              </TooltipContent>
            </Tooltip>

          </div>
        </div>
      </header>

      {/* Modal para Reportar Erro (Bug Report) */}
      <Dialog open={bugModalOpen} onOpenChange={setBugModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-none border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-sm">
              <Bug className="h-4 w-4 text-destructive" />
              <span>Reportar um Erro</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Encontrou algo fora do esperado? Descreva o problema abaixo para nossa equipe resolver.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Textarea
              placeholder="Descreva o que aconteceu, qual ação tentou realizar..."
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              className="h-28 text-xs rounded-none bg-background resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBugModalOpen(false)}
              className="h-8 text-xs rounded-none"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSendBugReport}
              disabled={isSendingBug}
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none gap-1.5"
            >
              {isSendingBug ? "Enviando..." : "Enviar Relatório"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
