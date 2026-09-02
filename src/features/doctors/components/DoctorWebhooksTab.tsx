import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Webhook,
  Plus,
  Trash2,
  RefreshCw,
  Radio,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  listFocusHooks,
  createFocusHook,
  deleteFocusHook,
  type FocusHook,
  type FocusEventType,
} from "../services/focusWebhook.service";
import type { Doctor } from "../types";

interface DoctorWebhooksTabProps {
  doctor: Doctor;
}

export function DoctorWebhooksTab({ doctor }: DoctorWebhooksTabProps) {
  const [hooks, setHooks] = useState<FocusHook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form de criação
  const [event, setEvent] = useState<FocusEventType>("nfse");
  const [url, setUrl] = useState(
    `${import.meta.env.VITE_SUPABASE_URL || "https://sua-url.supabase.co"}/functions/v1/focus-webhook`
  );
  const [authorization, setAuthorization] = useState("");

  const loadHooks = async () => {
    setIsLoading(true);
    try {
      const data = await listFocusHooks(doctor.focus_token || undefined);
      // Filtra os hooks deste médico/CNPJ se houver
      const cleanCnpj = doctor.cnpj ? doctor.cnpj.replace(/\D/g, "") : "";
      const filtered = cleanCnpj
        ? data.filter((h) => !h.cnpj || h.cnpj === cleanCnpj)
        : data;
      setHooks(filtered);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar gatilhos da Focus NF-e.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHooks();
  }, [doctor.id, doctor.focus_token]);

  const handleCreateHook = async () => {
    if (!url || !url.startsWith("http")) {
      toast.error("Informe uma URL válida (HTTP/HTTPS).");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createFocusHook({
        event,
        url,
        cnpj: doctor.cnpj || undefined,
        authorization: authorization || undefined,
        token: doctor.focus_token || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Gatilho cadastrado com sucesso!");
        setIsDialogOpen(false);
        setAuthorization("");
        loadHooks();
      } else {
        toast.error(res.error || "Erro ao cadastrar gatilho.");
      }
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar gatilho.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteHook = async (hookId: string) => {
    setDeletingId(hookId);
    try {
      const ok = await deleteFocusHook(hookId, doctor.focus_token || undefined);
      if (ok) {
        toast.success("Gatilho removido com sucesso!");
        setHooks((prev) => prev.filter((h) => h.id !== hookId));
      } else {
        toast.error("Não foi possível excluir o gatilho.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="border border-border bg-card p-5 rounded-none space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Webhook className="h-4 w-4 text-[#B7F20B]" />
              Gatilhos Webhook (Notificações em Tempo Real)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Receba atualizações automáticas de autorização, rejeição e emissão de NFS-e diretamente da Focus NF-e.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHooks}
              disabled={isLoading}
              className="h-8 text-xs rounded-none gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 text-xs rounded-none bg-[#B7F20B] text-black hover:bg-[#B7F20B]/90 font-semibold gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo Gatilho</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-none border-border bg-card">
                <DialogHeader>
                  <DialogTitle className="font-display font-semibold text-sm flex items-center gap-2">
                    <Radio className="h-4 w-4 text-[#B7F20B]" />
                    <span>Cadastrar Gatilho Webhook</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-sans">
                    A Focus NF-e fará requisições HTTP POST para esta URL sempre que o evento ocorrer.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Evento */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Evento a Monitorar *</Label>
                    <Select value={event} onValueChange={(v) => setEvent(v as FocusEventType)}>
                      <SelectTrigger className="h-8.5 text-xs rounded-none bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="nfse" className="text-xs">
                          nfse - Emissão de NFS-e Municipal
                        </SelectItem>
                        <SelectItem value="nfsen" className="text-xs">
                          nfsen - Emissão de NFS-e Nacional (SPED)
                        </SelectItem>
                        <SelectItem value="nfe" className="text-xs">
                          nfe - Emissão de NF-e (Produto)
                        </SelectItem>
                        <SelectItem value="nfsen_recebida" className="text-xs">
                          nfsen_recebida - NFS-e Nacional Recebida
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* URL */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">URL de Destino (Endpoint) *</Label>
                    <Input
                      type="url"
                      placeholder="https://seu-dominio.com/api/webhook"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-none"
                    />
                  </div>

                  {/* Authorization */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center justify-between">
                      <span>Token / Segredo de Autorização (Opcional)</span>
                      <span className="text-[10px] text-muted-foreground">Header Authorization</span>
                    </Label>
                    <Input
                      type="password"
                      placeholder="Bearer seu_segredo_ou_api_key"
                      value={authorization}
                      onChange={(e) => setAuthorization(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-none"
                    />
                  </div>
                </div>

                <DialogFooter className="border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-8 text-xs rounded-none"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={isCreating}
                    onClick={handleCreateHook}
                    className="h-8 text-xs rounded-none bg-[#B7F20B] text-black hover:bg-[#B7F20B]/90 font-semibold"
                  >
                    {isCreating ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
                      </span>
                    ) : (
                      "Criar Gatilho"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabela de Gatilhos Cadastrados */}
        <div className="border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="h-8 text-[11px] font-semibold text-muted-foreground uppercase pl-4">
                  ID
                </TableHead>
                <TableHead className="h-8 text-[11px] font-semibold text-muted-foreground uppercase">
                  Evento
                </TableHead>
                <TableHead className="h-8 text-[11px] font-semibold text-muted-foreground uppercase">
                  URL de Destino
                </TableHead>
                <TableHead className="h-8 text-[11px] font-semibold text-muted-foreground uppercase text-center">
                  CNPJ Vinculado
                </TableHead>
                <TableHead className="h-8 text-[11px] font-semibold text-muted-foreground uppercase text-right pr-4">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-[#B7F20B]" />
                    Carregando gatilhos...
                  </TableCell>
                </TableRow>
              ) : hooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground">
                    Nenhum gatilho webhook cadastrado para este médico. Clique em "Novo Gatilho" acima.
                  </TableCell>
                </TableRow>
              ) : (
                hooks.map((hook) => (
                  <TableRow key={hook.id} className="border-border hover:bg-muted/20">
                    <TableCell className="pl-4 py-2 font-mono text-xs text-muted-foreground">
                      #{hook.id}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="font-mono text-xs font-semibold text-[#B7F20B] px-1.5 py-0.5 bg-[#B7F20B]/10 border border-[#B7F20B]/20">
                        {hook.event}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 font-mono text-xs text-foreground max-w-xs truncate">
                      {hook.url}
                    </TableCell>
                    <TableCell className="text-center py-2 font-mono text-xs text-muted-foreground">
                      {hook.cnpj || doctor.cnpj || "Global"}
                    </TableCell>
                    <TableCell className="text-right pr-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === hook.id}
                        onClick={() => handleDeleteHook(hook.id)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-none"
                      >
                        {deletingId === hook.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
