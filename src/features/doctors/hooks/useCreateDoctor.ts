import { useState, useCallback } from 'react';
import { createDoctor } from '../doctors.repository';
import type { CreateDoctorInput, Doctor } from '../types';

interface UseCreateDoctorResult {
  isLoading: boolean;
  error: string | null;
  create: (input: CreateDoctorInput) => Promise<Doctor | null>;
  reset: () => void;
}

export function useCreateDoctor(): UseCreateDoctorResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateDoctorInput): Promise<Doctor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await createDoctor(input);
    } catch (err: unknown) {
      console.error('Falha em useCreateDoctor:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Erro ao cadastrar médico no banco de dados.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { isLoading, error, create, reset };
}
