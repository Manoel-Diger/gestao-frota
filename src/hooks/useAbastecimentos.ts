import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Abastecimento = Tables<'Abastecimentos'>;

export function useAbastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAbastecimentos() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Abastecimentos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAbastecimentos(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar abastecimentos');
      } finally {
        setLoading(false);
      }
    }

    fetchAbastecimentos();
  }, []);

  const refreshAbastecimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('Abastecimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAbastecimentos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar abastecimentos');
    }
  };

  return { abastecimentos, loading, error, refreshAbastecimentos };
}
