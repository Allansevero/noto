import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrazilPhoneInput } from "@/shared/components/BrazilPhoneInput";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { parseNfseXml, type ParsedNfseData } from "../services/xmlParser.service";
import { useCreateDoctor } from "../hooks/useCreateDoctor";
import { updateDoctor as updateDoctorRepo } from "../doctors.repository";
import { isValidCNPJ } from "@/shared/utils/validators";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  UploadCloud,
  Check,
  MessageSquare,
  Award,
  AlertTriangle,
  FileText,
  UserPlus,
} from "lucide-react";
import type { Doctor } from "../types";

// Schema de validação
const doctorSchema = z.object({
  // Etapa 1: Foto, Nome e Sobrenome, WhatsApp
  foto_perfil: z.string().optional(),
  nome: z.string().min(2, "Informe o primeiro nome."),
  sobrenome: z.string().min(2, "Informe o sobrenome."),
  whatsapp: z.string().min(10, "Informe o WhatsApp com DDD e 9 dígitos."),
  crm: z.string().optional(),

  // Etapa 2: Dados Fiscais & Empresa
  cnpj: z
    .string()
    .min(14, "CNPJ é obrigatório.")
    .refine(isValidCNPJ, "CNPJ inválido."),
  razao_social: z.string().min(2, "Razão Social obrigatória."),
  nome_fantasia: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  codigo_municipio_ibge: z.string().optional(),
  email_empresa: z.string().optional(),
  item_lista_servico: z.string().optional(),
  aliquota_iss: z.number().optional(),
  optante_simples_nacional: z.boolean().optional(),
  regime_tributario: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

type PostActionOption = "invoices" | "patients" | null;

interface DoctorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (doctor: Doctor) => void;
  doctorToEdit?: Doctor | null;
  onNavigateToPatients?: () => void;
  onNavigateToInvoices?: (createdDoc?: Doctor) => void;
}

export function DoctorFormDialog({
  open,
  onOpenChange,
  onSuccess,
  doctorToEdit,
  onNavigateToPatients,
  onNavigateToInvoices,
}: DoctorFormDialogProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSuccessView, setIsSuccessView] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PostActionOption>(null);
  const [savedDoctor, setSavedDoctor] = useState<Doctor | null>(null);

  const [isXmlLoading, setIsXmlLoading] = useState(false);
  const [importedXmlData, setImportedXmlData] = useState<ParsedNfseData | null>(null);
  const xmlFileInputRef = useRef<HTMLInputElement>(null);

  const { isLoading: isSubmitting, error, create, reset: resetHook } = useCreateDoctor();

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      foto_perfil: "",
      nome: "",
      sobrenome: "",
      whatsapp: "",
      crm: "",
      cnpj: "",
      razao_social: "",
      nome_fantasia: "",
      inscricao_municipal: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "Porto Alegre",
      uf: "RS",
      codigo_municipio_ibge: "4314902",
      email_empresa: "",
      item_lista_servico: "041601",
      aliquota_iss: 2.0,
      optante_simples_nacional: false,
      regime_tributario: "3",
    },
    mode: "onBlur",
  });

  // Preenche o formulário quando estiver no modo de edição
  useEffect(() => {
    if (doctorToEdit && open) {
      const parts = (doctorToEdit.nome_completo || "").trim().split(" ");
      const firstName = doctorToEdit.nome || parts[0] || "";
      const lastName = doctorToEdit.sobrenome || parts.slice(1).join(" ") || "";

      form.reset({
        foto_perfil: doctorToEdit.foto_perfil || "",
        nome: firstName,
        sobrenome: lastName,
        whatsapp: doctorToEdit.telefone || "",
        crm: doctorToEdit.crm !== "ISENTO" ? doctorToEdit.crm : "",
        cnpj: doctorToEdit.cnpj || "",
        razao_social: doctorToEdit.razao_social || "",
        nome_fantasia: doctorToEdit.nome_fantasia || doctorToEdit.razao_social || "",
        inscricao_municipal: doctorToEdit.inscricao_municipal || "",
        cep: doctorToEdit.endereco?.cep || "",
        logradouro: doctorToEdit.endereco?.logradouro || "",
        numero: doctorToEdit.endereco?.numero || "",
        complemento: doctorToEdit.endereco?.complemento || "",
        bairro: doctorToEdit.endereco?.bairro || "",
        cidade: doctorToEdit.endereco?.cidade || "Porto Alegre",
        uf: doctorToEdit.endereco?.uf || "RS",
        codigo_municipio_ibge: (doctorToEdit as any).codigo_municipio_ibge || "4314902",
        email_empresa: doctorToEdit.email || "",
        item_lista_servico: doctorToEdit.item_lista_servico || "041601",
        aliquota_iss: doctorToEdit.aliquota_iss || 2.0,
        optante_simples_nacional: doctorToEdit.optante_simples_nacional ?? false,
        regime_tributario: "3",
      });
      setCurrentStep(1);
      setIsSuccessView(false);
    } else if (!doctorToEdit && open) {
      form.reset({
        foto_perfil: "",
        nome: "",
        sobrenome: "",
        whatsapp: "",
        crm: "",
        cnpj: "",
        razao_social: "",
        nome_fantasia: "",
        inscricao_municipal: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "Porto Alegre",
        uf: "RS",
        codigo_municipio_ibge: "4314902",
        email_empresa: "",
        item_lista_servico: "041601",
        aliquota_iss: 2.0,
        optante_simples_nacional: false,
        regime_tributario: "3",
      });
      setCurrentStep(1);
      setIsSuccessView(false);
    }
  }, [doctorToEdit, open, form]);

  // Leitura e Extração do XML de NFS-e
  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsXmlLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const xmlText = reader.result as string;
        const parsed = parseNfseXml(xmlText);
        setImportedXmlData(parsed);

        if (parsed.cnpj) form.setValue("cnpj", parsed.cnpj, { shouldValidate: true, shouldDirty: true });
        if (parsed.razaoSocial) form.setValue("razao_social", parsed.razaoSocial, { shouldValidate: true, shouldDirty: true });
        if (parsed.nomeFantasia) form.setValue("nome_fantasia", parsed.nomeFantasia, { shouldValidate: true, shouldDirty: true });
        if (parsed.inscricaoMunicipal) form.setValue("inscricao_municipal", parsed.inscricaoMunicipal, { shouldValidate: true, shouldDirty: true });
        if (parsed.email) form.setValue("email_empresa", parsed.email, { shouldValidate: true, shouldDirty: true });
        if (parsed.cep) form.setValue("cep", parsed.cep, { shouldValidate: true, shouldDirty: true });
        if (parsed.logradouro) form.setValue("logradouro", parsed.logradouro, { shouldValidate: true, shouldDirty: true });
        if (parsed.numero) form.setValue("numero", parsed.numero, { shouldValidate: true, shouldDirty: true });
        if (parsed.complemento) form.setValue("complemento", parsed.complemento, { shouldValidate: true, shouldDirty: true });
        if (parsed.bairro) form.setValue("bairro", parsed.bairro, { shouldValidate: true, shouldDirty: true });
        if (parsed.cidade) form.setValue("cidade", parsed.cidade, { shouldValidate: true, shouldDirty: true });
        if (parsed.uf) form.setValue("uf", parsed.uf, { shouldValidate: true, shouldDirty: true });
        if (parsed.codigoMunicipioIbge) form.setValue("codigo_municipio_ibge", parsed.codigoMunicipioIbge, { shouldValidate: true, shouldDirty: true });
        if (parsed.itemListaServico) form.setValue("item_lista_servico", parsed.itemListaServico, { shouldValidate: true, shouldDirty: true });
        if (parsed.aliquotaIss) form.setValue("aliquota_iss", parseFloat(parsed.aliquotaIss) || 2.0, { shouldValidate: true, shouldDirty: true });
        if (parsed.optanteSimplesNacional !== undefined) {
          form.setValue("optante_simples_nacional", parsed.optanteSimplesNacional, { shouldValidate: true, shouldDirty: true });
        }
        if (parsed.regimeTributario) form.setValue("regime_tributario", parsed.regimeTributario, { shouldValidate: true, shouldDirty: true });

        toast.success(
          `XML (${parsed.tipoPadrao}${parsed.numeroNota ? ` - Nota #${parsed.numeroNota}` : ""}) importado! Dados fiscais configurados.`
        );
      } catch (err: any) {
        console.error("Erro ao ler XML de NFS-e:", err);
        toast.error("Não foi possível ler o arquivo XML selecionado.");
      } finally {
        setIsXmlLoading(false);
        if (xmlFileInputRef.current) xmlFileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleNextStep = async () => {
    const isValid = await form.trigger(["nome", "sobrenome", "whatsapp"]);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (values: DoctorFormValues) => {
    const nomeCompleto = `${values.nome.trim()} ${values.sobrenome.trim()}`;

    // Formata o WhatsApp para o formato internacional +55...
    const phoneDigits = values.whatsapp.replace(/\D/g, "");
    const formattedWhatsapp = phoneDigits.length >= 10 ? `+55${phoneDigits}` : values.whatsapp;

    if (doctorToEdit) {
      try {
        const updatedDoctor = await updateDoctorRepo(doctorToEdit.id, {
          nome_completo: nomeCompleto,
          nome: values.nome,
          sobrenome: values.sobrenome,
          foto_perfil: values.foto_perfil,
          crm: values.crm?.trim().toUpperCase() || "ISENTO",
          especialidade: doctorToEdit.especialidade || "Clínico Geral",
          tipo_emissor: doctorToEdit.tipo_emissor || "Pessoa Jurídica",
          cnpj: values.cnpj,
          razao_social: values.razao_social,
          nome_fantasia: values.nome_fantasia || values.razao_social,
          inscricao_municipal: values.inscricao_municipal,
          email: values.email_empresa || doctorToEdit.email,
          telefone: formattedWhatsapp,
          optante_simples_nacional: values.optante_simples_nacional ?? false,
          item_lista_servico: values.item_lista_servico || "041601",
          aliquota_iss: values.aliquota_iss || 2.0,
          status: doctorToEdit.status || "Ativo",
          endereco: values.cep
            ? {
                cep: values.cep,
                logradouro: values.logradouro ?? "",
                numero: values.numero ?? "",
                complemento: values.complemento,
                bairro: values.bairro ?? "",
                cidade: values.cidade ?? "Porto Alegre",
                uf: values.uf ?? "RS",
              }
            : doctorToEdit.endereco,
        });

        toast.success(`Cadastro de Dr(a). ${nomeCompleto} atualizado com sucesso!`);
        onSuccess(updatedDoctor);
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao atualizar médico.");
      }
      return;
    }

    const doctor = await create({
      nome_completo: nomeCompleto,
      nome: values.nome,
      sobrenome: values.sobrenome,
      foto_perfil: values.foto_perfil,
      crm: values.crm?.trim().toUpperCase() || "ISENTO",
      especialidade: "Clínico Geral",
      tipo_emissor: "Pessoa Jurídica",
      cnpj: values.cnpj,
      razao_social: values.razao_social,
      nome_fantasia: values.nome_fantasia || values.razao_social,
      inscricao_municipal: values.inscricao_municipal,
      email: values.email_empresa || `${values.nome.toLowerCase().replace(/\s+/g, '')}.${Date.now()}@clinica.com`,
      telefone: formattedWhatsapp,
      cpf: "",
      optante_simples_nacional: values.optante_simples_nacional ?? false,
      item_lista_servico: values.item_lista_servico || "041601",
      aliquota_iss: values.aliquota_iss || 2.0,
      codigo_tributario_municipio: values.item_lista_servico || "041601",
      codigo_municipio_ibge: values.codigo_municipio_ibge || "4314902",
      endereco: values.cep
        ? {
            cep: values.cep,
            logradouro: values.logradouro ?? "",
            numero: values.numero ?? "",
            complemento: values.complemento,
            bairro: values.bairro ?? "",
            cidade: values.cidade ?? "Porto Alegre",
            uf: values.uf ?? "RS",
          }
        : undefined,
      status: "Ativo",
    });

    if (doctor) {
      setSavedDoctor(doctor);
      onSuccess(doctor);
      toast.success(`Dr(a). ${nomeCompleto} cadastrado com sucesso!`);
      setIsSuccessView(true);
    }
  };

  const handleExecuteOption = () => {
    if (selectedOption === "invoices") {
      toast.info("Redirecionando para configuração de notas fiscais...");
      onNavigateToInvoices?.();
      handleDialogClose(false);
    } else if (selectedOption === "patients") {
      toast.info("Pronto para adicionar pacientes!");
      onNavigateToPatients?.();
      handleDialogClose(false);
    } else {
      handleDialogClose(false);
    }
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      resetHook();
      setCurrentStep(1);
      setImportedXmlData(null);
      setIsSuccessView(false);
      setSelectedOption(null);
      setSavedDoctor(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-card rounded-none">
        {/* ═══════════════════ TELA PÓS-SALVAMENTO: OPÇÕES ═══════════════════ */}
        {isSuccessView ? (
          <div className="p-6 space-y-6 animate-in fade-in duration-200">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B7F20B]">
                <CheckCircle2 className="h-5 w-5" />
                <span>Cadastro e Parâmetros Fiscais Salvos com Sucesso</span>
              </div>
              <DialogTitle className="text-xl font-display font-semibold text-foreground">
                Dr(a). {savedDoctor?.nome_completo}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-sans">
                O médico e os parâmetros da NFS-e foram registrados no sistema e sincronizados com a <strong>Focus NF-e</strong>
                {savedDoctor?.focus_empresa_id ? ` (ID #${savedDoctor.focus_empresa_id})` : ""}.
              </DialogDescription>
            </DialogHeader>

            {/* Cards de Opções Selecionáveis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opção 1: Configurar notas fiscais */}
              <div
                onClick={() => setSelectedOption("invoices")}
                className={`group relative p-5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 rounded-none ${
                  selectedOption === "invoices"
                    ? "border-[#B7F20B] bg-[#B7F20B]/5 shadow-xs"
                    : "border-border/80 hover:border-[#B7F20B] bg-card"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2.5 border rounded-none transition-colors ${
                        selectedOption === "invoices"
                          ? "border-[#B7F20B] bg-[#B7F20B]/10 text-foreground"
                          : "border-border bg-muted/60 text-muted-foreground group-hover:text-foreground group-hover:border-[#B7F20B]/50"
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>

                    <div
                      className={`h-4 w-4 border rounded-none flex items-center justify-center transition-colors ${
                        selectedOption === "invoices"
                          ? "border-[#B7F20B] bg-[#B7F20B] text-black"
                          : "border-border bg-transparent group-hover:border-[#B7F20B]"
                      }`}
                    >
                      {selectedOption === "invoices" && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display font-semibold text-sm text-foreground">
                      Emitir & Ver Notas Fiscais
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Visualize a aba de notas fiscais, verifique o status de homologação ou autorização das DPS emitidas.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-1">
                  <span>Acessar notas fiscais</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* Opção 2: Adicionar Pacientes */}
              <div
                onClick={() => setSelectedOption("patients")}
                className={`group relative p-5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 rounded-none ${
                  selectedOption === "patients"
                    ? "border-[#B7F20B] bg-[#B7F20B]/5 shadow-xs"
                    : "border-border/80 hover:border-[#B7F20B] bg-card"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2.5 border rounded-none transition-colors ${
                        selectedOption === "patients"
                          ? "border-[#B7F20B] bg-[#B7F20B]/10 text-foreground"
                          : "border-border bg-muted/60 text-muted-foreground group-hover:text-foreground group-hover:border-[#B7F20B]/50"
                      }`}
                    >
                      <UserPlus className="h-5 w-5" />
                    </div>

                    <div
                      className={`h-4 w-4 border rounded-none flex items-center justify-center transition-colors ${
                        selectedOption === "patients"
                          ? "border-[#B7F20B] bg-[#B7F20B] text-black"
                          : "border-border bg-transparent group-hover:border-[#B7F20B]"
                      }`}
                    >
                      {selectedOption === "patients" && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display font-semibold text-sm text-foreground">
                      Adicionar pacientes
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Comece a cadastrar pacientes vinculados a este médico para registrar consultas e faturamento.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-1">
                  <span>Cadastrar paciente</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Rodapé da tela de opções */}
            <DialogFooter className="pt-4 border-t border-border flex items-center justify-between sm:justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                className="h-9 text-xs rounded-none"
              >
                Ir para o painel
              </Button>

              <Button
                type="button"
                onClick={handleExecuteOption}
                disabled={!selectedOption}
                className="h-9 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 disabled:opacity-40 rounded-none"
              >
                <span>Prosseguir</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ═══════════════════ FORMULÁRIO (ETAPAS 1 E 2) ═══════════════════ */
          <>
            {/* Cabeçalho do Dialog com Indicador de Etapas */}
            <div className="p-6 pb-4 border-b border-border bg-muted/20">
              <DialogHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-display font-semibold flex items-center gap-2">
                    {doctorToEdit ? `Editar Médico: ${doctorToEdit.nome_completo}` : "Cadastrar Novo Médico"}
                  </DialogTitle>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <span
                      className={`px-2 py-0.5 font-semibold rounded-none ${
                        currentStep === 1
                          ? "bg-[#B7F20B] text-black"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      1. Identificação
                    </span>
                    <span>/</span>
                    <span
                      className={`px-2 py-0.5 font-semibold rounded-none ${
                        currentStep === 2
                          ? "bg-[#B7F20B] text-black"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      2. Dados Fiscais (XML)
                    </span>
                  </div>
                </div>
                <DialogDescription className="text-xs text-muted-foreground font-sans">
                  {currentStep === 1
                    ? "Informe a foto, nome, sobrenome e WhatsApp do profissional."
                    : "Importe o XML da última nota emitida para configurar automaticamente todos os parâmetros fiscais."}
                </DialogDescription>
              </DialogHeader>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-center gap-2 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive rounded-none">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
                {/* ═══════════════════ ETAPA 1: FOTO, NOME/SOBRENOME, WHATSAPP ═══════════════════ */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* 1. Foto de Perfil */}
                    <FormField
                      control={form.control}
                      name="foto_perfil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-foreground">
                            Foto de Perfil do Médico
                          </FormLabel>
                          <FormControl>
                            <ProfilePhotoUpload
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 2. Nome e Sobrenome */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">Nome *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Alice"
                                className="h-9 text-xs rounded-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sobrenome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">Sobrenome *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Xavier"
                                className="h-9 text-xs rounded-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 3. WhatsApp com Bandeira e CRM (Opcional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
                              WhatsApp *
                            </FormLabel>
                            <FormControl>
                              <BrazilPhoneInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="(51) 99999-9999"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="crm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                              <Award className="h-3.5 w-3.5 text-muted-foreground" />
                              CRM (Opcional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 36948/RS"
                                className="h-9 text-xs font-mono uppercase rounded-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* ═══════════════════ ETAPA 2: DADOS FISCAIS VIA XML ═══════════════════ */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* AVISO EM FUNDO AMARELO CLARO */}
                    <div className="p-4 rounded-none bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed shadow-xs">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block text-amber-900 dark:text-amber-100 text-xs mb-0.5">
                          Segurança e Precisão Fiscal
                        </strong>
                        Para a segurança dos dados serem corretos e evitar qualquer divergência tributária ou rejeição pela prefeitura, utilizamos diretamente os parâmetros da última nota fiscal padrão (XML) emitida pelo médico.
                      </div>
                    </div>

                    {/* Input file invisível para upload de XML */}
                    <input
                      type="file"
                      ref={xmlFileInputRef}
                      accept=".xml,text/xml"
                      className="hidden"
                      onChange={handleXmlUpload}
                    />

                    {/* Área de Upload / Dropzone do XML */}
                    {!importedXmlData ? (
                      <div
                        onClick={() => xmlFileInputRef.current?.click()}
                        className="p-6 border-2 border-dashed border-border hover:border-[#B7F20B] bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 rounded-none group"
                      >
                        <div className="p-3 rounded-full bg-background border border-border group-hover:border-[#B7F20B] transition-colors">
                          {isXmlLoading ? (
                            <Loader2 className="h-6 w-6 text-[#B7F20B] animate-spin" />
                          ) : (
                            <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-[#B7F20B] transition-colors" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            Clique ou arraste o arquivo XML da última NFS-e emitida
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Formatos suportados: NFS-e Nacional (SPED), ABRASF, Procempa, Betha, IPM, Ginfes
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isXmlLoading}
                          className="h-7 text-xs rounded-none border-border font-medium gap-1.5"
                        >
                          <FileCode className="h-3.5 w-3.5 text-[#B7F20B]" />
                          <span>Selecionar Arquivo .XML</span>
                        </Button>
                      </div>
                    ) : (
                      /* Card Verde de Dados Fiscais Extraídos com Sucesso */
                      <div className="p-4 border border-[#B7F20B]/40 bg-[#B7F20B]/5 rounded-none space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-[#B7F20B]" />
                            <span>Parâmetros Fiscais Extraídos do XML com Sucesso</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => xmlFileInputRef.current?.click()}
                            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground underline"
                          >
                            Trocar arquivo XML
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-background/80 p-3 border border-border">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Razão Social / Prestador:</span>
                            <strong className="text-foreground truncate block">{form.watch("razao_social")}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">CNPJ do Prestador:</span>
                            <strong className="text-foreground font-mono">{form.watch("cnpj")}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Município / Local de Prestação:</span>
                            <span className="text-foreground font-medium">{form.watch("cidade")} - {form.watch("uf")} (IBGE: {form.watch("codigo_municipio_ibge")})</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Regime Tributário:</span>
                            <span className="text-foreground font-medium">
                              {form.watch("optante_simples_nacional") ? "Simples Nacional" : "Regime Normal (Não Optante)"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Código Tributação Nacional:</span>
                            <span className="text-foreground font-mono font-medium">{form.watch("item_lista_servico")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Alíquota ISS Aplicada:</span>
                            <span className="text-foreground font-mono font-medium">{form.watch("aliquota_iss")}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CNPJ e Razão Social Confirmados */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">CNPJ do Prestador *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00.000.000/0000-00"
                                className="h-9 text-xs font-mono rounded-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="razao_social"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">Razão Social *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Razão Social da Empresa"
                                className="h-9 text-xs rounded-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* ═══════════════════ BOTÕES DE NAVEGAÇÃO / SUBMIT ═══════════════════ */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  {currentStep === 2 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrevStep}
                      className="h-8 text-xs rounded-none gap-1.5"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Voltar para Perfil</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep === 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNextStep}
                      className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none shadow-xs"
                    >
                      <span>Avançar para Dados Fiscais</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="sm"
                      className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none shadow-xs cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{doctorToEdit ? "Salvando Alterações..." : "Cadastrando Médico..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{doctorToEdit ? "Salvar Alterações" : "Concluir Cadastro do Médico"}</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
