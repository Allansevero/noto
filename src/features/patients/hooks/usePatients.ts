import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Patient } from '../types';
import {
  getPatientsByDoctor,
  approvePatientPayment,
  generatePatientInvoice,
  subscribeToPatientsChanges,
} from '../patients.repository';

export function usePatients(medicoId?: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const isMounted = useRef(true);

  const fetchPatients = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await getPatientsByDoctor(medicoId);
      if (isMounted.current) {
        setPatients(data);
      }

      // Se houver pacientes em processamento, sincroniza com a Focus NF-e em background
      const hasProcessing = data.some((p) => p.status === 'Processando emissão');
      if (hasProcessing) {
        import('../services/nfseEmission.service').then(({ syncPendingInvoices }) => {
          syncPendingInvoices().then((updated) => {
            if (updated > 0 && isMounted.current) {
              getPatientsByDoctor(medicoId).then((refreshed) => {
                if (isMounted.current) setPatients(refreshed);
              });
            }
          });
        });
      }
    } catch (fetchError: any) {
      if (isMounted.current) {
        setError(fetchError.message || 'Erro ao carregar pacientes.');
      }
    } finally {
      if (isMounted.current && isInitial) {
        setIsLoading(false);
      }
    }
  }, [medicoId]);

  useEffect(() => {
    isMounted.current = true;
    fetchPatients(true);

    // Supabase Realtime via repository com canal único e isolamento seguro
    const unsubscribe = subscribeToPatientsChanges(() => {
      fetchPatients(false);
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [fetchPatients]);

  const approvePayment = async (patientId: string) => {
    const now = new Date().toISOString();

    // Atualização otimista local imediata (sem refresh)
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, status: 'Aprovado', data_pagamento: now } : p
      )
    );

    try {
      await approvePatientPayment(patientId);
    } catch (updateError) {
      fetchPatients(false);
      throw updateError;
    }
  };

  const generateInvoice = async (patientId: string, dataConsulta?: string) => {
    // Atualização otimista local para 'Processando emissão' (sem refresh)
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, status: 'Processando emissão', nfse_erro_motivo: undefined } : p
      )
    );

    try {
      const res = await generatePatientInvoice(patientId, dataConsulta);
      if (res.status && isMounted.current) {
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? { ...p, status: res.status } : p))
        );
      }

      // Polling inteligente: consulta a Focus após 3s e 7s para atualizar o retorno da prefeitura
      setTimeout(async () => {
        try {
          const { checkNfseStatus } = await import('../services/nfseEmission.service');
          const checkRes = await checkNfseStatus(patientId);
          if (isMounted.current && checkRes.status !== 'Processando emissão') {
            fetchPatients(false);
          }
        } catch (_) {}
      }, 3000);

      setTimeout(async () => {
        try {
          const { checkNfseStatus } = await import('../services/nfseEmission.service');
          void (await checkNfseStatus(patientId));
          if (isMounted.current) {
            fetchPatients(false);
          }
        } catch (_) {}
      }, 7000);
    } catch (err) {
      fetchPatients(false);
      throw err;
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const searchNormalized = searchQuery.toLowerCase().trim();
      const matchesSearch =
        patient.nome_completo.toLowerCase().includes(searchNormalized) ||
        patient.cpf.replace(/\D/g, '').includes(searchNormalized.replace(/\D/g, ''));

      const matchesStatus = statusFilter === 'Todos' || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  const addPatient = useCallback((patient: Patient) => {
    setPatients((prev) => [patient, ...prev]);
  }, []);

  return {
    patients: filteredPatients,
    allPatients: patients, // Lista completa sem filtro para contagem de métricas
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    approvePayment,
    generateInvoice,
    addPatient,
    refetch: () => fetchPatients(false),
  };
}
