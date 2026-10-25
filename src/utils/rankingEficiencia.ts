
import type { Abastecimento } from '@/hooks/useAbastecimentos';
import type { Veiculo } from '@/hooks/useVeiculos';

/* =========================================================================
 * METAS DE CONSUMO (km/L)
 *
 * O banco não possui campo de meta, então ela é definida aqui. A ordem de
 * busca é:
 *   1) METAS_POR_PLACA  -> meta individual do veículo (tem prioridade);
 *   2) REGRAS_META      -> meta por marca/modelo/ano, para veículos que não
 *                          estão na lista de placas.
 * Se nada combinar, o veículo fica SEM META (não é inventado valor).
 * Para incluir/ajustar uma meta, basta editar as listas abaixo.
 * ========================================================================= */

/** Meta individual por placa (km/L). A placa é comparada sem hífen/espaço. */
export const METAS_POR_PLACA: Record<string, number> = {
  IXY4731: 5.0,
  IUG8744: 5.0,
  LTY8B39: 5.5,
  IUG8855: 5.0,
  RJA2C91: 4.5,
  RJADC91: 4.5,
  IUG8767: 5.0,
  IUG8882: 5.0,
  RKV1I73: 5.5,
  TRD2G21: 5.5,
};

/* -- Regras por marca / modelo / ano (usadas quando a placa não está acima) --
 * Os trechos de "marcas" e "modelos" são comparados sem acento, sem espaço
 * e sem hífen/ponto (ex.: "VW 8-160 DRC" => "vw8160drc"). A primeira regra que
 * combinar é a usada. */
export interface RegraMeta {
  /** Texto exibido na legenda da página */
  descricao: string;
  /** Meta de consumo em km/L */
  meta: number;
  /** Basta UM destes trechos aparecer em marca/modelo */
  marcas: string[];
  /** Se informado, basta UM destes trechos aparecer em marca/modelo */
  modelos?: string[];
  /** Ano mínimo do veículo (inclusive). Sem ano cadastrado => regra não se aplica */
  anoMin?: number;
}

const VW = ['vw', 'volkswagen', 'volkswagem'];

export const REGRAS_META: RegraMeta[] = [
  { descricao: 'VW 17-190', meta: 4.5, marcas: VW, modelos: ['17190'] },
  { descricao: 'VW 9-170 / 9-180 (2020 em diante)', meta: 5.5, marcas: VW, modelos: ['9170', '9180'], anoMin: 2020 },
  { descricao: 'VW 8-160', meta: 5.0, marcas: VW, modelos: ['8160'] },
  { descricao: 'Hyundai HR', meta: 10.0, marcas: ['hyundai'], modelos: ['hr'] },
  { descricao: 'Scania', meta: 3.0, marcas: ['scania'] },
];

/* ------------------------------ Normalização ----------------------------- */

/** minúsculo, sem acento, apenas letras e números */
const compactar = (texto: string | null | undefined): string =>
  (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** minúsculo, sem acento, espaços colapsados (usado para agrupar nomes) */
const normalizarNome = (texto: string | null | undefined): string =>
  (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** placa em maiúsculas, sem hífen/espaço */
const chavePlaca = (placa: string | null | undefined): string =>
  (placa ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Retorna a meta (km/L) do veículo (por placa, depois por modelo) ou null se não houver. */
export function obterMeta(
  veiculo: Pick<Veiculo, 'placa' | 'marca' | 'modelo' | 'ano'> | null | undefined,
): number | null {
  if (!veiculo) return null;

  const metaPlaca = METAS_POR_PLACA[chavePlaca(veiculo.placa)];
  if (metaPlaca !== undefined) return metaPlaca;

  const texto = `${compactar(veiculo.marca)}|${compactar(veiculo.modelo)}`;

  for (const regra of REGRAS_META) {
    if (!regra.marcas.some((m) => texto.includes(m))) continue;
    if (regra.modelos && !regra.modelos.some((m) => texto.includes(m))) continue;
    if (regra.anoMin !== undefined && !(Number(veiculo.ano) >= regra.anoMin)) continue;
    return regra.meta;
  }
  return null;
}

/* -------------------------------- Ranking -------------------------------- */

export type StatusMeta = 'acima' | 'abaixo' | 'sem_meta';

export interface ItemRanking {
  chave: string;
  motorista: string;
  placa: string;
  /** "Marca Modelo Ano" (ou aviso quando o veículo não está cadastrado) */
  veiculo: string;
  kmPorLitro: number;
  meta: number | null;
  /** km/L - meta, arredondado em 2 casas (o mesmo valor exibido na tela) */
  diferenca: number | null;
  status: StatusMeta;
  kmRodados: number;
  litros: number;
  trechos: number;
  /** Posição oficial (por desempenho vs meta). null quando não há meta */
  posicao: number | null;
}

export interface ResultadoRanking {
  itens: ItemRanking[];
  /** Trechos do período ignorados por dados inválidos (hodômetro/litros) */
  trechosDescartados: number;
  semMeta: number;
  kmTotal: number;
  litrosTotal: number;
}

export type CriterioOrdenacao =
  | 'desempenho'
  | 'pior'
  | 'consumo_desc'
  | 'consumo_asc'
  | 'motorista'
  | 'placa';

const nomeMotoristaDoVeiculo = (veiculo: Veiculo | undefined): string | null =>
  veiculo?.motorista?.trim() || veiculo?.Motoristas?.nome?.trim() || null;

/**
 * Grafia exibida quando o mesmo motorista foi digitado de formas diferentes:
 * a mais frequente; em empate, a que não está toda em minúsculas; depois a primeira.
 */
const nomeParaExibir = (nomes: Map<string, number>): string => {
  let melhor = '';
  let melhorQtd = -1;
  nomes.forEach((qtd, nome) => {
    const melhorEhMinuscula = melhor === melhor.toLowerCase();
    const nomeEhMinuscula = nome === nome.toLowerCase();
    if (qtd > melhorQtd || (qtd === melhorQtd && melhorEhMinuscula && !nomeEhMinuscula)) {
      melhor = nome;
      melhorQtd = qtd;
    }
  });
  return melhor;
};

/** Ordem cronológica por veículo; em empate de data, pelo hodômetro. */
const compararCronologico = (a: Abastecimento, b: Abastecimento): number =>
  (a.data || '').localeCompare(b.data || '') ||
  (Number(a.quilometragem) || 0) - (Number(b.quilometragem) || 0) ||
  a.id - b.id;

/**
 * Calcula o consumo (km/L) por motorista + veículo.
 *
 * Mesmo critério da tela de Abastecimentos: cada abastecimento forma um
 * "trecho" = (hodômetro atual - hodômetro do abastecimento ANTERIOR do mesmo
 * veículo, mesmo que o anterior esteja fora do período) ÷ litros do atual.
 * O trecho pertence ao período da data do abastecimento atual e ao motorista
 * registrado nele (ou, se vazio, ao motorista vinculado ao veículo).
 * Trechos com hodômetro ausente/que não aumentou ou litros zerados são
 * descartados e contados em `trechosDescartados` (nada é estimado).
 */
export function calcularRanking(
  abastecimentos: Abastecimento[],
  veiculos: Veiculo[],
  dentroDoPeriodo: (data: string) => boolean,
): ResultadoRanking {
  const veiculoPorPlaca = new Map<string, Veiculo>();
  veiculos.forEach((v) => {
    const chave = chavePlaca(v.placa);
    if (chave) veiculoPorPlaca.set(chave, v);
  });

  const porPlaca = new Map<string, Abastecimento[]>();
  abastecimentos.forEach((ab) => {
    const chave = chavePlaca(ab.veiculo_placa);
    if (!chave) return;
    const lista = porPlaca.get(chave);
    if (lista) lista.push(ab);
    else porPlaca.set(chave, [ab]);
  });

  interface Acumulado {
    placa: string;
    placaChave: string;
    /** grafias do nome encontradas nos registros (com quantas vezes cada uma apareceu) */
    nomes: Map<string, number>;
    km: number;
    litros: number;
    trechos: number;
  }
  const acumulados = new Map<string, Acumulado>();
  let trechosDescartados = 0;

  porPlaca.forEach((lista, placaChave) => {
    const ordenada = [...lista].sort(compararCronologico);
    const veiculo = veiculoPorPlaca.get(placaChave);
    const motoristaPadrao = nomeMotoristaDoVeiculo(veiculo);

    for (let i = 1; i < ordenada.length; i++) {
      const atual = ordenada[i];
      const anterior = ordenada[i - 1];
      if (!dentroDoPeriodo(atual.data)) continue;

      const kmAtual = Number(atual.quilometragem) || 0;
      const kmAnterior = Number(anterior.quilometragem) || 0;
      const litros = Number(atual.litros) || 0;

      if (!(kmAtual > 0 && kmAnterior > 0 && kmAtual > kmAnterior && litros > 0)) {
        trechosDescartados++;
        continue;
      }

      const motorista = (atual.motorista_nome || motoristaPadrao || 'Não definido').replace(/\s+/g, ' ').trim();
      const chave = `${placaChave}::${normalizarNome(motorista)}`;
      const acc = acumulados.get(chave) ?? {
        placa: veiculo?.placa || atual.veiculo_placa || placaChave,
        placaChave,
        nomes: new Map<string, number>(),
        km: 0,
        litros: 0,
        trechos: 0,
      };
      acc.nomes.set(motorista, (acc.nomes.get(motorista) ?? 0) + 1);
      acc.km += kmAtual - kmAnterior;
      acc.litros += litros;
      acc.trechos += 1;
      acumulados.set(chave, acc);
    }
  });

  let kmTotal = 0;
  let litrosTotal = 0;
  let semMeta = 0;

  const itens: ItemRanking[] = [];
  acumulados.forEach((acc, chave) => {
    const veiculo = veiculoPorPlaca.get(acc.placaChave);
    const kmPorLitro = acc.km / acc.litros;
    const meta = obterMeta(veiculo);
    const diferenca = meta === null ? null : Math.round((kmPorLitro - meta) * 100) / 100;
    const status: StatusMeta = diferenca === null ? 'sem_meta' : diferenca >= 0 ? 'acima' : 'abaixo';

    kmTotal += acc.km;
    litrosTotal += acc.litros;
    if (meta === null) semMeta++;

    itens.push({
      chave,
      motorista: nomeParaExibir(acc.nomes),
      placa: acc.placa,
      veiculo: veiculo
        ? [veiculo.marca, veiculo.modelo, veiculo.ano].filter(Boolean).join(' ')
        : 'Veículo não cadastrado',
      kmPorLitro,
      meta,
      diferenca,
      status,
      kmRodados: acc.km,
      litros: acc.litros,
      trechos: acc.trechos,
      posicao: null,
    });
  });

  // Posição oficial = desempenho vs meta (somente quem tem meta)
  const porDesempenho = ordenarRanking(itens, 'desempenho');
  let posicao = 0;
  porDesempenho.forEach((item) => {
    if (item.meta !== null) item.posicao = ++posicao;
  });

  return { itens: porDesempenho, trechosDescartados, semMeta, kmTotal, litrosTotal };
}

/** Ordena sem alterar a lista original. Itens sem meta ficam por último nos critérios de meta. */
export function ordenarRanking(itens: ItemRanking[], criterio: CriterioOrdenacao): ItemRanking[] {
  const porNome = (a: ItemRanking, b: ItemRanking) =>
    a.motorista.localeCompare(b.motorista, 'pt-BR') || a.placa.localeCompare(b.placa, 'pt-BR');
  const porConsumoDesc = (a: ItemRanking, b: ItemRanking) => b.kmPorLitro - a.kmPorLitro || porNome(a, b);

  const comMetaPrimeiro = (cmp: (a: ItemRanking, b: ItemRanking) => number) =>
    (a: ItemRanking, b: ItemRanking) => {
      if (a.diferenca === null && b.diferenca === null) return porConsumoDesc(a, b);
      if (a.diferenca === null) return 1;
      if (b.diferenca === null) return -1;
      return cmp(a, b) || porConsumoDesc(a, b);
    };

  const copia = [...itens];
  switch (criterio) {
    case 'desempenho':
      return copia.sort(comMetaPrimeiro((a, b) => (b.diferenca as number) - (a.diferenca as number)));
    case 'pior':
      return copia.sort(comMetaPrimeiro((a, b) => (a.diferenca as number) - (b.diferenca as number)));
    case 'consumo_desc':
      return copia.sort(porConsumoDesc);
    case 'consumo_asc':
      return copia.sort((a, b) => a.kmPorLitro - b.kmPorLitro || porNome(a, b));
    case 'motorista':
      return copia.sort(porNome);
    case 'placa':
      return copia.sort(
        (a, b) => a.placa.localeCompare(b.placa, 'pt-BR') || a.motorista.localeCompare(b.motorista, 'pt-BR'),
      );
    default:
      return copia;
  }
}
