import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type Manutencao = Tables<'Manutencoes'>;
type ManutencaoInsert = Omit<TablesInsert<'Manutencoes'>, 'id' | 'created_at'>;

export function useManutencoes() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManutencoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Manutencoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setManutencoes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar manutenções');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchManutencoes();
  }, [fetchManutencoes]);

  const createManutencao = useCallback(async (manutencaoData: ManutencaoInsert) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('Manutencoes')
        .insert(manutencaoData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Falha ao criar a manutenção.');

      setManutencoes((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar manutenção.';
      setError(message);
      console.error(message, err);
      return null;
    }
  }, []);

  const updateManutencao = useCallback(async (id: number, updateData: Partial<ManutencaoInsert>) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('Manutencoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Falha ao atualizar a manutenção.');

      setManutencoes((prev) =>
        prev.map((man) => (man.id === id ? data : man))
      );
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar manutenção.';
      setError(message);
      console.error(message, err);
      return null;
    }
  }, []);

  const deleteManutencao = useCallback(async (id: number) => {
    setError(null);
    try {
      const { error } = await supabase.from('Manutencoes').delete().eq('id', id);

      if (error) throw error;

      setManutencoes((prev) => prev.filter((man) => man.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar manutenção.';
      setError(message);
      console.error(message, err);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchManutencoes();
  }, [fetchManutencoes]);

  const refreshManutencoes = refetch;

  return {
    manutencoes,
    loading,
    error,
    refetch,
    refreshManutencoes,
    createManutencao,
    updateManutencao,
    deleteManutencao,
    clearError,
  };
}