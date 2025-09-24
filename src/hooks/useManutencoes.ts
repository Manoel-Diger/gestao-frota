import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Manutencao = Tables<'Manutencoes'>;

export function useManutencoes() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchManutencoes() {
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
    }

    fetchManutencoes();
  }, []);

  const refreshManutencoes = async () => {
    try {
      const { data, error } = await supabase
        .from('Manutencoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setManutencoes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar manutenções');
    }
  };

  return { manutencoes, loading, error, refreshManutencoes };
}