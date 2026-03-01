import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Veiculo = {
  id: number;
  created_at: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number | null;
  quilometragem: number | null;
  status: string | null;
  tipo_combustivel: string | null;
  combustivel_atual: number | null;
  proxima_manutencao: string | null;
  localizacao: string | null;
  motorista: string | null;
  motorista_id: number | null;
  Motoristas?: { id: number; nome: string } | null;
};

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVeiculos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('Veiculos')
        .select(`
          *,
          Motoristas!Veiculos_motorista_id_fkey (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVeiculos((data as Veiculo[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVeiculos();
  }, [fetchVeiculos]);

  const refreshVeiculos = useCallback(async () => {
    await fetchVeiculos();
  }, [fetchVeiculos]);

  const deleteVeiculo = useCallback(async (id: number) => {
    try {
      const { error } = await (supabase as any)
        .from('Veiculos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVeiculos((prev) => prev.filter((v) => v.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir veículo');
      return false;
    }
  }, []);

  return { veiculos, loading, error, refreshVeiculos, deleteVeiculo, refetch: refreshVeiculos };
}
