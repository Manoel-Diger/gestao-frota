import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type InspectionItem = {
  status: 'ok' | 'nok' | 'na';
  obs?: string;
};

export type InspectionGroup = Record<string, InspectionItem>;

export type Checklist = {
  id: string;
  created_at: string;
  data_inspecao: string;
  placa_veiculo: string;
  placa_implemento: string | null;
  motorista: number;
  motorista_nome: string | null;
  tipo_checklist: string;
  status_final: string;
  total_nao_conformidades: number;
  local_inspecao: string;
  odometro: number;
  assinatura_motorista: boolean;
  visto_lideranca: boolean;
  imagens: string[];
  pneus_rodas: InspectionGroup;
  iluminacao: InspectionGroup;
  fluidos: InspectionGroup;
  seguranca: InspectionGroup;
  cabine: InspectionGroup;
};

export const INSPECTION_GROUPS = {
  pneus_rodas: {
    label: 'Pneus / Rodas',
    items: ['Pneu Dianteiro Esq.', 'Pneu Dianteiro Dir.', 'Pneu Traseiro Esq.', 'Pneu Traseiro Dir.', 'Estepe', 'Rodas e Parafusos', 'Calibragem'],
  },
  iluminacao: {
    label: 'Iluminação',
    items: ['Farol Dianteiro Esq.', 'Farol Dianteiro Dir.', 'Luz de Freio', 'Luz de Ré', 'Seta Esq.', 'Seta Dir.', 'Luz de Placa'],
  },
  fluidos: {
    label: 'Fluidos',
    items: ['Óleo do Motor', 'Fluido de Freio', 'Líquido de Arrefecimento', 'Fluido de Direção', 'Água do Limpador'],
  },
  seguranca: {
    label: 'Segurança',
    items: ['Freio de Serviço', 'Freio de Estacionamento', 'Cinto de Segurança', 'Extintor de Incêndio', 'Triângulo', 'Macaco e Chave de Roda'],
  },
  cabine: {
    label: 'Cabine',
    items: ['Painel de Instrumentos', 'Limpador de Para-brisa', 'Buzina', 'Espelhos Retrovisores', 'Ar Condicionado', 'Bancos e Apoios'],
  },
};

export function buildDefaultGroups(): Record<string, InspectionGroup> {
  const groups: Record<string, InspectionGroup> = {};
  for (const [key, group] of Object.entries(INSPECTION_GROUPS)) {
    groups[key] = {};
    for (const item of group.items) {
      groups[key][item] = { status: 'ok', obs: '' };
    }
  }
  return groups;
}

export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklists = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  return { checklists, loading, error, refetch: fetchChecklists };
}
