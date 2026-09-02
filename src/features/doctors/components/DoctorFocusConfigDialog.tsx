import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  syncDoctorWithFocusNfe,
  validateAndUploadCertificate,
} from "../services/focusNfe.service";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Zap,
  Key,
  UploadCloud,
  FileCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Lock,
} from "lucide-react";
import type { Doctor } from "../types";

interface DoctorFocusConfigDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DoctorFocusConfigDialog({
  doctor,
  open,
  onOpenChange,
  onSuccess,
}: DoctorFocusConfigDialogProps) {
  // Etapa atual: 1 = Certificado Digital, 2 = Configuração Fiscal
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Estados do Passo 1 (Certificado)
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certBase64, setCertBase64] = useState<string>("");
  const [certPassword, setCertPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingCert, setIsValidatingCert] = useState(false);
  const [certValidationSuccess, setCertValidationSuccess] = useState<{
    valid: boolean;
    message: string;
    validoAte?: string;
  } | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do Passo 2 (Parâmetros Fiscais)
  const [ambiente, setAmbiente] = useState<"homologacao" | "producao">("homologacao");
  const [aliquotaIss, setAliquotaIss] = useState<string>("3.00");
  const [itemServico, setItemServico] = useState<string>("0401");
  const [regimeTributario, setRegimeTributario] = useState<string>("1");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (doctor) {
      setAmbiente(doctor.ambiente_nf || "homologacao");
      setAliquotaIss(String(doctor.aliquota_iss ?? "3.00"));
      setItemServico(doctor.item_lista_servico || "0401");
      setRegimeTributario(doctor.optante_simples_nacional ? "1" : "3");
      setInscricaoMunicipal(doctor.inscricao_municipal || "");
      setCurrentStep(1);
      setCertFile(null);
      setCertBase64("");
      setCertPassword("");
      setCertError(null);
      setCertValidationSuccess(null);
    }
  }, [doctor, open]);

  if (!doctor) return null;

  const isConnected = Boolean(doctor.focus_empresa_id || doctor.focus_token);

  // Leitura do arquivo .pfx / .p12 em Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pfx" && extension !== "p12") {
      toast.error("Formato inválido. Selecione um arquivo de certificado .pfx ou .p12");
      return;
    }

    setCertFile(file);
    setCertError(null);
    setCertValidationSuccess(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.split(";base64,")[1] || result;
      setCertBase64(base64Clean);
    };
    reader.readAsDataURL(file);
  };

  // Validação do Certificado Digital na Focus NF-e
  const handleValidateCertificate = async () => {
    if (!certBase64) {
      setCertError("Por favor, selecione o arquivo do certificado digital (.pfx ou .p12).");
      return;
    }
    if (!certPassword) {
      setCertError("Por favor, informe a senha do certificado digital.");
      return;
    }

    setIsValidatingCert(true);
    setCertError(null);
    setCertValidationSuccess(null);

    try {
      const res = await validateAndUploadCertificate(doctor, certBase64, certPassword);

      if (res.valid) {
        setCertValidationSuccess(res);
        toast.success(res.message);
        // Avança para a Etapa 2 após breve confirmação visual
        setTimeout(() => {
          setCurrentStep(2);
        }, 800);
      } else {
        setCertError(res.message || "Senha incorreta ou certificado inválido.");
        toast.error(res.message || "Erro ao validar certificado.");
      }
    } catch (err: any) {
      setCertError(err.message || "Falha na validação do certificado.");
      toast.error(err.message || "Falha na comunicação com a Focus NF-e.");
    } finally {
      setIsValidatingCert(false);
    }
  };

  // Salvar configurações fiscais (Passo 2)
  const handleSaveFiscalConfig = async () => {
    setIsSaving(true);
    try {
      const res = await syncDoctorWithFocusNfe(doctor, {
        ambiente,
        aliquotaIss: parseFloat(aliquotaIss) || 3.0,
        itemServico,
        regimeTributario: (parseInt(regimeTributario, 10) || 1) as 1 | 2 | 3 | 4,
        arquivoCertificadoBase64: certBase64 || undefined,
        senhaCertificado: certPassword || undefined,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Erro ao salvar parâmetros fiscais.");
      }
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-card rounded-none">
        {/* Cabeçalho */}
        <div className="p-6 pb-4 border-b border-border bg-muted/20">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#B7F20B]/10 border border-[#B7F20B]/30 rounded-none text-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <DialogTitle className="text-base font-display font-semibold">
                  Configuração de Notas Fiscais (NFS-e)
                </DialogTitle>
              </div>

              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 bg-[#B7F20B] text-black rounded-none">
                  <CheckCircle2 className="h-3 w-3" /> Focus Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground px-2 py-0.5 bg-muted rounded-none border border-border">
                  Pendente
                </span>
              )}
            </div>

            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Dr(a). <strong className="text-foreground">{doctor.nome_completo}</strong> • CNPJ:{" "}
              <span className="font-mono">{doctor.cnpj || "Não informado"}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Stepper / Indicador de Passos */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/40 font-mono text-xs">
            <div
              onClick={() => setCurrentStep(1)}
              className={`p-2 border flex items-center gap-2 cursor-pointer transition-colors ${
                currentStep === 1
                  ? "border-[#B7F20B] bg-[#B7F20B]/10 text-foreground font-semibold"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-none flex items-center justify-center text-[10px] ${
                  currentStep === 1
                    ? "bg-[#B7F20B] text-black font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <span className="truncate">Certificado Digital</span>
            </div>

            <div
              onClick={() => {
                if (certValidationSuccess || isConnected) setCurrentStep(2);
              }}
              className={`p-2 border flex items-center gap-2 transition-colors ${
                currentStep === 2
                  ? "border-[#B7F20B] bg-[#B7F20B]/10 text-foreground font-semibold cursor-pointer"
                  : certValidationSuccess || isConnected
                  ? "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground cursor-pointer"
                  : "border-border/30 bg-muted/10 text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-none flex items-center justify-center text-[10px] ${
                  currentStep === 2
                    ? "bg-[#B7F20B] text-black font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className="truncate">Parâmetros Fiscais</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════ ETAPA 1: CERTIFICADO DIGITAL ═══════════════════ */}
        {currentStep === 1 && (
          <div className="p-6 space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold font-display flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#B7F20B]" />
                Certificado Digital A1 (.PFX ou .P12)
              </h3>
              <p className="text-xs text-muted-foreground">
                Envie o arquivo do certificado digital e a senha para autenticação junto à prefeitura.
              </p>
            </div>

            {/* Dropzone / Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors rounded-none flex flex-col items-center justify-center gap-2 ${
                certFile
                  ? "border-[#B7F20B] bg-[#B7F20B]/5"
                  : "border-border hover:border-[#B7F20B]/60 bg-muted/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pfx,.p12"
                className="hidden"
                onChange={handleFileChange}
              />

              {certFile ? (
                <>
                  <FileCheck className="h-8 w-8 text-[#B7F20B]" />
                  <div className="text-xs font-semibold text-foreground font-mono">
                    {certFile.name}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {(certFile.size / 1024).toFixed(1)} KB • Clique para alterar arquivo
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <div className="text-xs font-medium text-foreground">
                    Clique para selecionar o certificado A1
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Formatos suportados: .pfx ou .p12
                  </span>
                </>
              )}
            </div>

            {/* Campo de Senha do Certificado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center justify-between">
                <span>Senha do Certificado Digital</span>
                <span className="text-[11px] text-muted-foreground">Obrigatória para validação</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={certPassword}
                  onChange={(e) => {
                    setCertPassword(e.target.value);
                    setCertError(null);
                  }}
                  placeholder="Digite a senha do certificado"
                  className="h-9 text-xs pr-9 rounded-none bg-background font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro de Validação */}
            {certError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2 rounded-none">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{certError}</span>
              </div>
            )}

            {/* Mensagem de Sucesso de Validação */}
            {certValidationSuccess && (
              <div className="p-3 bg-[#B7F20B]/10 border border-[#B7F20B]/40 text-foreground text-xs flex items-start gap-2 rounded-none">
                <CheckCircle2 className="h-4 w-4 text-[#B7F20B] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong>{certValidationSuccess.message}</strong>
                  {certValidationSuccess.validoAte && (
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Válido até: {certValidationSuccess.validoAte}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opção de Pular Certificado */}
            <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Sua prefeitura não exige certificado A1?</span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-[#B7F20B] hover:underline font-medium flex items-center gap-1"
              >
                <span>Pular para parâmetros fiscais</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ ETAPA 2: PARÂMETROS FISCAIS ═══════════════════ */}
        {currentStep === 2 && (
          <div className="p-6 space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold font-display flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#B7F20B]" />
                Parâmetros Fiscais da NFS-e
              </h3>
              <p className="text-xs text-muted-foreground">
                Configurações tributárias para a emissão automática de notas fiscais de consultas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ambiente */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Ambiente de Emissão</Label>
                <Select
                  value={ambiente}
                  onValueChange={(val: "homologacao" | "producao") => setAmbiente(val)}
                >
                  <SelectTrigger className="h-8 text-xs rounded-none bg-background border-border">
                    <SelectValue placeholder="Selecione o ambiente" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                    <SelectItem value="producao">Produção (Oficial)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Regime Tributário */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Regime Tributário</Label>
                <Select value={regimeTributario} onValueChange={setRegimeTributario}>
                  <SelectTrigger className="h-8 text-xs rounded-none bg-background border-border">
                    <SelectValue placeholder="Regime" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="1">1 - Simples Nacional</SelectItem>
                    <SelectItem value="4">4 - Simples Nacional (MEI)</SelectItem>
                    <SelectItem value="3">3 - Regime Normal (Lucro Presumido)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Alíquota de ISS */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Alíquota de ISS (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={aliquotaIss}
                  onChange={(e) => setAliquotaIss(e.target.value)}
                  className="h-8 text-xs font-mono rounded-none"
                  placeholder="3.00"
                />
              </div>

              {/* Inscrição Municipal */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Inscrição Municipal</Label>
                <Input
                  type="text"
                  value={inscricaoMunicipal}
                  onChange={(e) => setInscricaoMunicipal(e.target.value)}
                  className="h-8 text-xs font-mono rounded-none"
                  placeholder="Ex: 123456"
                />
              </div>
            </div>

            {/* Código de Serviço / Item Lista */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Item da Lista de Serviço (LC 116/03)</Label>
              <Select value={itemServico} onValueChange={setItemServico}>
                <SelectTrigger className="h-8 text-xs rounded-none bg-background border-border">
                  <SelectValue placeholder="Selecione o código" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="0401">04.01 - Medicina e Biomedicina</SelectItem>
                  <SelectItem value="0402">04.02 - Análises Clínicas e Patologia</SelectItem>
                  <SelectItem value="0403">04.03 - Hospitais, Clínicas e Laboratórios</SelectItem>
                  <SelectItem value="0408">04.08 - Terapia Ocupacional e Fisioterapia</SelectItem>
                  <SelectItem value="0416">04.16 - Psicologia e Psicanálise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Informações de Automação */}
            <div className="p-3 border border-border/80 bg-muted/20 text-xs text-muted-foreground space-y-1 rounded-none">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B7F20B]" />
                <span>Emissão Automatizada Ativa</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                As consultas com pagamento aprovado no Noto emitirão notas fiscais de serviço eletrônicas de forma instantânea.
              </p>
            </div>
          </div>
        )}

        {/* Rodapé e Botões */}
        <DialogFooter className="p-4 border-t border-border flex items-center justify-between sm:justify-between w-full bg-muted/10">
          {currentStep === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs rounded-none"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleValidateCertificate}
                disabled={isValidatingCert || !certBase64 || !certPassword}
                className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none"
              >
                {isValidatingCert ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Validando Certificado na Focus...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Validar Certificado e Avançar</span>
                    <ArrowRight className="h-3 w-3 ml-0.5" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="h-8 text-xs rounded-none gap-1.5"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Voltar ao Certificado</span>
              </Button>

              <Button
                type="button"
                onClick={handleSaveFiscalConfig}
                disabled={isSaving}
                className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Salvando Parâmetros Fiscais...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Salvar e Ativar NFS-e</span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
