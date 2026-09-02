import { useState, useCallback } from 'react';
import type { Patient } from '../types';
import { createPatient, type CreatePatientInput } from '../patients.repository';

interface UseCreatePatientResult {
  isLoading: boolean;
  error: string | null;
  duplicateId: string | null;
  create: (input: CreatePatientInput) => Promise<Patient | null>;
  reset: () => void;
}

export function useCreatePatient(): UseCreatePatientResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const create = useCallback(async (input: CreatePatientInput): Promise<Patient | null> => {
    setIsLoading(true);
    setError(null);
    setDuplicateId(null);

    try {
      const patient = await createPatient(input);
      return patient;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado.';

      if (message.startsWith('CPF_DUPLICATE:')) {
        setDuplicateId(message.replace('CPF_DUPLICATE:', ''));
        setError('Este CPF já está cadastrado para este médico.');
      } else {
        setError(message);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setDuplicateId(null);
  }, []);

  return { isLoading, error, duplicateId, create, reset };
}
