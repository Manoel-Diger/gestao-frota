import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Relatorio = {
  id: number;
  created_at: string;
  nome_relatorio: string | null;
  tipo_analise: string | null;
  periodo: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  filtros: string | null;
};

export function useReports() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelatorios() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('Relatorios')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRelatorios((data as unknown as Relatorio[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    }

    fetchRelatorios();
  }, []);

  const refreshRelatorios = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('Relatorios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRelatorios((data as unknown as Relatorio[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar relatórios');
    }
  };

  return { relatorios, loading, error, refreshRelatorios };
}
