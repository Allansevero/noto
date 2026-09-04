import React, { useState, useRef } from 'react';
import type { DoctorOnboardingState } from '../types';
import { ArrowRight, ArrowLeft, ShieldCheck, FileCheck, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Step4CertificateA1Props {
  state: DoctorOnboardingState;
  onValidateCert: (certBase64: string, certPassword: string, fileName: string) => Promise<{ valid: boolean; message: string; validoAte?: string }>;
  onSkipCert: () => void;
  onPrev: () => void;
}

export function Step4CertificateA1({
  state,
  onValidateCert,
  onSkipCert,
  onPrev,
}: Step4CertificateA1Props) {
  const [file, setFile] = useState<File | null>(null);
  const [base64Content, setBase64Content] = useState<string>(state.certificadoBase64 || '');
  const [fileName, setFileName] = useState<string>(state.certificadoNome || '');
  const [password, setPassword] = useState<string>(state.certificadoSenha || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ validoAte?: string; message?: string } | null>(
    state.certificadoValido ? { validoAte: state.certificadoValidoAte, message: 'Certificado validado com sucesso.' } : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    setSuccessInfo(null);

    const validExtensions = ['.pfx', '.p12'];
    const hasValidExt = validExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Por favor, selecione um arquivo de Certificado Digital A1 (.pfx ou .p12).');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.includes(',') ? result.split(',')[1] : result;
      setBase64Content(base64Clean);
    };
    reader.onerror = () => {
      setErrorMessage('Não foi possível ler o arquivo selecionado.');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!base64Content) {
      setErrorMessage('Anexe o arquivo do Certificado Digital A1 (.pfx ou .p12).');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Digite a senha do certificado digital.');
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      const result = await onValidateCert(base64Content, password, fileName);
      if (result.valid) {
        setSuccessInfo({
          validoAte: result.validoAte,
          message: result.message || 'Certificado digital validado com sucesso na Focus NF-e!',
        });
      } else {
        setErrorMessage(result.message || 'Senha incorreta ou certificado inválido.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro de comunicação ao validar certificado.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-10 animate-in fade-in duration-400">
      {/* TÍTULO E SUBTÍTULO MINIMALISTAS */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-800" />
          <span>Empresa criada na Focus NF-e</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight text-neutral-900 leading-tight">
          Certificado Digital A1
        </h1>
        <p className="text-lg text-neutral-500 font-normal">
          Anexe seu arquivo <span className="font-mono text-neutral-700">.pfx</span> ou <span className="font-mono text-neutral-700">.p12</span> e informe a senha para autorizar as emissões fiscais.
        </p>
      </div>

      {/* ÁREA DE UPLOAD E SENHA */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* DROPZONE DE ARQUIVO */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pfx,.p12,application/x-pkcs12"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {!fileName ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 text-center cursor-pointer transition-all duration-300 rounded-2xl border border-dashed ${
                isDragging
                  ? 'border-neutral-900 bg-neutral-100/80 scale-[1.01]'
                  : 'border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100/60 hover:border-neutral-400'
              }`}
            >
              <p className="text-lg font-display font-medium text-neutral-900">
                Arraste o certificado A1 aqui
              </p>
              <p className="text-sm text-neutral-400 mt-1 font-normal">
                ou clique para escolher o arquivo (.pfx ou .p12)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80">
              <div className="flex items-center gap-3 truncate pr-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {fileName}
                  </p>
                  <p className="text-xs text-neutral-400 font-mono">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Certificado carregado'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-4 decoration-neutral-300 transition-colors shrink-0"
              >
                Trocar arquivo
              </button>
            </div>
          )}
        </div>

        {/* INPUT DE SENHA ULTRA MINIMALISTA (SEM LINHAS, APENAS CURSOR E ESPAÇO) */}
        <div className="space-y-2 pt-2">
          <label className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
            Senha do certificado
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Digite a senha..."
              autoFocus
              className="w-full text-2xl sm:text-3xl font-display font-medium text-neutral-900 placeholder:text-neutral-300 bg-transparent border-none outline-none focus:ring-0 p-0 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 text-neutral-400 hover:text-neutral-900 p-2 transition-colors"
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MENSAGEM DE ERRO */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MENSAGEM DE SUCESSO */}
        {successInfo && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              {successInfo.message || 'Certificado validado com sucesso!'}
              {successInfo.validoAte ? ` (Válido até ${successInfo.validoAte})` : ''}
            </span>
          </div>
        )}

        {/* AÇÕES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-neutral-100">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onPrev}
              disabled={isValidating}
              className="text-neutral-400 hover:text-neutral-900 p-2 transition-colors disabled:opacity-50"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isValidating || !base64Content || !password.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando na Focus...</span>
                </>
              ) : (
                <>
                  <span>Validar e continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onSkipCert}
            disabled={isValidating}
            className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4 decoration-neutral-200 self-start sm:self-auto"
          >
            Configurar certificado depois
          </button>
        </div>
      </form>
    </div>
  );
}
