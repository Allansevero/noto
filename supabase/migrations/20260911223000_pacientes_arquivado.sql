-- Migration: Adiciona coluna 'arquivado' na tabela de pacientes
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.pacientes.arquivado IS 'Indica se o paciente foi arquivado pelo médico';
