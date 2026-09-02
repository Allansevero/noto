import { supabase } from '@/lib/supabase/client';
import type { LoginFormData } from '../types';

export const authService = {
  async signIn(data: LoginFormData) {
    const { error, data: sessionData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;
    return sessionData;
  },

  async signUp(data: LoginFormData) {
    const { error, data: sessionData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;
    return sessionData;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account', // Sempre exibe a tela de seleção de conta do Google
          access_type: 'offline',
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
