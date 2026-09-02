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
