import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types'; // Importa os tipos gerados

// Define o tipo da função RPC para garantir que a tipagem esteja correta
type GetAlertasListFunction = Database['public']['Functions']['get_alertas_list'];

// O tipo de retorno da sua função RPC
type Alerta = GetAlertasListFunction['Returns'][number];

export function useAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlertas() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_alertas_list');

        if (error) {
          throw error;
        }
        setAlertas(data || []);
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
      const { data, error } = await supabase
        .rpc('get_alertas_list');

      if (error) {
        throw error;
      }
      setAlertas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar alertas');
    }
  };

  return { alertas, loading, error, refreshAlertas };
}