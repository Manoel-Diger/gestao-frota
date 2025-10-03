import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Alerta = {
  id: number;
  created_at: string;
  id_referencia: string | null;
  motorista: string | null;
  prioridade: string | null;
  descricao: string | null;
  ativo: boolean | null;
  veiculo: string | null;
  tipo_alerta: string | null;
};

export function useAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlertas() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('Alertas')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAlertas((data as unknown as Alerta[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar alertas');
      } finally {
        setLoading(false);
      }
    }

    fetchAlertas();
  }, []);

  const refreshAlertas = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('Alertas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlertas((data as unknown as Alerta[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar alertas');
    }
  };

  return { alertas, loading, error, refreshAlertas };
}
