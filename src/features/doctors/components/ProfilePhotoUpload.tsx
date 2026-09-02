import React, { useState, useRef } from "react";
import { UploadCloud, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/shared/utils";
import { uploadDoctorAvatar } from "../services/avatar.service";
import { toast } from "sonner";

interface ProfilePhotoUploadProps {
  value?: string;
  onChange: (photoUrl: string) => void;
  className?: string;
}

export function ProfilePhotoUpload({
  value,
  onChange,
  className,
}: ProfilePhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG ou WEBP).");
      return;
    }

    setIsUploading(true);
    setProgress(15);

    // Animação de progresso suave
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          return 85;
        }
        return prev + 20;
      });
    }, 100);

    try {
      // Faz o upload direto no bucket "avatares"
      const publicUrl = await uploadDoctorAvatar(file, "avatar");

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        onChange(publicUrl);
        toast.success("Foto salva no bucket 'avatares' com sucesso!");
      }, 250);
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setProgress(0);
      toast.error("Erro ao enviar foto para o bucket avatares: " + (err.message || ""));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {value && !isUploading ? (
        // Preview com opção de troca/remoção
        <div className="relative group border border-border bg-card p-4 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border bg-muted rounded-full" style={{ borderRadius: "100%" }}>
            <img
              src={value}
              alt="Foto de Perfil"
              className="h-full w-full object-cover rounded-full"
              style={{ borderRadius: "100%" }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B7F20B]">
              <CheckCircle className="h-4 w-4" />
              <span>Foto salva no bucket avatares</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Avatar pronto para exibição no perfil do médico.
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-foreground hover:underline"
              >
                Alterar foto
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-medium text-destructive hover:underline"
              >
                Remover
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remover foto"
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Dropzone grande com bordas tracejadas
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "cursor-pointer border-2 border-dashed transition-all p-6 text-center flex flex-col items-center justify-center gap-3",
            isDragging
              ? "border-[#B7F20B] bg-[#B7F20B]/5"
              : "border-border/80 hover:border-foreground/40 bg-card/50",
            isUploading && "pointer-events-none opacity-90"
          )}
        >
          {isUploading ? (
            <div className="w-full max-w-xs space-y-3 py-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <ImageIcon className="h-4 w-4 text-[#B7F20B] animate-pulse" />
                  Salvando no bucket avatares...
                </span>
                <span className="font-mono text-xs font-semibold">{progress}%</span>
              </div>
              {/* Barra de progresso animada */}
              <div className="h-2 w-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-[#B7F20B] transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-muted border border-border">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Arraste a foto do médico ou clique para navegar
                </p>
                <p className="text-xs text-muted-foreground">
                  A imagem será armazenada automaticamente no bucket de avatares
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
