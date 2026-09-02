import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  Users,
  Loader2,
  FileCheck,
  Check,
  Stethoscope,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";
import {
  parsePatientsCsv,
  downloadSampleCsv,
  type ParsedCsvPatient,
  type CsvParseResult,
} from "../services/csvParser.service";
import { createPatientsBatch } from "../patients.repository";
import { formatCurrency } from "@/shared/utils";

interface ImportPatientsCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type StepKey = 1 | 2 | 3;

export function ImportPatientsCsvDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportPatientsCsvDialogProps) {
  const { allDoctors } = useDoctors();

  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializa o primeiro médico disponível se ainda não selecionado
  const activeDoctor =
    allDoctors.find((d) => d.id === selectedDoctorId) || allDoctors[0];

  const handleReset = () => {
    setCurrentStep(1);
    setFile(null);
    setParseResult(null);
    setIsParsing(false);
    setIsSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const processCsvFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".txt")) {
      toast.error("Por favor, selecione um arquivo no formato .csv ou .txt delimitado.");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const result = parsePatientsCsv(text);

        if (result.totalCount === 0) {
          toast.error("O arquivo CSV está vazio ou não contém dados legíveis.");
          setParseResult(null);
          return;
        }

        setParseResult(result);
        toast.success(
          `${result.validCount} paciente(s) extraído(s) com sucesso do arquivo!`
        );
      } catch (err: any) {
        console.error("Erro ao analisar CSV:", err);
        toast.error("Não foi possível processar o arquivo CSV.");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(selectedFile, "UTF-8");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processCsvFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processCsvFile(f);
  };

  const handleProceedToReview = () => {
    const doctorId = selectedDoctorId || activeDoctor?.id;
    if (!doctorId) {
      toast.error("Selecione o médico responsável pelos atendimentos.");
      return;
    }
    if (!parseResult || parseResult.validCount === 0) {
      toast.error("Selecione um arquivo CSV válido contendo pacientes.");
      return;
    }
    setCurrentStep(3);
  };

  const handleSaveImport = async () => {
    const doctorId = selectedDoctorId || activeDoctor?.id;
    if (!doctorId) {
      toast.error("Médico responsável não selecionado.");
      return;
    }

    if (!parseResult || parseResult.validCount === 0) {
      toast.error("Nenhum paciente válido para importar.");
      return;
    }

    setIsSaving(true);
    try {
      const validPatients = parseResult.patients.filter((p) => p.valido);

      const batchPayload = validPatients.map((p) => ({
        medicoId: doctorId,
        nome_completo: p.nome_completo,
        email: p.email,
        cpf: p.cpf,
        telefone: p.telefone,
        valor_consulta: p.valor_consulta,
        data_consulta: p.data_consulta,
      }));

      const { insertedCount } = await createPatientsBatch(batchPayload);

      toast.success(
        `Importação concluída! ${insertedCount} pacientes vinculados ao Dr(a). ${
          activeDoctor?.nome_completo || "selecionado"
        }.`
      );

      handleClose(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Erro na importação em lote:", err);
      toast.error(err.message || "Erro ao salvar pacientes no sistema.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[840px] max-h-[90vh] overflow-hidden p-0 gap-0 border-border bg-card rounded-none flex flex-col">
        {/* Cabeçalho do Dialog */}
        <div className="px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B7F20B]">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Importação em Massa</span>
            </div>
            <DialogTitle className="text-lg font-display font-semibold text-foreground">
              Importar Pacientes via Arquivo CSV
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Carregue uma planilha com a lista de atendimentos e consultas para criar os registros de forma automatizada.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Corpo: Layout com Abas Verticais à Esquerda e Conteúdo à Direita */}
        <div className="flex flex-1 overflow-hidden min-h-[420px]">
          {/* ─── ABAS VERTICAIS À ESQUERDA ─── */}
          <div className="w-64 border-r border-border bg-muted/10 p-3 space-y-1.5 shrink-0 select-none">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`w-full text-left p-3 rounded-none flex items-start gap-3 transition-all cursor-pointer ${
                currentStep === 1
                  ? "bg-background border border-border shadow-2xs font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              }`}
            >
              <div
                className={`p-1.5 rounded-none shrink-0 ${
                  currentStep === 1
                    ? "bg-[#B7F20B] text-black"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Info className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs block font-display">1. Como Funciona</span>
                <span className="text-[10px] text-muted-foreground block leading-tight font-normal">
                  Padrão e modelo de planilha
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`w-full text-left p-3 rounded-none flex items-start gap-3 transition-all cursor-pointer ${
                currentStep === 2
                  ? "bg-background border border-border shadow-2xs font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              }`}
            >
              <div
                className={`p-1.5 rounded-none shrink-0 ${
                  currentStep === 2
                    ? "bg-[#B7F20B] text-black"
                    : file
                    ? "bg-emerald-500/20 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs block font-display">2. Subir CSV & Médico</span>
                <span className="text-[10px] text-muted-foreground block leading-tight font-normal">
                  Upload e vinculação médica
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (parseResult && parseResult.validCount > 0) setCurrentStep(3);
              }}
              disabled={!parseResult || parseResult.validCount === 0}
              className={`w-full text-left p-3 rounded-none flex items-start gap-3 transition-all ${
                !parseResult || parseResult.validCount === 0
                  ? "opacity-50 cursor-not-allowed border border-transparent"
                  : currentStep === 3
                  ? "bg-background border border-border shadow-2xs font-semibold text-foreground cursor-pointer"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent cursor-pointer"
              }`}
            >
              <div
                className={`p-1.5 rounded-none shrink-0 ${
                  currentStep === 3
                    ? "bg-[#B7F20B] text-black"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs block font-display">3. Revisão & Salvar</span>
                <span className="text-[10px] text-muted-foreground block leading-tight font-normal">
                  {parseResult
                    ? `${parseResult.validCount} pacientes encontrados`
                    : "Conferência final"}
                </span>
              </div>
            </button>

            {/* Box Informativo no rodapé da coluna de passos */}
            <div className="p-3 border border-border/60 bg-muted/20 mt-6 space-y-1.5 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground block">Formato Suportado:</span>
              <p className="leading-tight">Arquivos .csv exportados do Excel, Google Sheets, Prontuários ou ERPs.</p>
            </div>
          </div>

          {/* ─── CONTEÚDO DA ETAPA ATIVA (DIREITA) ─── */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* ETAPA 1: VISÃO GERAL & DOWNLOAD DO MODELO */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-sm font-display font-bold text-foreground">
                    Instruções para Importação
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Siga as orientações abaixo para garantir que o seu arquivo CSV seja lido com 100% de precisão pelo sistema.
                  </p>
                </div>

                {/* Estrutura das Colunas */}
                <div className="p-4 border border-border bg-muted/20 space-y-3">
                  <span className="text-xs font-semibold text-foreground block">
                    Colunas aceitas no arquivo:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">nome_completo</strong> (Obrigatório)
                        <span className="block text-[11px] text-muted-foreground">Nome e sobrenome do paciente</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">cpf</strong> (Obrigatório)
                        <span className="block text-[11px] text-muted-foreground">11 dígitos com ou sem pontuação</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">valor_consulta</strong> (Obrigatório)
                        <span className="block text-[11px] text-muted-foreground">Ex: 250.00 ou 250,00</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">email</strong> (Opcional)
                        <span className="block text-[11px] text-muted-foreground">E-mail para envio da NFS-e</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">telefone</strong> (Opcional)
                        <span className="block text-[11px] text-muted-foreground">WhatsApp do paciente com DDD</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">data_consulta</strong> (Opcional)
                        <span className="block text-[11px] text-muted-foreground">Data do atendimento (AAAA-MM-DD)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Baixar Modelo */}
                <div className="p-4 border border-[#B7F20B]/30 bg-[#B7F20B]/5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">
                      Precisa de um modelo pronto para preencher?
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Baixe o arquivo CSV de exemplo com a formatação e cabeçalhos oficiais.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCsv}
                    className="h-8 text-xs font-medium rounded-none border-border bg-background hover:bg-accent gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar Modelo CSV</span>
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 2: SELECIONAR MÉDICO & SUBIR ARQUIVO */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* 1. Seleção do Médico Responsável */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-[#B7F20B]" />
                    <span>Vincular pacientes ao médico: *</span>
                  </label>
                  <Select
                    value={selectedDoctorId || activeDoctor?.id || ""}
                    onValueChange={setSelectedDoctorId}
                  >
                    <SelectTrigger className="h-10 text-xs rounded-none bg-background border-border">
                      <SelectValue placeholder="Selecione o médico responsável" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none max-h-60">
                      {allDoctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center gap-2">
                            {doc.foto_perfil ? (
                              <img
                                src={doc.foto_perfil}
                                alt={doc.nome_completo}
                                className="h-5 w-5 rounded-full object-cover shrink-0 border border-border"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-muted border border-border text-[9px] font-bold flex items-center justify-center text-foreground shrink-0">
                                {doc.nome_completo.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-xs text-foreground">
                              {doc.nome_completo}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              (CNPJ: {doc.cnpj || "Sem CNPJ"})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Drag and Drop do Arquivo CSV */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <UploadCloud className="h-3.5 w-3.5 text-[#B7F20B]" />
                    <span>Selecione o arquivo CSV: *</span>
                  </label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all rounded-none flex flex-col items-center justify-center gap-3 ${
                      isDragging
                        ? "border-[#B7F20B] bg-[#B7F20B]/10"
                        : file
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-border hover:border-foreground/40 bg-muted/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {isParsing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-[#B7F20B]" />
                        <span className="text-xs font-medium text-foreground">
                          Lendo e validando dados do CSV...
                        </span>
                      </div>
                    ) : file && parseResult ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center rounded-none">
                          <FileCheck className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div className="space-y-0.5">
                          <strong className="text-xs font-medium text-foreground block">
                            {file.name}
                          </strong>
                          <span className="text-[11px] text-muted-foreground block">
                            {(file.size / 1024).toFixed(1)} KB &bull; {parseResult.validCount} pacientes válidos encontrados
                          </span>
                        </div>
                        <span className="text-[10px] text-primary hover:underline mt-1 font-medium">
                          Clique para trocar de arquivo
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="h-10 w-10 bg-muted border border-border flex items-center justify-center rounded-none">
                          <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-foreground">
                            Clique para selecionar ou arraste o arquivo CSV aqui
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Formatos aceitos: .csv com separador por vírgula ou ponto-e-vírgula
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: REVISÃO DOS PACIENTES EM LINHAS SIMPLES */}
            {currentStep === 3 && parseResult && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Resumo da Importação */}
                <div className="p-3.5 border border-border bg-muted/20 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <strong className="text-foreground">
                        {parseResult.validCount} paciente(s) pronto(s) para importação
                      </strong>
                      <span className="text-muted-foreground block text-[11px]">
                        Vinculados ao médico: <strong>{activeDoctor?.nome_completo || "Dr. Titular"}</strong>
                      </span>
                    </div>
                  </div>

                  {parseResult.invalidCount > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
                      <AlertCircle className="h-4 w-4" />
                      <span>{parseResult.invalidCount} linha(s) ignorada(s)</span>
                    </div>
                  )}
                </div>

                {/* Lista em Linhas Simples */}
                <div className="border border-border rounded-none overflow-hidden max-h-60 overflow-y-auto">
                  <Table className="w-full text-xs">
                    <TableHeader className="bg-muted/40 sticky top-0">
                      <TableRow className="border-b border-border h-8">
                        <TableHead className="py-1 px-3 text-[11px] font-bold uppercase">Paciente</TableHead>
                        <TableHead className="py-1 px-3 text-[11px] font-bold uppercase">CPF</TableHead>
                        <TableHead className="py-1 px-3 text-[11px] font-bold uppercase">Telefone</TableHead>
                        <TableHead className="py-1 px-3 text-[11px] font-bold uppercase text-right">Valor</TableHead>
                        <TableHead className="py-1 px-3 text-[11px] font-bold uppercase text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.patients.map((p, index) => (
                        <TableRow
                          key={index}
                          className={`border-b border-border/40 h-8 ${
                            !p.valido ? "bg-red-500/5 text-muted-foreground opacity-60" : ""
                          }`}
                        >
                          <TableCell className="py-1 px-3 font-medium text-foreground">
                            {p.nome_completo || <span className="text-destructive font-mono">(Nome ausente)</span>}
                          </TableCell>
                          <TableCell className="py-1 px-3 font-mono text-muted-foreground">
                            {p.cpf}
                          </TableCell>
                          <TableCell className="py-1 px-3 font-mono text-muted-foreground">
                            {p.telefone}
                          </TableCell>
                          <TableCell className="py-1 px-3 font-mono font-medium text-foreground text-right">
                            {formatCurrency(p.valor_consulta)}
                          </TableCell>
                          <TableCell className="py-1 px-3 text-center">
                            {p.valido ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Válido
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20" title={p.erros.join(", ")}>
                                Incompleto
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé de Ações do Modal */}
        <DialogFooter className="px-6 py-3 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between sm:justify-between w-full">
          <div>
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev - 1) as StepKey)}
                disabled={isSaving}
                className="h-8 text-xs rounded-none gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
                className="h-8 text-xs rounded-none"
              >
                Cancelar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 1 && (
              <Button
                type="button"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none shadow-xs cursor-pointer"
              >
                <span>Avançar para Upload</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                type="button"
                size="sm"
                disabled={!file || isParsing || !parseResult || parseResult.validCount === 0}
                onClick={handleProceedToReview}
                className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none shadow-xs cursor-pointer disabled:opacity-50"
              >
                <span>Revisar {parseResult?.validCount ? `${parseResult.validCount} Pacientes` : ""}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                type="button"
                size="sm"
                disabled={isSaving || !parseResult || parseResult.validCount === 0}
                onClick={handleSaveImport}
                className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none shadow-xs cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Importando Pacientes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Salvar e Importar ({parseResult?.validCount})</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
