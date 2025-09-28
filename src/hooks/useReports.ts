// useReports.tsx

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Tipo para os relatórios baseado na estrutura conhecida da tabela
type Relatorio = {
  id: number;
  created_at: string;
  nome_relatorio: string | null;
  tipo_analise: string | null;
  periodo: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  filtros: string | null;
};

export function useReports() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função central para buscar os relatórios
  const fetchRelatorios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // MUDANÇA AQUI: Lendo diretamente da tabela "Relatorios"
      const { data, error } = await supabase
        .from('Relatorios') 
        .select('*')
        .order('created_at', { ascending: false }); // Usamos 'from' e 'select'

      if (error) throw error;
      
      // Garante que o ID existe para o TS, embora o Supabase garanta se for Primary Key
      const validData = data.filter((r): r is Relatorio => r.id !== undefined) as Relatorio[];
      setRelatorios(validData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
      setRelatorios([]); // Limpa a lista em caso de erro
    } finally {
      setLoading(false);
    }
  }, []); // Dependência vazia: função não muda

  useEffect(() => {
    fetchRelatorios();
  }, [fetchRelatorios]); // Adiciona fetchRelatorios como dependência

  // Função de refresh usa a mesma lógica
  const refreshRelatorios = async () => {
    await fetchRelatorios();
  };

  return { relatorios, loading, error, refreshRelatorios };
}