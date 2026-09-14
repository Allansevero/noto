-- Adiciona coluna status e cancelada_em em notas_fiscais
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'autorizada',
  ADD COLUMN IF NOT EXISTS cancelada_em timestamptz DEFAULT NULL;

-- Atualiza notas existentes
UPDATE public.notas_fiscais
SET status = 'autorizada'
WHERE status IS NULL;

-- Função para cancelar nota fiscal
CREATE OR REPLACE FUNCTION public.fn_cancelar_nota_fiscal(
  p_nota_id uuid,
  p_medico_id uuid
)
RETURNS jsonb AS $$
BEGIN
  UPDATE public.notas_fiscais
  SET status = 'cancelada',
      cancelada_em = now()
  WHERE id = p_nota_id
    AND medico_id = p_medico_id;

  RETURN jsonb_build_object('success', true, 'message', 'Nota cancelada com sucesso.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_cancelar_nota_fiscal(uuid, uuid) TO authenticated, anon, service_role;
