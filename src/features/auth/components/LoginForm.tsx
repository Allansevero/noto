import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginFormData } from "../types";
import { authService } from "../services/auth.service";
import { Logo } from "@/shared/components/Logo";
import { Loader2, ArrowRight, ShieldCheck, Lock, Mail, Eye, EyeOff } from "lucide-react";

const HERO_IMAGE_URL =
  "https://hjzsxarytuvucdegjqmw.supabase.co/storage/v1/object/public/assets/ChatGPT%20Image%201%20de%20set.%20de%202026,%2019_24_01.png";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(data);
        toast.success("Conta criada com sucesso! Você já pode entrar.");
        setIsSignUp(false);
      } else {
        await authService.signIn(data);
        toast.success("Login efetuado com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro na autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar com o Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      {/* ─── LADO ESQUERDO: FORMULÁRIO DE LOGIN (50% DESKTOP) ─── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 overflow-y-auto">
        {/* Topo: Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Acesso Seguro
          </span>
        </div>

        {/* Centro: Formulário de Autenticação */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
              {isSignUp ? "Crie sua conta" : "Acesse sua conta"}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isSignUp
                ? "Cadastre-se para começar a gerenciar emissões de NFS-e de médicos."
                : "Entre com suas credenciais ou conta Google para acessar o painel."}
            </p>
          </div>

          {/* 1. BOTÃO DO GOOGLE (PRIMEIRO / DESTAQUE / BRANCO) */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-10 text-xs font-semibold rounded-none border border-neutral-300 dark:border-neutral-700 bg-white hover:bg-neutral-100 text-black hover:text-black transition-all gap-2.5 shadow-2xs cursor-pointer"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-700" />
              ) : (
                <GoogleIcon />
              )}
              <span>{isGoogleLoading ? "Conectando ao Google..." : "Continuar com o Google"}</span>
            </Button>

            {/* Divisor "ou continue com e-mail" */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative bg-background px-2 text-[10px] uppercase font-mono font-medium text-muted-foreground">
                ou com e-mail e senha
              </div>
            </div>
          </div>

          {/* 2. FORMULÁRIO DE E-MAIL E SENHA COM ÍCONES INTERNOS */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-foreground">
                      E-mail Profissional
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="nome@clinica.com.br"
                          className="h-9 text-xs rounded-none bg-background border-border pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium text-foreground">
                        Senha
                      </FormLabel>
                      {!isSignUp && (
                        <span className="text-[10px] text-muted-foreground hover:underline cursor-pointer">
                          Esqueceu a senha?
                        </span>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-9 text-xs font-mono rounded-none bg-background border-border pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full h-9 text-xs font-semibold rounded-none bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black shadow-xs gap-1.5 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? "Criar Conta" : "Entrar no Sistema"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? (
                    <>
                      Já possui uma conta? <strong className="text-foreground font-semibold">Entrar aqui</strong>
                    </>
                  ) : (
                    <>
                      Não tem uma conta? <strong className="text-foreground font-semibold">Cadastre-se</strong>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Form>


        </div>

        {/* Rodapé Seguro */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Criptografia de ponta a ponta</span>
          </div>
          <span>Noto SaaS &copy; 2026</span>
        </div>
      </div>

      {/* ─── LADO DIREITO: IMAGEM HERO SEM RADIUS (50% DESKTOP) ─── */}
      <div className="hidden lg:block lg:w-1/2 relative bg-black h-screen overflow-hidden rounded-none border-l border-border">
        <img
          src={HERO_IMAGE_URL}
          alt="MedNotas - Plataforma Inteligente de Gestão e NFS-e para Médicos"
          className="w-full h-full object-cover object-center rounded-none select-none pointer-events-none"
        />
        {/* Overlay sutil de profundidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none rounded-none" />
      </div>
    </div>
  );
}
