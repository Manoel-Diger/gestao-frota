import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Json } from '@/integrations/supabase/types';

interface ChecklistItem {
  descricao: string;
  conforme: boolean;
  observacoes?: string;
}

export interface ChecklistSecaoContent {
  titulo: string;
  itens: ChecklistItem[];
}

export type ChecklistSecoesType = Record<string, ChecklistSecaoContent>;

export type ChecklistDisplay = Omit<Tables<'checklists'>, 'secoes' | 'imagens'> & {
  secoes: ChecklistSecoesType;
  imagens: string[] | null;
};

export type ChecklistInsert = Omit<
  TablesInsert<'checklists'>,
  'id' | 'created_at' | 'updated_at' | 'secoes' | 'total_nao_conformidades'
> & {
  secoes: ChecklistSecoesType;
  total_nao_conformidades?: number;
};

export type ChecklistUpdate = Partial<ChecklistInsert> & {
  id: string;
};

const validateAndConvertSecoes = (secoesJson: Json | null): ChecklistSecoesType => {
  if (!secoesJson || typeof secoesJson !== 'object') {
    return {};
  }
  return secoesJson as unknown as ChecklistSecoesType;
};

const toChecklistDisplay = (row: Tables<'checklists'>): ChecklistDisplay => {
  return {
    ...(row as any),
    secoes: validateAndConvertSecoes(row.secoes),
    imagens: Array.isArray(row.imagens) ? (row.imagens as string[]) : null,
  };
};

const STORAGE_KEY = 'persisted_checklists';

export function useChecklists() {
  const [checklists, setChecklists] = useState<ChecklistDisplay[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored ? (JSON.parse(stored) as ChecklistDisplay[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(checklists.length === 0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const persistChecklists = (data: ChecklistDisplay[]) => {
    setChecklists(data);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Erro ao persistir checklists no localStorage', err);
      }
    }
  };

  const createChecklist = useCallback(
    async (checklistData: ChecklistInsert) => {
      setError(null);
      try {
        const insertPayload: any = {
          ...checklistData,
          secoes: checklistData.secoes as unknown as Json,
          total_nao_conformidades: checklistData.total_nao_conformidades ?? 0,
        };

        const { data, error } = await supabase
          .from('checklists')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Falha ao criar o checklist.');

        const createdChecklist = toChecklistDisplay(data);
        persistChecklists([...checklists, createdChecklist]);

        return createdChecklist;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao criar checklist.';
        setError(message);
        console.error(message, err);
        return null;
      }
    },
    [checklists]
  );

  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('data_inspecao', { ascending: false });

      if (error) throw error;

      const convertedData = (data || []).map(toChecklistDisplay);
      persistChecklists(convertedData);

      return convertedData;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar checklists.';
      setError(message);
      console.error(message, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getChecklistById = useCallback(async (id: string) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return toChecklistDisplay(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao buscar checklist.';
      setError(message);
      console.error(message, err);
      return null;
    }
  }, []);

  const updateChecklist = useCallback(
    async (id: string, updateData: ChecklistUpdate) => {
      setError(null);
      try {
        const finalUpdateData: any = {
          ...updateData,
          secoes: updateData.secoes
            ? (updateData.secoes as unknown as Json)
            : undefined,
        };

        const { data, error } = await supabase
          .from('checklists')
          .update(finalUpdateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Falha ao atualizar o checklist.');

        const updatedChecklist = toChecklistDisplay(data);
        persistChecklists(
          checklists.map(c => (c.id === id ? updatedChecklist : c))
        );

        return updatedChecklist;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao atualizar checklist.';
        setError(message);
        console.error(message, err);
        return null;
      }
    },
    [checklists]
  );

  const deleteChecklist = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const { error } = await supabase.from('checklists').delete().eq('id', id);

        if (error) throw error;

        persistChecklists(checklists.filter(c => c.id !== id));
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao deletar checklist.';
        setError(message);
        console.error(message, err);
        return false;
      }
    },
    [checklists]
  );

  // Auto-fetch no client ao montar caso não haja dados persistidos.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Se já temos checklists no estado, não precisa buscar novamente.
    if (checklists.length > 0) {
      setLoading(false);
      return;
    }
    // Busca inicial
    fetchChecklists().catch(err => {
      console.error('Erro no fetch inicial de checklists', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intencionalmente com array vazio para executar apenas no mount

  return {
    checklists,
    loading,
    error,
    clearError,
    fetchChecklists,
    getChecklistById,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    refetch: fetchChecklists,
  };
}
