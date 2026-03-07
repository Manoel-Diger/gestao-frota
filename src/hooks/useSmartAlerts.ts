import { useMemo } from 'react';
import { Motorista } from './useMotoristas';
import { Manutencao } from './useManutencoes';
import { Abastecimento } from './useAbastecimentos';

export type SmartAlert = {
  id: string;
  tipo: string;
  descricao: string;
  detalhe: string;
  prioridade: 'Crítica' | 'Alta' | 'Média' | 'Baixa';
  categoria: 'cnh' | 'manutencao' | 'combustivel' | 'checklist' | 'km';
  dataReferencia: Date;
};

interface SmartAlertParams {
  motoristas: Motorista[];
  manutencoes: Manutencao[];
  abastecimentos: Abastecimento[];
  veiculos: any[];
  checklists: any[];
}

export function useSmartAlerts({ motoristas, manutencoes, abastecimentos, veiculos, checklists }: SmartAlertParams) {
  const alerts = useMemo(() => {
    const result: SmartAlert[] = [];
    const hoje = new Date();

    // 1. CNH vencida ou vencendo
    motoristas.forEach(m => {
      if (!m.validade_cnh) return;
      const vencimento = new Date(m.validade_cnh);
      const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDias < 0) {
        result.push({
          id: `cnh-vencida-${m.id}`,
          tipo: 'CNH Vencida',
          descricao: `${m.nome} - CNH ${m.categoria_cnh || ''} vencida há ${Math.abs(diffDias)} dias`,
          detalhe: `Vencimento: ${vencimento.toLocaleDateString('pt-BR')}`,
          prioridade: 'Crítica',
          categoria: 'cnh',
          dataReferencia: vencimento,
        });
      } else if (diffDias <= 30) {
        result.push({
          id: `cnh-vencendo-${m.id}`,
          tipo: 'CNH Vencendo',
          descricao: `${m.nome} - CNH ${m.categoria_cnh || ''} vence em ${diffDias} dias`,
          detalhe: `Vencimento: ${vencimento.toLocaleDateString('pt-BR')}`,
          prioridade: diffDias <= 7 ? 'Alta' : 'Média',
          categoria: 'cnh',
          dataReferencia: vencimento,
        });
      }
    });

    // 2. Manutenções vencidas/atrasadas
    manutencoes.forEach(m => {
      if (!m.data) return;
      const statusNorm = (m.status || '').toLowerCase();
      if (statusNorm === 'concluída' || statusNorm === 'concluida' || statusNorm === 'finalizada' || statusNorm === 'cancelada') return;
      
      const dataManut = new Date(m.data);
      const diffDias = Math.ceil((dataManut.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDias < 0) {
        result.push({
          id: `manut-vencida-${m.id}`,
          tipo: 'Manutenção Atrasada',
          descricao: `${m.veiculo_placa || 'Veículo'} - ${m.tipo_manutencao} atrasada há ${Math.abs(diffDias)} dias`,
          detalhe: `Prevista para: ${dataManut.toLocaleDateString('pt-BR')}`,
          prioridade: Math.abs(diffDias) > 15 ? 'Crítica' : 'Alta',
          categoria: 'manutencao',
          dataReferencia: dataManut,
        });
      } else if (diffDias <= 7) {
        result.push({
          id: `manut-proxima-${m.id}`,
          tipo: 'Manutenção Próxima',
          descricao: `${m.veiculo_placa || 'Veículo'} - ${m.tipo_manutencao} em ${diffDias} dias`,
          detalhe: `Agendada para: ${dataManut.toLocaleDateString('pt-BR')}`,
          prioridade: 'Média',
          categoria: 'manutencao',
          dataReferencia: dataManut,
        });
      }
    });

    // 3. Combustível baixo
    veiculos.forEach(v => {
      if (v.combustivel_atual !== null && v.combustivel_atual !== undefined && v.combustivel_atual < 20) {
        result.push({
          id: `combustivel-${v.id}`,
          tipo: 'Combustível Baixo',
          descricao: `${v.placa} (${v.marca} ${v.modelo}) - apenas ${v.combustivel_atual}% de combustível`,
          detalhe: `Status: ${v.status || 'N/A'}`,
          prioridade: v.combustivel_atual < 10 ? 'Alta' : 'Média',
          categoria: 'combustivel',
          dataReferencia: hoje,
        });
      }
    });

    // 4. Checklists reprovados recentes (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);
    
    checklists
      .filter(c => c.status_final === 'Reprovado' && new Date(c.created_at) >= seteDiasAtras)
      .forEach(c => {
        result.push({
          id: `checklist-${c.id}`,
          tipo: 'Checklist Reprovado',
          descricao: `${c.placa_veiculo} - ${c.total_nao_conformidades} não conformidade(s)`,
          detalhe: `Inspeção: ${new Date(c.data_inspecao).toLocaleDateString('pt-BR')}`,
          prioridade: c.total_nao_conformidades > 3 ? 'Alta' : 'Média',
          categoria: 'checklist',
          dataReferencia: new Date(c.created_at),
        });
      });

    // 5. Veículos com alta km sem manutenção recente
    veiculos.forEach(v => {
      if (!v.quilometragem || v.quilometragem < 10000) return;
      const ultimaManutencao = manutencoes
        .filter(m => m.veiculo_placa === v.placa)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
      
      if (!ultimaManutencao) {
        result.push({
          id: `km-sem-manut-${v.id}`,
          tipo: 'Sem Manutenção',
          descricao: `${v.placa} (${v.marca} ${v.modelo}) - ${Number(v.quilometragem).toLocaleString('pt-BR')} km sem manutenção registrada`,
          detalhe: 'Nenhuma manutenção encontrada para este veículo',
          prioridade: 'Média',
          categoria: 'km',
          dataReferencia: hoje,
        });
      }
    });

    // Sort: Crítica > Alta > Média > Baixa
    const prioridadeOrdem = { 'Crítica': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    return result.sort((a, b) => prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade]);
  }, [motoristas, manutencoes, abastecimentos, veiculos, checklists]);

  const contagem = useMemo(() => ({
    total: alerts.length,
    critica: alerts.filter(a => a.prioridade === 'Crítica').length,
    alta: alerts.filter(a => a.prioridade === 'Alta').length,
    media: alerts.filter(a => a.prioridade === 'Média').length,
    baixa: alerts.filter(a => a.prioridade === 'Baixa').length,
  }), [alerts]);

  return { alerts, contagem };
}
