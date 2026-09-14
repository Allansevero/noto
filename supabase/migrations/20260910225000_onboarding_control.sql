-- 1. Adiciona colunas para controle de onboarding e primeiro acesso na tabela medicos
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS onboarding_concluido BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN NOT NULL DEFAULT true;

-- 2. Garante registro para o usuário de teste e qualquer outro usuário sem linha em medicos
INSERT INTO public.medicos (owner_user_id, nome_completo, plano_id, status, onboarding_concluido, primeiro_acesso)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'nome_completo', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  '4fc762f7-7409-4c68-a843-a385195215c0'::uuid,
  'ativo'::status_medico,
  false,
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.medicos m WHERE m.owner_user_id = u.id);

-- 3. Para os médicos antigos já existentes de Allan, marca onboarding_concluido = true
UPDATE public.medicos 
SET onboarding_concluido = true, primeiro_acesso = false 
WHERE owner_user_id != '0c96c3ac-6227-4234-bd9d-9f1dd7392218';

-- 4. Função e trigger para novos usuários criados no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user_medico()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.medicos (owner_user_id, nome_completo, plano_id, status, onboarding_concluido, primeiro_acesso)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    '4fc762f7-7409-4c68-a843-a385195215c0'::uuid,
    'ativo'::status_medico,
    false,
    true
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_medico ON auth.users;
CREATE TRIGGER on_auth_user_created_medico
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_medico();

-- 5. Função RPC para marcar onboarding como concluído pelo próprio médico autenticado
CREATE OR REPLACE FUNCTION public.fn_concluir_onboarding(p_medico_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.medicos
  SET onboarding_concluido = true,
      primeiro_acesso = false,
      atualizado_em = now()
  WHERE id = p_medico_id
    AND owner_user_id = auth.uid();

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RETURN jsonb_build_object('success', true, 'message', 'Onboarding concluído com sucesso');
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Médico não localizado ou sem permissão');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
