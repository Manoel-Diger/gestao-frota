import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Checklist = {
  id: string;
  created_at: string;
  data_inspecao: string;
  placa_veiculo: string;
  placa_implemento: string | null;
  motorista: number;
  tipo_checklist: string;
  status_final: string;
  total_nao_conformidades: number;
  local_inspecao: string;
  odometro: number;
  assinatura_motorista: boolean;
  visto_lideranca: boolean;
};

export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChecklists() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('checklists')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setChecklists((data as unknown as Checklist[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar checklists');
      } finally {
        setLoading(false);
      }
    }

    fetchChecklists();
  }, []);

  return { checklists, loading, error };
}
