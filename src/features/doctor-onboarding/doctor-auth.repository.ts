import { supabase } from '@/lib/supabase/client';

export interface DoctorAuthResult {
  success: boolean;
  userId?: string;
  session?: boolean;
  source: 'supabase_auth' | 'local';
  error?: string;
}

/**
 * Cria a conta de autenticação do médico no Supabase Auth e já faz login automático.
 * Usa o email como identificador e o código PIN de 6 dígitos como senha temporária.
 * O médico poderá redefinir a senha depois via "esqueci minha senha".
 */
export async function signUpDoctor(
  email: string,
  nomeCompleto: string,
  pinCode: string
): Promise<DoctorAuthResult> {
  if (!supabase) {
    console.warn('[DoctorAuth] Supabase não configurado. Pulando criação de conta.');
    return { success: true, source: 'local', error: 'Supabase não configurado.' };
  }

  const senhaTemporaria = `Noto@${pinCode}!`; // ex: "Noto@849201!"

  try {
    // 1. Tenta criar a conta
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: senhaTemporaria,
      options: {
        data: {
          nome_completo: nomeCompleto,
          tipo_usuario: 'medico',
          onboarding_concluido: false,
        },
      },
    });

    if (signUpError) {
      // Se o email já existe, tenta fazer login com o PIN atual
      if (signUpError.message?.toLowerCase().includes('already registered') ||
          signUpError.message?.toLowerCase().includes('already been registered') ||
          signUpError.status === 422) {
        console.warn('[DoctorAuth] Email já cadastrado. Tentando signIn...');
        return await signInDoctor(email, senhaTemporaria);
      }

      console.error('[DoctorAuth] Erro no signUp:', signUpError.message);
      return { success: false, source: 'supabase_auth', error: signUpError.message };
    }

    const userId = signUpData?.user?.id;
    const hasSession = !!signUpData?.session;

    console.log('[DoctorAuth] Conta criada no Supabase Auth. UserID:', userId, '| Sessão ativa:', hasSession);

    // 2. Se não gerou sessão automaticamente (email confirmation enabled), faz signIn
    if (!hasSession && userId) {
      const signInResult = await signInDoctor(email, senhaTemporaria);
      return { ...signInResult, userId };
    }

    return { success: true, userId, session: hasSession, source: 'supabase_auth' };
  } catch (err: any) {
    console.error('[DoctorAuth] Exceção ao criar conta:', err?.message);
    return { success: false, source: 'supabase_auth', error: err?.message };
  }
}

/**
 * Faz login do médico no Supabase Auth com email + senha.
 */
async function signInDoctor(email: string, senha: string): Promise<DoctorAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: senha,
    });

    if (error) {
      return { success: false, source: 'supabase_auth', error: error.message };
    }

    return {
      success: true,
      userId: data?.user?.id,
      session: !!data?.session,
      source: 'supabase_auth',
    };
  } catch (err: any) {
    return { success: false, source: 'supabase_auth', error: err?.message };
  }
}

/**
 * Retorna o ID do usuário autenticado atualmente no Supabase Auth.
 */
export async function getCurrentAuthUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}
