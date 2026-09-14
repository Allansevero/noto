-- Migration: Adiciona coluna 'valor_consulta' na tabela de pacientes
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS valor_consulta numeric(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.pacientes.valor_consulta IS 'Valor fixo pré-definido da consulta para o paciente (opcional)';
