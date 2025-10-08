import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Veiculo = Tables<'Veiculos'> & {
  Motoristas?: {
    id: number;
    nome: string | null;
  } | null;
};

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Função centralizada de busca
  const fetchVeiculos = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase
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
      setVeiculos(data || []);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  // 🔁 Atualização manual
  const refreshVeiculos = async (): Promise<void> => {
    await fetchVeiculos();
  };

  // ❌ Exclusão de veículo
  const deleteVeiculo = async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from('Veiculos').delete().eq('id', id);
      if (error) throw error;
      await fetchVeiculos(); // Atualiza após exclusão
      return true;
    } catch (err) {
      console.error('Erro ao excluir veículo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir veículo');
      return false;
    }
  };

  return { veiculos, loading, error, refreshVeiculos, deleteVeiculo };
}
