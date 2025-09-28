import { Tables } from '@/integrations/supabase/types';

type Abastecimento = Tables<'Abastecimentos'>;

// Calcular consumo médio (km/L) baseado na diferença de quilometragem entre abastecimentos
export function calcularConsumoMedio(abastecimentos: Abastecimento[]): number {
  if (abastecimentos.length < 2) return 0;

  // Ordenar por data
  const sortedAbastecimentos = [...abastecimentos].sort((a, b) => {
    const dateA = new Date(a.data || '');
    const dateB = new Date(b.data || '');
    return dateA.getTime() - dateB.getTime();
  });

  let totalKm = 0;
  let totalLitros = 0;
  let validCalculations = 0;

  for (let i = 1; i < sortedAbastecimentos.length; i++) {
    const current = sortedAbastecimentos[i];
    const previous = sortedAbastecimentos[i - 1];

    if (current.quilometragem && previous.quilometragem && current.litros) {
      const kmPercorridos = current.quilometragem - previous.quilometragem;
      if (kmPercorridos > 0) {
        totalKm += kmPercorridos;
        totalLitros += current.litros;
        validCalculations++;
      }
    }
  }

  return validCalculations > 0 ? totalKm / totalLitros : 0;
}

// Verificar CNHs vencendo nos próximos dias
export function verificarCNHVencendo(motoristas: any[], diasAntecedencia = 30): any[] {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + diasAntecedencia);

  return motoristas.filter(motorista => {
    if (!motorista.cnh_validade) return false;
    
    const dataVencimento = new Date(motorista.cnh_validade);
    return dataVencimento <= dataLimite && dataVencimento >= hoje;
  });
}

// Calcular dias até vencimento da CNH
export function calcularDiasParaVencimento(dataVencimento: string): number {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}