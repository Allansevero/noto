import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { updateDoctor } from "../doctors.repository";
import { BrazilPhoneInput } from "@/shared/components/BrazilPhoneInput";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileCheck,
  FileText,
  Key,
  Loader2,
  Lock,
  ShieldCheck,
  UploadCloud,
  Eye,
  EyeOff,
  AlertCircle,
  Stethoscope,
  Save,
  Check,
  FileCode,
  Webhook,
} from "lucide-react";
import { DoctorWebhooksTab } from "./DoctorWebhooksTab";
import { parseNfseXml } from "../services/xmlParser.service";
import type { Doctor } from "../types";

interface DoctorSettingsPageProps {
  doctor: Doctor;
  onBack: () => void;
  onUpdateSuccess?: (updatedDoctor: Doctor) => void;
}

export function DoctorSettingsPage({
  doctor,
  onBack,
  onUpdateSuccess,
}: DoctorSettingsPageProps) {
  // Aba ativa: 'cert' | 'fiscal' | 'services' | 'company'
  const [activeTab, setActiveTab] = useState<string>("cert");

  // Input Ref para XML de NFS-e
  const xmlFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingXml, setIsImportingXml] = useState(false);

  // Estado do Certificado
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certBase64, setCertBase64] = useState<string>("");
  const [certPassword, setCertPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingCert, setIsValidatingCert] = useState(false);
  const [certValidation, setCertValidation] = useState<{
    valid: boolean;
    message: string;
    validoAte?: string;
  } | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados dos Parâmetros Fiscais (Aba 2)
  const [ambiente, setAmbiente] = useState<"homologacao" | "producao">(
    doctor.ambiente_nf || "producao"
  );
  const [regimeTributario, setRegimeTributario] = useState<string>(
    doctor.optante_simples_nacional ? "1" : "3"
  );
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState<string>(
    doctor.inscricao_municipal || ""
  );
  const [codigoTributarioMunicipio, setCodigoTributarioMunicipio] = useState<string>(
    doctor.codigo_tributario_municipio || ""
  );

  // Estados dos Serviços & Alíquotas (Aba 3)
  const [itemServico, setItemServico] = useState<string>(
    doctor.item_lista_servico && doctor.item_lista_servico.length >= 6
      ? doctor.item_lista_servico
      : "040101"
  );
  const [aliquotaIss, setAliquotaIss] = useState<string>(
    String(doctor.aliquota_iss ?? "3.00")
  );

  // Estados dos Dados Cadastrais (Aba 4)
  const [razaoSocial, setRazaoSocial] = useState(doctor.razao_social || doctor.nome_completo);
  const [nomeFantasia, setNomeFantasia] = useState(doctor.nome_fantasia || doctor.nome_completo);
  const [cnpj, setCnpj] = useState(doctor.cnpj || "");
  const [crm, setCrm] = useState(doctor.crm || "");
  const [whatsapp, setWhatsapp] = useState(doctor.telefone || "");
  const [email, setEmail] = useState(doctor.email || "");

  // Endereço
  const [cep, setCep] = useState(doctor.endereco?.cep || "");
  const [logradouro, setLogradouro] = useState(doctor.endereco?.logradouro || "");
  const [numero, setNumero] = useState(doctor.endereco?.numero || "");
  const [complemento, setComplemento] = useState(doctor.endereco?.complemento || "");
  const [bairro, setBairro] = useState(doctor.endereco?.bairro || "");
  const [cidade, setCidade] = useState(doctor.endereco?.cidade || "");
  const [uf, setUf] = useState(doctor.endereco?.uf || "RS");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Se o médico já possui empresa registrada na Focus NF-e, consideramos desbloqueado para edição
  const hasExistingFocusCompany = Boolean(
    doctor.focus_empresa_id && !doctor.focus_empresa_id.startsWith("focus_")
  );

  // Sincroniza todos os estados sempre que o objeto 'doctor' mudar
  useEffect(() => {
    setAmbiente(doctor.ambiente_nf || "producao");
    setRegimeTributario(doctor.optante_simples_nacional ? "1" : "3");
    setInscricaoMunicipal(doctor.inscricao_municipal || "");
    setCodigoTributarioMunicipio(doctor.codigo_tributario_municipio || "");
    setItemServico(
      doctor.item_lista_servico && doctor.item_lista_servico.length >= 6
        ? doctor.item_lista_servico
        : "040101"
    );
    setAliquotaIss(String(doctor.aliquota_iss ?? "3.00"));
    setRazaoSocial(doctor.razao_social || doctor.nome_completo || "");
    setNomeFantasia(doctor.nome_fantasia || doctor.razao_social || doctor.nome_completo || "");
    setCnpj(doctor.cnpj || "");
    setCrm(doctor.crm || "");
    setWhatsapp(doctor.telefone || "");
    setEmail(doctor.email || "");
    setCep(doctor.endereco?.cep || "");
    setLogradouro(doctor.endereco?.logradouro || "");
    setNumero(doctor.endereco?.numero || "");
    setComplemento(doctor.endereco?.complemento || "");
    setBairro(doctor.endereco?.bairro || "");
    setCidade(doctor.endereco?.cidade || "");
    setUf(doctor.endereco?.uf || "RS");

    if (hasExistingFocusCompany) {
      setCertValidation({
        valid: true,
        message: "Certificado e cadastro ativos na Focus NF-e",
      });
    }
  }, [doctor, hasExistingFocusCompany]);

  // REGRA: O desbloqueio ocorre quando o certificado é validado OU quando o médico já possui empresa na Focus
  const isUnlocked = Boolean(certValidation?.valid === true || hasExistingFocusCompany);

  // Busca CEP via ViaCEP
  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setLogradouro(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        setUf(data.uf || "");
      }
    } catch {
      // Falha silenciosa
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Leitura de Arquivo .PFX/.P12
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pfx" && extension !== "p12") {
      toast.error("Formato inválido. Selecione um arquivo .pfx ou .p12");
      return;
    }

    setCertFile(file);
    setCertError(null);
    setCertValidation(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.split(";base64,")[1] || result;
      setCertBase64(base64Clean);
    };
    reader.readAsDataURL(file);
  };

  // Leitura e Extração de XML de NFS-e Anterior
  const handleXmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingXml(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const xmlText = reader.result as string;
        const parsed = parseNfseXml(xmlText);

        if (parsed.cnpj) setCnpj(parsed.cnpj);
        if (parsed.inscricaoMunicipal) setInscricaoMunicipal(parsed.inscricaoMunicipal);
        if (parsed.razaoSocial) setRazaoSocial(parsed.razaoSocial);
        if (parsed.nomeFantasia) setNomeFantasia(parsed.nomeFantasia);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.telefone) setWhatsapp(parsed.telefone);
        if (parsed.cep) setCep(parsed.cep);
        if (parsed.logradouro) setLogradouro(parsed.logradouro);
        if (parsed.numero) setNumero(parsed.numero);
        if (parsed.complemento) setComplemento(parsed.complemento);
        if (parsed.bairro) setBairro(parsed.bairro);
        if (parsed.cidade) setCidade(parsed.cidade);
        if (parsed.uf) setUf(parsed.uf);
        if (parsed.codigoTributarioMunicipio) setCodigoTributarioMunicipio(parsed.codigoTributarioMunicipio);
        if (parsed.itemListaServico) setItemServico(parsed.itemListaServico);
        if (parsed.aliquotaIss) setAliquotaIss(parsed.aliquotaIss);
        if (parsed.regimeTributario) setRegimeTributario(parsed.regimeTributario);

        toast.success(
          `XML (${parsed.tipoPadrao}${parsed.numeroNota ? ` - Nota #${parsed.numeroNota}` : ""}) importado! Dados fiscais e cadastrais preenchidos.`
        );
      } catch (err: any) {
        console.error("Erro ao importar XML de NFS-e:", err);
        toast.error(err.message || "Não foi possível processar o arquivo XML.");
      } finally {
        setIsImportingXml(false);
        if (xmlFileInputRef.current) xmlFileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Validação do Certificado na Focus NF-e
  const handleValidateCert = async () => {
    if (!certBase64) {
      setCertError("Por favor, selecione o arquivo do certificado digital (.pfx ou .p12).");
      return;
    }
    if (!certPassword) {
      setCertError("Por favor, digite a senha do certificado digital.");
      return;
    }

    setIsValidatingCert(true);
    setCertError(null);
    setCertValidation(null);

    try {
      const res = await validateAndUploadCertificate(doctor, certBase64, certPassword);

      if (res.valid) {
        setCertValidation(res);
        toast.success(res.message || "Certificado digital validado com sucesso na Focus NF-e!");
        setTimeout(() => {
          setActiveTab("fiscal");
        }, 700);
      } else {
        setCertError(res.message || "Senha incorreta ou certificado inválido.");
        toast.error(res.message || "Senha incorreta ou certificado inválido.");
      }
    } catch (err: any) {
      setCertError(err.message || "Falha na conexão com a Focus NF-e.");
      toast.error(err.message || "Erro ao validar certificado.");
    } finally {
      setIsValidatingCert(false);
    }
  };

  // Salvar Todas as Configurações
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Atualiza no Supabase
      const updated = await updateDoctor(doctor.id, {
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        cnpj,
        crm,
        telefone: whatsapp,
        email,
        ambiente_nf: ambiente,
        optante_simples_nacional: regimeTributario === "1",
        inscricao_municipal: inscricaoMunicipal,
        codigo_tributario_municipio: codigoTributarioMunicipio,
        item_lista_servico: itemServico,
        aliquota_iss: parseFloat(aliquotaIss) || 3.0,
        endereco: {
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
        },
      });

      // 2. Sincroniza parâmetros na Focus NF-e via PUT /v2/empresas/{id}
      await syncDoctorWithFocusNfe(updated, {
        ambiente,
        aliquotaIss: parseFloat(aliquotaIss) || 3.0,
        itemServico,
        regimeTributario: (parseInt(regimeTributario, 10) || 1) as 1 | 2 | 3 | 4,
        arquivoCertificadoBase64: certBase64 || undefined,
        senhaCertificado: certPassword || undefined,
      });

      toast.success("Configurações do médico e parâmetros de NFS-e salvos com sucesso!");
      onUpdateSuccess?.(updated);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações do médico.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full bg-background font-sans">
      {/* ── Barra de Sub-Header com Navegação ── */}
      <div className="border-b border-border bg-card/60 backdrop-blur-xs shrink-0 w-full">
        <div className="px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-7 px-2 rounded-none text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="text-xs">Voltar</span>
            </Button>
            <span className="text-muted-foreground/30">|</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Médicos</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold text-foreground">{doctor.nome_completo}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={xmlFileInputRef}
              accept=".xml,text/xml"
              className="hidden"
              onChange={handleXmlFileChange}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isImportingXml}
              onClick={() => xmlFileInputRef.current?.click()}
              className="h-7 px-2.5 rounded-none text-xs border-border hover:bg-accent gap-1.5 font-medium"
            >
              {isImportingXml ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCode className="h-3.5 w-3.5 text-[#B7F20B]" />
              )}
              <span>Importar XML de NFS-e</span>
            </Button>

            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              size="sm"
              className="h-7 px-3.5 rounded-none bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black font-semibold text-xs gap-1.5 transition-colors shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Título da Área e Breve Descrição ── */}
      <div className="px-6 pt-4 pb-3 flex flex-col gap-1 w-full">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
          Dados Fiscais & Configurações de NFS-e
        </h1>
        <p className="text-xs text-muted-foreground font-sans">
          Gerencie o certificado digital A1, parâmetros tributários e integração de emissão automática de notas fiscais.
        </p>
      </div>

      {/* ── Faixa do Médico: Linha Acima e Abaixo 100% sem margem e sem CRM ── */}
      <div className="w-full px-6 py-3 border-y border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {doctor.foto_perfil ? (
            <img
              src={doctor.foto_perfil}
              alt={doctor.nome_completo}
              className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
              style={{ borderRadius: "100%" }}
            />
          ) : (
            <div
              className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center font-display font-bold text-xs text-foreground shrink-0"
              style={{ borderRadius: "100%" }}
            >
              {doctor.nome_completo.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-xs font-display font-bold text-foreground">
              {doctor.nome_completo}
            </h2>
            <p className="text-[11px] text-muted-foreground font-mono">
              {doctor.razao_social || "Pessoa Jurídica"} • CNPJ: {doctor.cnpj || "Sem CNPJ"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#B7F20B]/10 border border-[#B7F20B]/30 text-foreground font-mono text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#B7F20B]" />
              <span>Certificado Validado (Focus NF-e)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-xs font-medium">
              <Lock className="h-3.5 w-3.5" />
              <span>Aguardando Validação do Certificado A1</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs de Navegação (Underline 100% Width com Espaçamento Uniforme) ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 overflow-hidden flex flex-col">
        <div className="w-full px-6 pt-3.5 border-b border-border bg-background shrink-0">
          <TabsList className="border-b-0 bg-transparent p-0 w-full justify-start gap-8">
            {/* Aba 1: Certificado Digital */}
            <TabsTrigger value="cert" className="gap-2 text-xs py-2.5">
              <Key className="h-3.5 w-3.5" />
              <span>1. Certificado Digital A1</span>
            </TabsTrigger>

            {/* Aba 2: Parâmetros Fiscais (Desabilitada até receber OK da Focus) */}
            <TabsTrigger
              value="fiscal"
              disabled={!isUnlocked}
              title={!isUnlocked ? "Bloqueado: Valide a senha do certificado A1 para liberar" : ""}
              className="gap-2 text-xs py-2.5"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>2. Parâmetros Fiscais</span>
              {!isUnlocked && <Lock className="h-3 w-3 opacity-60 ml-0.5 text-amber-500" />}
            </TabsTrigger>

            {/* Aba 3: Serviços & Alíquotas (Desabilitada até receber OK da Focus) */}
            <TabsTrigger
              value="services"
              disabled={!isUnlocked}
              title={!isUnlocked ? "Bloqueado: Valide a senha do certificado A1 para liberar" : ""}
              className="gap-2 text-xs py-2.5"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>3. Serviços & Alíquotas</span>
              {!isUnlocked && <Lock className="h-3 w-3 opacity-60 ml-0.5 text-amber-500" />}
            </TabsTrigger>

            {/* Aba 4: Dados Cadastrais (Desabilitada até receber OK da Focus) */}
            <TabsTrigger
              value="company"
              disabled={!isUnlocked}
              title={!isUnlocked ? "Bloqueado: Valide a senha do certificado A1 para liberar" : ""}
              className="gap-2 text-xs py-2.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>4. Dados Cadastrais & Empresa</span>
              {!isUnlocked && <Lock className="h-3 w-3 opacity-60 ml-0.5 text-amber-500" />}
            </TabsTrigger>

            {/* Aba 5: Webhooks & Gatilhos */}
            <TabsTrigger
              value="webhooks"
              disabled={!isUnlocked}
              title={!isUnlocked ? "Bloqueado: Valide a senha do certificado A1 para liberar" : ""}
              className="gap-2 text-xs py-2.5"
            >
              <Webhook className="h-3.5 w-3.5 text-[#B7F20B]" />
              <span>5. Webhooks & Gatilhos</span>
              {!isUnlocked && <Lock className="h-3 w-3 opacity-60 ml-0.5 text-amber-500" />}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Conteúdo Centralizado e Harmonioso para Inputs ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 w-full">
          <div className="max-w-2xl mx-auto w-full">
            {/* ══════════ ABA 1: CERTIFICADO DIGITAL A1 ══════════ */}
            <TabsContent value="cert" className="space-y-5">
              <div className="border border-border bg-card p-5 rounded-none space-y-4 shadow-xs">
                <div>
                  <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#B7F20B]" />
                    Instalação e Validação do Certificado A1 (.PFX ou .P12)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie o arquivo do certificado digital e digite a senha. As demais abas fiscais serão <strong>desbloqueadas assim que a Focus NF-e confirmar o OK da senha e titularidade</strong>.
                  </p>
                </div>

                {/* Upload Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors rounded-none flex flex-col items-center justify-center gap-2 w-full ${
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
                        {(certFile.size / 1024).toFixed(1)} KB • Clique para selecionar outro arquivo
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-muted-foreground" />
                      <div className="text-xs font-medium text-foreground">
                        Clique aqui para selecionar o Certificado A1 (.pfx ou .p12)
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Formatos suportados: .pfx ou .p12
                      </span>
                    </>
                  )}
                </div>

                {/* Senha do Certificado */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center justify-between">
                    <span>Senha do Certificado Digital</span>
                    <span className="text-[11px] text-muted-foreground">Necessária para validação</span>
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
                      className="h-8.5 text-xs pr-9 rounded-none bg-background font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Feedback de Erro */}
                {certError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2 rounded-none">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{certError}</span>
                  </div>
                )}

                {/* Feedback de Sucesso */}
                {isUnlocked && (
                  <div className="p-3 bg-[#B7F20B]/10 border border-[#B7F20B]/40 text-foreground text-xs flex items-start gap-2.5 rounded-none">
                    <CheckCircle2 className="h-4 w-4 text-[#B7F20B] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Certificado A1 Validado com Sucesso!</strong>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {certValidation?.validoAte
                          ? `Validade confirmada até ${certValidation.validoAte}. As abas fiscais foram desbloqueadas.`
                          : "Senha e certificado aceitos pela Focus NF-e. As demais abas foram liberadas."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão de Validação */}
                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    onClick={handleValidateCert}
                    disabled={isValidatingCert || !certBase64 || !certPassword}
                    className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none"
                  >
                    {isValidatingCert ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Validando na Focus...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Validar Senha e Desbloquear Abas Fiscais</span>
                      </>
                    )}
                  </Button>

                  {isUnlocked && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("fiscal")}
                      className="h-8 text-xs rounded-none gap-1.5"
                    >
                      <span>Ir para Parâmetros Fiscais</span>
                      <Check className="h-3 w-3 text-[#B7F20B]" />
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ══════════ ABA 2: PARÂMETROS FISCAIS DA NFS-E ══════════ */}
            <TabsContent value="fiscal" className="space-y-5">
              <div className="border border-border bg-card p-5 rounded-none space-y-4 shadow-xs">
                <div>
                  <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#B7F20B]" />
                    Ambiente e Regime Tributário
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Defina o ambiente de emissão junto à prefeitura e as configurações de tributação municipal.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Ambiente */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Ambiente de Emissão</Label>
                    <Select
                      value={ambiente}
                      onValueChange={(val: "homologacao" | "producao") => setAmbiente(val)}
                    >
                      <SelectTrigger className="h-8.5 text-xs rounded-none bg-background border-border">
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
                      <SelectTrigger className="h-8.5 text-xs rounded-none bg-background border-border">
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="1">1 - Simples Nacional (ME/EPP)</SelectItem>
                        <SelectItem value="4">4 - Simples Nacional (MEI)</SelectItem>
                        <SelectItem value="3">3 - Regime Normal (Lucro Presumido / Real)</SelectItem>
                      </SelectContent>
                    </Select>
                    {regimeTributario === "3" && (
                      <p className="text-[10px] text-muted-foreground font-mono bg-muted/30 p-1.5 border border-border">
                        ✓ Não Optante do SN: Indicador e percentual de tributos do Simples Nacional são omitidos automaticamente.
                      </p>
                    )}
                  </div>

                  {/* Inscrição Municipal */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Inscrição Municipal (IM)</Label>
                    <Input
                      type="text"
                      value={inscricaoMunicipal}
                      onChange={(e) => setInscricaoMunicipal(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-none"
                      placeholder="Ex: 123456"
                    />
                  </div>

                  {/* Código Tributário do Município */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Código Tributário Municipal (Opcional)</Label>
                    <Input
                      type="text"
                      value={codigoTributarioMunicipio}
                      onChange={(e) => setCodigoTributarioMunicipio(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-none"
                      placeholder="Ex: 8610101"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("services")}
                    className="h-8 text-xs rounded-none"
                  >
                    <span>Próximo: Serviços & Alíquotas</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ══════════ ABA 3: SERVIÇOS & ALÍQUOTAS ══════════ */}
            <TabsContent value="services" className="space-y-5">
              <div className="border border-border bg-card p-5 rounded-none space-y-4 shadow-xs">
                <div>
                  <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-[#B7F20B]" />
                    Classificação do Serviço & Alíquota de ISS
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione o código correspondente às consultas médicas emitidas pelo profissional.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Item da Lista de Serviço LC 116/03 */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium">Item da Lista de Serviços (LC 116/03)</Label>
                    <Select value={itemServico} onValueChange={setItemServico}>
                      <SelectTrigger className="h-8.5 text-xs rounded-none bg-background border-border">
                        <SelectValue placeholder="Selecione o código de serviço" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="040101">04.01.01 - Medicina e Biomedicina (Consultas Médicas em Geral)</SelectItem>
                        <SelectItem value="040102">04.01.02 - Medicina Diagnóstica e Cirúrgica</SelectItem>
                        <SelectItem value="040201">04.02.01 - Análises Clínicas, Patologia e Radiologia</SelectItem>
                        <SelectItem value="040301">04.03.01 - Hospitais, Clínicas Médicas e Sanatórios</SelectItem>
                        <SelectItem value="040801">04.08.01 - Fisioterapia, Terapia Ocupacional e Fonoaudiologia</SelectItem>
                        <SelectItem value="041601">04.16.01 - Psicologia e Psicanálise</SelectItem>
                        <SelectItem value="041401">04.14.01 - Enfermagem e Cuidados Domiciliares</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                      className="h-8.5 text-xs font-mono rounded-none"
                      placeholder="3.00"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("company")}
                    className="h-8 text-xs rounded-none"
                  >
                    <span>Próximo: Dados da Empresa</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ══════════ ABA 4: DADOS CADASTRAIS & EMPRESA ══════════ */}
            <TabsContent value="company" className="space-y-5">
              <div className="border border-border bg-card p-5 rounded-none space-y-4 shadow-xs">
                <div>
                  <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#B7F20B]" />
                    Dados Cadastrais da Empresa e Contato
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirme e atualize os dados jurídicos e endereço completo da clínica ou consultório.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Razão Social</Label>
                    <Input
                      type="text"
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      className="h-8.5 text-xs rounded-none"
                      placeholder="Razão Social da Empresa"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nome Fantasia</Label>
                    <Input
                      type="text"
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      className="h-8.5 text-xs rounded-none"
                      placeholder="Nome Fantasia"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">CNPJ</Label>
                    <Input
                      type="text"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-none"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">WhatsApp</Label>
                    <BrazilPhoneInput
                      value={whatsapp}
                      onChange={setWhatsapp}
                      className="h-8.5 text-xs rounded-none"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="pt-2 border-t border-border space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">Endereço da Empresa</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center justify-between">
                        <span>CEP</span>
                        {isSearchingCep && <Loader2 className="h-3 w-3 animate-spin" />}
                      </Label>
                      <Input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        onBlur={handleCepBlur}
                        className="h-8 text-xs font-mono rounded-none"
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-medium">Logradouro</Label>
                      <Input
                        type="text"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        className="h-8 text-xs rounded-none"
                        placeholder="Rua, Av..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Número</Label>
                      <Input
                        type="text"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="h-8 text-xs rounded-none"
                        placeholder="100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Bairro</Label>
                      <Input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="h-8 text-xs rounded-none"
                        placeholder="Bairro"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Cidade / UF</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="h-8 text-xs rounded-none flex-1"
                          placeholder="Cidade"
                        />
                        <Input
                          type="text"
                          value={uf}
                          onChange={(e) => setUf(e.target.value.toUpperCase())}
                          className="h-8 text-xs rounded-none w-14 font-mono text-center"
                          placeholder="UF"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ══════════ ABA 5: WEBHOOKS & GATILHOS ══════════ */}
            <TabsContent value="webhooks" className="space-y-5">
              <DoctorWebhooksTab doctor={doctor} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
