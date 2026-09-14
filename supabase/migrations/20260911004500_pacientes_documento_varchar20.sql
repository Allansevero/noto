-- Altera a coluna cpf da tabela pacientes para suportar CNPJ (14 dígitos) além de CPF (11 dígitos)
ALTER TABLE public.pacientes ALTER COLUMN cpf TYPE VARCHAR(20);
