import { useState, useEffect, useCallback } from 'react';
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
  assinatura_motorista: string | null;
  visto_lideranca: string | null;
  imagens: string[];
  secoes: any;
  motorista_nome?: string;
  veiculo_info?: string;
};

export type MotoristaSelect = {
  id: number;
  nome: string;
};

export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [motoristas, setMotoristas] = useState<MotoristaSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true);
      
      // CORREÇÃO APLICADA AQUI:
      // Usando a sintaxe 'fk_column_name(campos)' que é mais robusta
      // Assumindo que as colunas FK são 'motorista' e 'veiculo'
      const { data, error } = await supabase
        .from('checklists')
        .select(`
          *,
          motorista:Motoristas(id, nome),
          veiculo:Veiculos(modelo, marca, placa)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map((item: any) => ({
        ...item,
        // CORREÇÃO NA DESESTRUTURAÇÃO:
        // Agora, os dados aninhados virão nas chaves 'motorista' e 'veiculo'
        motorista: item.motorista?.id || item.motorista,
        motorista_nome: item.motorista?.nome || 'N/A',
        veiculo_info: item.veiculo
          ? `${item.veiculo.marca} ${item.veiculo.modelo} (${item.veiculo.placa})`
          : item.placa_veiculo || 'N/A'
      }));

      setChecklists(transformedData as Checklist[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checklists');
      console.error('Erro ao buscar checklists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMotoristasForSelect = async () => {
    try {
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