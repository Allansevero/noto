-- Migration: 20260913110000_fix_google_auth_trigger.sql
-- Corrige a trigger on_auth_user_created_medico para permitir o cadastro/login via Google OAuth sem erro de schema/type 'status_medico'

-- 1. Garante permissão de uso do schema public e do tipo status_medico para supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin, service_role;

-- 2. Recria a função handle_new_user_medico com SECURITY DEFINER e search_path seguro
CREATE OR REPLACE FUNCTION public.handle_new_user_medico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  default_plano_id uuid;
  user_name text;
  user_avatar text;
BEGIN
  -- Identifica o plano padrão
  SELECT id INTO default_plano_id FROM public.planos LIMIT 1;
  IF default_plano_id IS NULL THEN
    default_plano_id := '4fc762f7-7409-4c68-a843-a385195215c0'::uuid;
  END IF;

  -- Extrai nome do usuário vindo dos metadados do Google / OAuth ou do email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'nome_completo',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Médico'
  );

  -- Extrai foto do Google
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Insere ou atualiza o perfil do médico em public.medicos
  INSERT INTO public.medicos (
    owner_user_id,
    nome_completo,
    avatar_url,
    plano_id,
    status,
    onboarding_concluido,
    primeiro_acesso
  )
  VALUES (
    NEW.id,
    user_name,
    user_avatar,
    default_plano_id,
    'ativo'::public.status_medico,
    false,
    true
  )
  ON CONFLICT (owner_user_id) DO UPDATE SET
    nome_completo = CASE 
      WHEN public.medicos.nome_completo IS NULL OR public.medicos.nome_completo = 'Médico' 
      THEN COALESCE(EXCLUDED.nome_completo, public.medicos.nome_completo) 
      ELSE public.medicos.nome_completo 
    END,
    avatar_url = COALESCE(public.medicos.avatar_url, EXCLUDED.avatar_url);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de qualquer falha na tabela medicos, nunca aborta a criação do usuário em auth.users
  RAISE WARNING 'handle_new_user_medico falhou para o user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Garante que o trigger está associado a auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_medico ON auth.users;
CREATE TRIGGER on_auth_user_created_medico
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_medico();
