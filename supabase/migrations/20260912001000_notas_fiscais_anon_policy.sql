-- Permite que o robô de conciliação (server-side/webhook) consulte e insira notas fiscais
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON TABLE public.notas_fiscais TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "notas_fiscais_anon_policy" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_anon_policy" ON public.notas_fiscais
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
