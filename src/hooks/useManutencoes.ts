import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
// O tipo 'Manutencao' deve refletir a estrutura da sua tabela
// Assumimos que 'status' e 'data_conclusao' agora fazem parte deste tipo.
type Manutencao = Tables<'Manutencoes'>;
// O tipo de retorno dos KPIs
interface ManutencoesStats {
total: number;
concluidas: number;
pendentes: number;
custoTotal: number;
custoMedio: number;
percentualConcluidas: number;
percentualPendentes: number;
percentualCorretiva: number;
}
export function useManutencoes() {
const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
// Estado para armazenar os KPIs calculados
const [stats, setStats] = useState<ManutencoesStats>({
total: 0,
concluidas: 0,
pendentes: 0,
custoTotal: 0,
custoMedio: 0,
percentualConcluidas: 0,
percentualPendentes: 0,
percentualCorretiva: 0,
});
// Função centralizada para buscar e calcular os dados (usando useCallback para otimização)
const fetchAndCalculateManutencoes = useCallback(async () => {
try {
setLoading(true);
// 1. BUSCA OTIMIZADA: Traz todos os dados necessários para o cálculo
const { data: allData, error: fetchError } = await supabase
.from('Manutencoes')
.select('*')
.order('data', { ascending: false });
if (fetchError) throw fetchError;
const allManutencoes = allData || [];
// 2. CÁLCULO DOS KPIS
const total = allManutencoes.length;
// Filtra manutenções por STATUS:
// Assumindo que 'Concluída' é o status final.
// Qualquer outro status (Agendada, Em Andamento, etc.) será considerado PENDENTE.
const manutencoesConcluidas = allManutencoes.filter(m => m.status === 'Concluída');
const concluidaCount = manutencoesConcluidas.length;
// Pendentes é o Total menos as Concluídas, garantindo a soma
const pendenteCount = total - concluidaCount;
// Custo Total de TODAS as manutenções
const custoTotal = allManutencoes.reduce((sum, m) => sum + (m.custo ?? 0), 0);
// Custo Corretiva (Usado para calcular o percentual de risco)
const custoCorretiva = allManutencoes
.filter(m => m.tipo_manutencao === 'Corretiva')
.reduce((sum, m) => sum + (m.custo ?? 0), 0);
// Geração dos KPIs
const newStats: ManutencoesStats = {
total: total,
concluidas: concluidaCount,
pendentes: pendenteCount,
custoTotal: custoTotal,
// Custo Médio = Custo Total / Total Manutenções
custoMedio: total > 0 ? custoTotal / total : 0,
// Percentuais de Proporção (ex: 66.7% concluídas)
percentualConcluidas: total > 0 ? (concluidaCount / total) * 100 : 0,
percentualPendentes: total > 0 ? (pendenteCount / total) * 100 : 0,
// Percentual de Custo Corretiva (KPI de gestão)
percentualCorretiva: custoTotal > 0 ? (custoCorretiva / custoTotal) * 100 : 0,
};
setManutencoes(allManutencoes);
setStats(newStats);
} catch (err) {
setError(err instanceof Error ? err.message : 'Erro ao carregar manutenções');
} finally {
setLoading(false);
}
}, []);
useEffect(() => {
fetchAndCalculateManutencoes();
}, [fetchAndCalculateManutencoes]);
// Adição de assinatura em tempo real para atualizar automaticamente a lista ao detectar mudanças na tabela 'Manutencoes'
useEffect(() => {
const channel = supabase
.channel('manutencoes-changes')
.on(
'postgres_changes',
{ event: '*', schema: 'public', table: 'Manutencoes' },
() => {
fetchAndCalculateManutencoes();
}
)
.subscribe();
return () => {
supabase.removeChannel(channel);
};
}, [fetchAndCalculateManutencoes]);
// CORREÇÃO: Renomear a função de refresh para 'refetch'
// Isso garante que o MaintenancePage.tsx consiga atualizar os dados após o cadastro.
const refetch = () => {
fetchAndCalculateManutencoes();
};
// Retorna a lista de manutenções E os novos KPIs (stats), incluindo 'refetch'
return { manutencoes, loading, error, stats, refetch };
}