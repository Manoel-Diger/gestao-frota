import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Assumindo que você usa este caminho para seus tipos
import type { Database, Tables } from '@/integrations/supabase/types'; 

// === TIPOS LOCAIS (MANTIDOS) ===
export type Checklist = Tables<'checklists'> & {
    Motoristas: Tables<'Motoristas'> | null;
    Veiculos: Tables<'Veiculos'> | null;
    
    motorista_nome: string; 
    veiculo_info: string;
};

export type MotoristaSelect = {
    id: number;
    nome: string;
};
// ===============================


export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [motoristas, setMotoristas] = useState<MotoristaSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true);

      // SOLUÇÃO LIMPA: Query com aspas duplas (Case-Sensitive) e SEM COMENTÁRIOS
      const { data, error } = await supabase
        .from('checklists')
        .select(`
          *,
          "Motoristas"(id, nome), 
          "Veiculos"(modelo, marca, placa)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapeamento de dados
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        motorista_nome: item.Motoristas?.nome || 'N/A', 
        veiculo_info: item.Veiculos
          ? `${item.Veiculos.marca} ${item.Veiculos.modelo} (${item.Veiculos.placa})`
          : item.placa_veiculo || 'N/A',
        
        Motoristas: item.Motoristas,
        Veiculos: item.Veiculos,
      })) as Checklist[];

      setChecklists(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checklists');
      console.error('Erro ao buscar checklists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMotoristasForSelect = async () => {
    try {
      // MAIÚSCULO na chamada .from('Motoristas')
      const { data, error } = await supabase
        .from('Motoristas') 
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;
      
      setMotoristas(data as MotoristaSelect[]);
    } catch (err) {
      console.error('Erro ao buscar motoristas para o select:', err);
    }
  };

  useEffect(() => {
    fetchChecklists();
    fetchMotoristasForSelect();
  }, [fetchChecklists]);

  return { checklists, motoristas, loading, error, refetch: fetchChecklists };
}