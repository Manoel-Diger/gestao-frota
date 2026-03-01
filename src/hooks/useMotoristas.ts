import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Motorista = {
  id: number;
  created_at: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: string | null;
  categoria_cnh: string | null;
  validade_cnh: string | null;
  placa: string | null;
};

export function useMotoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMotoristas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('Motoristas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMotoristas((data as Motorista[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar motoristas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMotoristas();
  }, [fetchMotoristas]);

  const refreshMotoristas = useCallback(async () => {
    await fetchMotoristas();
  }, [fetchMotoristas]);

  return { motoristas, loading, error, refreshMotoristas, refetch: refreshMotoristas };
}
