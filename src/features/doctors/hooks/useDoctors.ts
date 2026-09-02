import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getDoctors,
  deleteDoctor as deleteDoctorRepo,
  archiveDoctor as archiveDoctorRepo,
  unarchiveDoctor as unarchiveDoctorRepo,
  updateDoctor as updateDoctorRepo,
  deleteDoctorsBatch as deleteDoctorsBatchRepo,
  archiveDoctorsBatch as archiveDoctorsBatchRepo,
  unarchiveDoctorsBatch as unarchiveDoctorsBatchRepo,
  subscribeToDoctorsChanges,
} from '../doctors.repository';
import type { Doctor, CreateDoctorInput } from '../types';

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Arquivado'>('Todos');
  const isMounted = useRef(true);

  const fetchDoctors = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await getDoctors();
      if (isMounted.current) {
        setDoctors(data);
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar médicos.');
      }
    } finally {
      if (isMounted.current && isInitial) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchDoctors(true);

    const unsubscribe = subscribeToDoctorsChanges(() => {
      fetchDoctors(false);
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [fetchDoctors]);

  const deleteDoctor = async (id: string) => {
    // Otimista
    setDoctors((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDoctorRepo(id);
    } catch (err) {
      fetchDoctors(false);
      throw err;
    }
  };

  const archiveDoctor = async (id: string) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Arquivado' } : d))
    );
    try {
      await archiveDoctorRepo(id);
    } catch (err) {
      fetchDoctors(false);
      throw err;
    }
  };

  const unarchiveDoctor = async (id: string) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Ativo' } : d))
    );
    try {
      await unarchiveDoctorRepo(id);
    } catch (err) {
      fetchDoctors(false);
      throw err;
    }
  };

  const updateDoctor = async (id: string, input: Partial<CreateDoctorInput>) => {
    try {
      const updated = await updateDoctorRepo(id, input);
      setDoctors((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    } catch (err) {
      fetchDoctors(false);
      throw err;
    }
  };

  const deleteDoctorsBatch = async (ids: string[]) => {
    const idSet = new Set(ids);
    setDoctors((prev) => prev.filter((d) => !idSet.has(d.id)));
    try {
      await deleteDoctorsBatchRepo(ids);
    } catch (err) {
      fetchDoctors(false);
      throw err;
    }
  };

  const archiveDoctorsBatch = async (ids: string[]) => {
    const idSet = new Set(ids);
    setDoctors((prev) =>
      prev.map((d) => (idSet.has(d.id) ? { ...d, status: 'Arquivado' } : d))
    );
    try {
      await archiveDoctorsBatchRepo(ids);
    } catch (err) {
      fetchDoctors(false);
      throw err;
    }
  };

  const unarchiveDoctorsBatch = async (ids: string[]) => {
    const idSet = new Set(ids);
    setDoctors((prev) =>
      prev.map((d) => (idSet.has(d.id) ? { ...d, status: 'Ativo' } : d))
    );
    try {
      await unarchiveDoctorsBatchRepo(ids);
    } catch (err) {
      fetchDoctors(false);
      throw err;
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const searchNormalized = searchQuery.toLowerCase().trim();
      const matchesSearch =
        doc.nome_completo.toLowerCase().includes(searchNormalized) ||
        (doc.especialidade && doc.especialidade.toLowerCase().includes(searchNormalized)) ||
        (doc.cnpj && doc.cnpj.replace(/\D/g, '').includes(searchNormalized.replace(/\D/g, ''))) ||
        (doc.razao_social && doc.razao_social.toLowerCase().includes(searchNormalized));

      const matchesStatus =
        statusFilter === 'Todos'
          ? true
          : doc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [doctors, searchQuery, statusFilter]);

  return {
    doctors: filteredDoctors,
    allDoctors: doctors,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteDoctor,
    archiveDoctor,
    unarchiveDoctor,
    updateDoctor,
    deleteDoctorsBatch,
    archiveDoctorsBatch,
    unarchiveDoctorsBatch,
    refetch: () => fetchDoctors(false),
  };
}
