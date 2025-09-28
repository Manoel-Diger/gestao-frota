import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Tables } from '../integrations/supabase/types';

type Motorista = Tables<'Motoristas'>;

export function useMotoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMotoristas() {
      try {
        setLoading(true);
        // O select('*') já busca a coluna 'placa' se ela existir na tabela
        const { data, error } = await supabase
          .from('Motoristas')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMotoristas(data as Motorista[] || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar motoristas');
      } finally {
        setLoading(false);
      }
    }

    fetchMotoristas();
  }, []);

  const refreshMotoristas = async () => {
    try {
      const { data, error } = await supabase
        .from('Motoristas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMotoristas(data as Motorista[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar motoristas');
    }
  };

  return { motoristas, loading, error, refreshMotoristas };
}
