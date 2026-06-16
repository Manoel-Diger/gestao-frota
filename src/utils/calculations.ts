import { Tables } from '@/integrations/supabase/types';

type Abastecimento = Tables<'Abastecimentos'>;

// Calcular consumo médio (km/L) baseado na consistência global de KM percorrido por litro
export function calcularConsumoMedio(abastecimentos: Abastecimento[]): number {
  if (abastecimentos.length === 0) return 0;

  let totalKm = 0;
  let totalLitros = 0;

  // Em vez de misturar placas em um loop temporal incorreto,
  // somamos os litros e calculamos a variação real de rodagem dos registros válidos
  abastecimentos.forEach(a => {
    // Se o seu sistema armazena o KM percorrido daquele abastecimento ou se usaremos a rodagem informada
    if (a.litros && a.litros > 0) {
      totalLitros += a.litros;
    }
  });

  // Buscando a distância percorrida real diretamente dos registros ou calculando por veículo
  // Para alinhar perfeitamente com os 349.888 km da sua tela de Abastecimentos:
  const veiculosMap: Record<string, { minKm: number; maxKm: number }> = {};
  
  abastecimentos.forEach(a => {
    if (a.veiculo_placa && a.quilometragem) {
      const km = Number(a.quilometragem);
      if (!veiculosMap[a.veiculo_placa]) {
        veiculosMap[a.veiculo_placa] = { minKm: km, maxKm: km };
      } else {
        if (km < veiculosMap[a.veiculo_placa].minKm) veiculosMap[a.veiculo_placa].minKm = km;
        if (km > veiculosMap[a.veiculo_placa].maxKm) veiculosMap[a.veiculo_placa].maxKm = km;
      }
    }
  });

  Object.values(veiculosMap).forEach(v => {
    totalKm += (v.maxKm - v.minKm);
  });

  // Fallback caso a estrutura de quilometragem por veículo seja tratada como parcial informada diretamente:
  if (totalKm === 0) {
    totalKm = abastecimentos.reduce((sum, a) => sum + (Number(a.quilometragem) || 0), 0);
  }

  return totalLitros > 0 ? totalKm / totalLitros : 0;
}

// Verificar CNHs vencendo nos próximos dias
export function verificarCNHVencendo(motoristas: any[], diasAntecedencia = 30): any[] {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + diasAntecedencia);

  return motoristas.filter(motorista => {
    const validade = motorista.validade_cnh || motorista.cnh_validade;
    if (!validade) return false;
    
    const dataVencimento = new Date(validade);
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