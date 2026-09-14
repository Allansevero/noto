-- Concede permissões completas para authenticated e service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.medico_dados_fiscais TO authenticated, service_role;
GRANT ALL ON TABLE public.medicos TO authenticated, service_role;

-- Garante também para futuras tabelas criadas no schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
