"use client"

import * as React from "react"
import {
  X,
  Mail,
  BadgeCheck,
  Camera,
  Loader2,
  Check,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FiscalGlyphMatrix } from "@/components/FiscalGlyphMatrix"
import { uploadAvatar, updateDoctorProfile } from "@/features/auth/auth.repository"
import type { DoctorProfile } from "@/features/auth/types"

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  doctor: DoctorProfile | null
  onProfileUpdated?: (updated: Partial<DoctorProfile>) => void
}

export function ProfileDrawer({
  isOpen,
  onClose,
  doctor,
  onProfileUpdated,
}: ProfileDrawerProps) {
  // Divide nome completo em primeiro nome e sobrenome
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [whatsapp, setWhatsapp] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined)

  const [isUploading, setIsUploading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Sincroniza campos com o perfil do médico quando abrir
  React.useEffect(() => {
    if (doctor) {
      const parts = (doctor.nome_completo || "").trim().split(/\s+/)
      setFirstName(parts[0] || "")
      setLastName(parts.slice(1).join(" ") || "")
      setEmail(doctor.email || "dr.teste@notomed.com.br")
      setWhatsapp(doctor.telefone || "")
      setAvatarUrl(doctor.avatar_url)
    }
  }, [doctor, isOpen])

  // Máscara de telefone brasileiro: (DD) 99999-9999
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 11) value = value.slice(0, 11)

    let formatted = ""
    if (value.length > 0) formatted = "(" + value.substring(0, 2)
    if (value.length > 2) formatted += ") " + value.substring(2, 7)
    if (value.length > 7) formatted += "-" + value.substring(7, 11)

    setWhatsapp(formatted)
  }

  // Upload de foto de perfil para o bucket 'perfis'
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !doctor?.id) return

    setIsUploading(true)
    try {
      const res = await uploadAvatar(file, doctor.id)
      if (res.success && res.url) {
        setAvatarUrl(res.url)
        await updateDoctorProfile(doctor.id, { avatar_url: res.url })
        onProfileUpdated?.({ avatar_url: res.url })
      }
    } catch (err) {
      console.error("Erro no upload do avatar:", err)
    } finally {
      setIsUploading(false)
    }
  }

  // Salvar alterações de perfil
  const handleSave = async () => {
    if (!doctor?.id) return
    setIsSaving(true)
    setFeedbackMsg(null)

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")
    try {
      const res = await updateDoctorProfile(doctor.id, {
        nome_completo: fullName,
        telefone: whatsapp,
        avatar_url: avatarUrl,
      })

      if (res.success) {
        onProfileUpdated?.({
          nome_completo: fullName,
          telefone: whatsapp,
          avatar_url: avatarUrl,
        })
        setFeedbackMsg("Perfil salvo com sucesso!")
        setTimeout(() => {
          setFeedbackMsg(null)
          onClose()
        }, 1200)
      } else {
        setFeedbackMsg(res.error || "Erro ao salvar alterações.")
      }
    } catch {
      setFeedbackMsg("Erro inesperado ao salvar.")
    } finally {
      setIsSaving(false)
    }
  }

  const initials = firstName ? (firstName[0] + (lastName[0] || "")).toUpperCase() : "DR"

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="bg-black/30 backdrop-blur-[2px]"
        className="inset-y-3 right-3 sm:inset-y-4 sm:right-4 h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md p-0 overflow-hidden rounded-2xl border border-border bg-card flex flex-col z-50 text-foreground shadow-xl shadow-black/15 [&>button:last-child]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Perfil do Usuário</SheetTitle>
          <SheetDescription>Visualizar e editar detalhes da sua conta</SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pb-24">
          {/* Header Cover com animação de glifos do banner */}
          <div className="relative h-36 w-full rounded-t-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-border/40 overflow-hidden select-none">
            {/* Camada animada de matriz de glifos fiscais */}
            <div
              className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40"
              style={{
                maskImage:
                  "radial-gradient(ellipse 60% 90% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 60% 90% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
              }}
            >
              <FiscalGlyphMatrix
                color="rgba(62, 207, 142, 0.45)"
                accentColor="#3ecf8e"
              />
            </div>
            {/* Glows sutis */}
            <div className="absolute top-0 left-0 w-32 h-full bg-[#3ecf8e]/10 blur-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-full bg-[#006239]/15 blur-xl pointer-events-none" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-xs rounded-full text-white/90 hover:text-white transition-colors cursor-pointer z-10"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Profile Section (Avatar e Informações Básicas) */}
          <div className="px-6 relative pb-5 border-b border-border">
            <div className="flex justify-between items-end -mt-12 mb-3">
              {/* Avatar com upload no bucket perfis */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  title="Clique para alterar a foto de perfil"
                  className="size-24 rounded-full border-4 border-card overflow-hidden bg-muted shadow-md relative z-10 cursor-pointer group"
                >
                  <Avatar className="size-full">
                    <AvatarImage src={avatarUrl} alt={firstName} className="object-cover" />
                    <AvatarFallback className="bg-muted text-foreground font-semibold text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    {isUploading ? (
                      <Loader2 className="size-5 text-white animate-spin" />
                    ) : (
                      <Camera className="size-5 text-white" />
                    )}
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 z-20 bg-card rounded-full p-0.5 shadow-xs">
                  <BadgeCheck className="size-5 text-blue-500 fill-card" />
                </div>
              </div>
            </div>

            {/* Nome e Status */}
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h2 className="text-lg font-bold text-foreground font-sans">
                  {firstName} {lastName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted border border-border text-foreground-light">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Assinante
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          {/* Linha de Estatísticas */}
          <div className="px-6 py-4 border-b border-border grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assinante desde</p>
              <p className="text-xs font-semibold text-foreground">Março, 2026</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Plano atual</p>
              <p className="text-xs font-semibold text-emerald-500 font-medium truncate">
                {doctor?.plano_nome || "Noto Med"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notas emitidas</p>
              <p className="text-xs font-semibold text-foreground">12</p>
            </div>
          </div>

          {/* Formulário de Edição */}
          <div className="px-6 py-5 space-y-5">
            {/* Campos de Nome */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Nome
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] text-muted-foreground mb-1">Primeiro nome</span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-input rounded-md bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-all"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground mb-1">Sobrenome</span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-input rounded-md bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Campo de E-mail */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Endereço de e-mail
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="size-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full pl-9 pr-3 py-1.5 border border-input rounded-md bg-muted/40 text-xs text-foreground opacity-85 cursor-not-allowed"
                />
              </div>
              <div className="mt-1.5 flex items-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                <BadgeCheck className="size-3.5 mr-1" /> Verificado em 2 Jan, 2026
              </div>
            </div>

            {/* Campo de WhatsApp (com Validar WhatsApp apagado / Em breve) */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                WhatsApp
              </label>
              <div className="relative rounded-md flex items-center border border-input bg-background focus-within:border-ring transition-all overflow-hidden">
                <div className="pl-3 pr-2 py-1.5 flex items-center justify-center bg-muted/50 border-r border-border">
                  {/* Bandeira do Brasil */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" className="w-4 h-4 mr-1 rounded-xs">
                    <rect width="72" height="72" fill="#5EAA22" />
                    <polygon points="36,11 65,36 36,61 7,36" fill="#FCDC34" />
                    <circle cx="36" cy="36" r="14" fill="#002776" />
                    <path d="M 23 36 C 23 32 30 25 36 25 C 42 25 49 32 49 36" fill="transparent" stroke="#fff" strokeWidth="2.5" />
                  </svg>
                  <span className="text-muted-foreground text-xs font-medium">+55</span>
                </div>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  placeholder="(DD) 99999-9999"
                  className="flex-1 min-w-0 block w-full px-3 py-1.5 text-xs text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Validar WhatsApp: apagado / Em breve */}
              <div className="mt-2 flex items-center justify-between text-xs opacity-50 select-none py-1 px-1 rounded bg-muted/20 border border-dashed border-border">
                <span className="text-muted-foreground text-[11px]">Validar o WhatsApp</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
                  Em breve
                </span>
              </div>
            </div>

            {/* Mensagem de Feedback */}
            {feedbackMsg && (
              <div className="text-xs p-2 rounded bg-muted/60 text-foreground flex items-center gap-1.5 border border-border">
                <Check className="size-3.5 text-emerald-500" />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé Fixo (Sticky Footer) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border flex justify-end gap-2.5 z-20 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
            <span>Salvar alterações</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
