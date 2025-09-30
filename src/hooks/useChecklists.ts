import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Importa os tipos originais do Supabase, incluindo o tipo de Row, Insert e Json
import { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

// --------------------------------------------------------------------------------------
// TIPOS DE DADOS ESTRUTURADOS (Tipagem do campo JSONB)
// --------------------------------------------------------------------------------------

interface ChecklistItem {
  descricao: string;
  conforme: boolean;
  observacoes?: string;
}

export interface ChecklistSecaoContent {
  titulo: string;
  itens: ChecklistItem[];
}

// Tipo principal para o campo 'secoes'
export type ChecklistSecoesType = Record<string, ChecklistSecaoContent>;

// --------------------------------------------------------------------------------------
// TIPOS DE DADOS PARA USO NO FRONTEND (Display)
// --------------------------------------------------------------------------------------

// Omitimos 'secoes' e 'imagens' do tipo base gerado pelo Supabase.
export type ChecklistDisplay = Omit<Tables<'checklists'>, 'secoes' | 'imagens'> & {
  secoes: ChecklistSecoesType;
  imagens: string[] | null; 
};

// Tipo para Inserção
export type ChecklistInsert = Omit<TablesInsert<'checklists'>, 'id' | 'created_at' | 'updated_at' | 'secoes' | 'total_nao_conformidades'> & {
  secoes: ChecklistSecoesType;
  total_nao_conformidades?: number;
};

// Tipo para Atualização
export type ChecklistUpdate = Partial<ChecklistInsert> & {
  id: string;
};


// --------------------------------------------------------------------------------------
// LÓGICA DE VALIDAÇÃO E CONVERSÃO
// --------------------------------------------------------------------------------------

/**
 * Valida se o dado JSONB lido do banco corresponde ao ChecklistSecoesType
 * e o converte para o tipo correto.
 */
const validateAndConvertSecoes = (secoesJson: Json | null): ChecklistSecoesType => {
  if (typeof secoesJson !== 'object' || secoesJson === null) {
    return {};
  }
  // Usando asserção dupla para forçar a conversão do tipo Json para o nosso tipo customizado.
  return secoesJson as unknown as ChecklistSecoesType;
};

/**
 * Função utilitária para converter uma Linha do Supabase (Tables<'checklists'>)
 * para o tipo de exibição do Frontend (ChecklistDisplay).
 */
const toChecklistDisplay = (row: Tables<'checklists'>): ChecklistDisplay => {
    return {
        ...(row as any),
        // Chama a função de conversão/validação.
        secoes: validateAndConvertSecoes(row.secoes),
        // Garante que 'imagens' é um array de strings ou null
        imagens: (row.imagens as string[] | null) || null,
    } as ChecklistDisplay;
}


// --------------------------------------------------------------------------------------
// HOOK PRINCIPAL
// --------------------------------------------------------------------------------------

export function useChecklists() {
  const [checklists, setChecklists] = useState<ChecklistDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ------------------------
  // C: CREATE CHECKLIST
  // ------------------------

  const createChecklist = useCallback(async (checklistData: ChecklistInsert) => {
    setError(null);
    try {
      
      // CORREÇÃO DEFINITIVA DO TS(2322) NA ESCRITA (INSERT):
      // Asserção final para 'any' no payload de envio para contornar
      // o conflito de tipo entre a estrutura da TablesInsert e ChecklistInsert.
      const insertPayload: any = {
        ...checklistData,
        // Garante que 'secoes' é enviado como o tipo Json que o Supabase espera no runtime
        secoes: checklistData.secoes as unknown as Json, 
        total_nao_conformidades: checklistData.total_nao_conformidades ?? 0, 
      };
      
      const { data, error } = await supabase
        .from('checklists')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Falha ao criar o checklist.");

      // Usa a função auxiliar para a conversão de tipo (leitura).
      const createdChecklist = toChecklistDisplay(data);

      setChecklists(prev => [...prev, createdChecklist]);
      return createdChecklist;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar checklist.';
      setError(message);
      console.error(message, err);
      return null;
    }
  }, []);


  // ------------------------
  // R: READ CHECKLISTS (ALL)
  // ------------------------

  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('data_inspecao', { ascending: false });

      if (error) throw error;

      // Mapeia usando a função utilitária de conversão (leitura).
      const convertedData = data.map(toChecklistDisplay); 

      setChecklists(convertedData);
      return convertedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar checklists.';
      setError(message);
      console.error(message, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);


  // ------------------------
  // R: READ CHECKLIST (BY ID)
  // ------------------------

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

      // Usa a função auxiliar para a conversão de tipo (leitura).
      const convertedData = toChecklistDisplay(data);

      return convertedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar checklist.';
      setError(message);
      console.error(message, err);
      return null;
    }
  }, []);

  // ------------------------
  // U: UPDATE CHECKLIST
  // ------------------------

  const updateChecklist = useCallback(async (id: string, updateData: ChecklistUpdate) => {
    setError(null);
    try {
      
      // CORREÇÃO DEFINITIVA DO TS(2322) NA ESCRITA (UPDATE):
      // Asserção final para 'any' no payload de envio.
      const finalUpdateData: any = {
        ...updateData,
        // Garante que 'secoes' é enviado como o tipo Json que o Supabase espera no runtime
        secoes: updateData.secoes ? updateData.secoes as unknown as Json : undefined, 
      };

      const { data, error } = await supabase
        .from('checklists')
        .update(finalUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Falha ao atualizar o checklist.");

      // Usa a função auxiliar para a conversão de tipo (leitura).
      const updatedChecklist = toChecklistDisplay(data);


      setChecklists(prev => prev.map(c => (c.id === id ? updatedChecklist : c)));
      return updatedChecklist;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar checklist.';
      setError(message);
      console.error(message, err);
      return null;
    }
  }, [setChecklists]);

  // ------------------------
  // D: DELETE CHECKLIST
  // ------------------------

  const deleteChecklist = useCallback(async (id: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChecklists(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar checklist.';
      setError(message);
      console.error(message, err);
      return false;
    }
  }, [setChecklists]);

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