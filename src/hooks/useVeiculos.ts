import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Veiculo = Tables<'Veiculos'>;

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVeiculos() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Veiculos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVeiculos(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar veículos');
      } finally {
        setLoading(false);
      }
    }

    fetchVeiculos();
  }, []);

  const refreshVeiculos = async () => {
    try {
      const { data, error } = await supabase
        .from('Veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVeiculos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar veículos');
    }
  };

  return { veiculos, loading, error, refreshVeiculos };
}