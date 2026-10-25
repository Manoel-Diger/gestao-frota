import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Gauge, Trophy, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/shared/MetricCard";
import { MonthYearFilter, matchesMonthYear } from "@/components/shared/MonthYearFilter";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useVeiculos } from "@/hooks/useVeiculos";
import {
  calcularRanking,
  ordenarRanking,
  METAS_POR_PLACA,
  REGRAS_META,
  type CriterioOrdenacao,
  type ItemRanking,
} from "@/utils/rankingEficiencia";

const ORDENACOES: { value: CriterioOrdenacao; label: string }[] = [
  { value: "desempenho", label: "Melhor desempenho vs meta" },
  { value: "pior", label: "Pior desempenho vs meta" },
  { value: "consumo_desc", label: "Maior km/L (mais eficiente)" },
  { value: "consumo_asc", label: "Menor km/L (menos eficiente)" },
  { value: "motorista", label: "Motorista (A–Z)" },
  { value: "placa", label: "Placa (A–Z)" },
];

const fmt2 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDiferenca = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt2(Math.abs(n))}`;

/** "5,00 km/L: IXY4731, IUG8744 • 5,50 km/L: LTY8B39 ..." (metas individuais agrupadas por valor) */
const LEGENDA_METAS_POR_PLACA = Object.entries(
  Object.entries(METAS_POR_PLACA).reduce<Record<number, string[]>>((grupos, [placa, meta]) => {
    (grupos[meta] ||= []).push(placa);
    return grupos;
  }, {}),
)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([meta, placas]) => `${fmt2(Number(meta))} km/L: ${placas.join(", ")}`)
  .join(" • ");

function rotuloPeriodo(periodo: string): string {
  if (periodo === "all") return "Todos os períodos";
  const [ano, mes] = periodo.split("-").map(Number);
  const texto = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function LinhaRanking({ item, escala }: { item: ItemRanking; escala: number }) {
  const largura = Math.min(100, (item.kmPorLitro / escala) * 100);
  const posicaoMeta = item.meta !== null ? Math.min(100, (item.meta / escala) * 100) : null;

  const corBarra =
    item.status === "acima" ? "bg-success" : item.status === "abaixo" ? "bg-destructive" : "bg-muted-foreground/40";
  const corTexto =
    item.status === "acima" ? "text-success" : item.status === "abaixo" ? "text-destructive" : "text-muted-foreground";

  const situacao =
    item.status === "acima" ? "acima da meta" : item.status === "abaixo" ? "abaixo da meta" : "sem meta definida";
  const resumo =
    `${item.motorista}, placa ${item.placa}: ${fmt2(item.kmPorLitro)} km/L` +
    (item.meta !== null ? `, meta ${fmt2(item.meta)} km/L` : "") +
    `, ${situacao}`;

  return (
    <li
      className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 md:grid-cols-[2.25rem_minmax(0,1.4fr)_4.25rem_minmax(0,2fr)_6.5rem] md:gap-x-4"
      title={`${item.kmRodados.toLocaleString("pt-BR")} km • ${item.litros.toLocaleString("pt-BR", {
        maximumFractionDigits: 1,
      })} L • ${item.trechos} trecho(s) entre abastecimentos`}
    >
      <span className="row-span-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold tabular-nums text-primary md:row-span-1">
        {item.posicao !== null ? `${item.posicao}º` : "—"}
      </span>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground md:truncate">{item.motorista}</p>
        <p className="text-xs text-muted-foreground md:truncate">
          {item.placa} • {item.veiculo}
        </p>
      </div>

      <span
        className={`justify-self-end rounded-md px-2 py-1 text-center text-xs font-semibold tabular-nums md:w-full ${
          item.meta !== null ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
        }`}
        title={item.meta !== null ? "Meta individual do veículo (km/L)" : "Nenhuma meta definida para este modelo"}
      >
        {item.meta !== null ? fmt2(item.meta) : "—"}
      </span>

      <div
        className="relative col-start-2 h-3.5 rounded-full bg-muted md:col-start-auto"
        role="img"
        aria-label={resumo}
      >
        <div className={`h-full rounded-full ${corBarra}`} style={{ width: `${largura}%` }} />
        {posicaoMeta !== null && (
          <span
            className="absolute -top-[3px] h-5 w-[3px] -translate-x-1/2 rounded-full bg-warning"
            style={{ left: `${posicaoMeta}%` }}
          />
        )}
      </div>

      <div className="text-right">
        <p className={`text-sm font-semibold tabular-nums ${corTexto}`}>
          {item.diferenca !== null ? `${fmtDiferenca(item.diferenca)} km/L` : "Sem meta"}
          <span className="sr-only"> ({situacao})</span>
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">{fmt2(item.kmPorLitro)} km/L</p>
      </div>
    </li>
  );
}

export default function Ranking() {
  const {
    abastecimentos,
    loading: carregandoAbastecimentos,
    error: erroAbastecimentos,
    refetch: recarregarAbastecimentos,
  } = useAbastecimentos();
  const {
    veiculos,
    loading: carregandoVeiculos,
    error: erroVeiculos,
    refetch: recarregarVeiculos,
  } = useVeiculos();

  const [criterio, setCriterio] = useState<CriterioOrdenacao>("desempenho");
  const [periodoEscolhido, setPeriodoEscolhido] = useState<string | null>(null);

  const loading = carregandoAbastecimentos || carregandoVeiculos;
  const error = erroAbastecimentos || erroVeiculos;

  // Enquanto o usuário não escolher, usa o mês mais recente com abastecimentos
  const periodo = useMemo(() => {
    if (periodoEscolhido) return periodoEscolhido;
    const meses = abastecimentos
      .map((ab) => (ab.data || "").slice(0, 7))
      .filter((m) => /^\d{4}-\d{2}$/.test(m))
      .sort();
    return meses.length ? meses[meses.length - 1] : "all";
  }, [periodoEscolhido, abastecimentos]);

  const resultado = useMemo(
    () => calcularRanking(abastecimentos, veiculos, (data) => matchesMonthYear(data, periodo)),
    [abastecimentos, veiculos, periodo],
  );

  const itens = useMemo(() => ordenarRanking(resultado.itens, criterio), [resultado.itens, criterio]);

  const resumo = useMemo(() => {
    const acima = resultado.itens.filter((i) => i.status === "acima").length;
    const abaixo = resultado.itens.filter((i) => i.status === "abaixo").length;
    const consumoMedio = resultado.litrosTotal > 0 ? resultado.kmTotal / resultado.litrosTotal : 0;
    return { acima, abaixo, consumoMedio };
  }, [resultado]);

  // Escala comum das barras: começa em zero e comporta o maior consumo ou meta
  const escala = useMemo(() => {
    const maior = Math.max(0, ...resultado.itens.flatMap((i) => [i.kmPorLitro, i.meta ?? 0]));
    return maior > 0 ? maior * 1.1 : 1;
  }, [resultado.itens]);

  const recarregar = () => {
    recarregarAbastecimentos();
    recarregarVeiculos();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
            Ranking de Eficiência
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Consumo dos motoristas por veículo comparado à meta do modelo</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <MonthYearFilter
            value={periodo}
            onChange={setPeriodoEscolhido}
            availableDates={abastecimentos.map((ab) => ab.data)}
          />
          <Select value={criterio} onValueChange={(v) => setCriterio(v as CriterioOrdenacao)}>
            <SelectTrigger className="w-full sm:w-[290px]" aria-label="Ordenar ranking">
              <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {ORDENACOES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Motoristas avaliados"
          value={resultado.itens.length}
          tone="primary"
          icon={<Users />}
          caption={resultado.semMeta > 0 ? `${resultado.semMeta} sem meta` : "Todos com meta"}
        />
        <MetricCard
          title="Acima da meta"
          value={resumo.acima}
          tone="success"
          icon={<TrendingUp />}
          caption="Consumo ≥ meta"
        />
        <MetricCard
          title="Abaixo da meta"
          value={resumo.abaixo}
          tone="danger"
          icon={<TrendingDown />}
          caption="Consumo < meta"
        />
        <MetricCard
          title="Consumo médio"
          value={resumo.consumoMedio > 0 ? fmt2(resumo.consumoMedio) : "—"}
          unit="km/L"
          tone="info"
          icon={<Gauge />}
          caption={rotuloPeriodo(periodo)}
        />
      </div>

      {/* Ranking */}
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-warning" />
            Meta individual por veículo — {rotuloPeriodo(periodo)}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-[3px] rounded-full bg-warning" /> Meta individual do veículo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-success" /> Acima da meta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-destructive" /> Abaixo da meta
            </span>
            {resultado.semMeta > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-muted-foreground/40" /> Sem meta definida
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="mb-2 h-6 w-6" />
              <p>Erro ao carregar os dados do ranking. Verifique sua conexão.</p>
              <Button variant="link" onClick={recarregar}>
                Tentar Novamente
              </Button>
            </div>
          ) : itens.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Trophy className="mx-auto mb-2 h-8 w-8" />
              <p>Sem dados suficientes para calcular o consumo neste período.</p>
              <p className="mt-2 text-sm">
                São necessários ao menos dois abastecimentos do mesmo veículo, com hodômetro e litros válidos.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-1 hidden grid-cols-[2.25rem_minmax(0,1.4fr)_4.25rem_minmax(0,2fr)_6.5rem] gap-x-4 border-b pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                <span />
                <span>Motorista / Placa</span>
                <span className="text-center">Meta</span>
                <span>Performance vs meta individual</span>
                <span className="text-right">Diferença</span>
              </div>
              <ul className="divide-y divide-border">
                {itens.map((item) => (
                  <LinhaRanking key={item.chave} item={item} escala={escala} />
                ))}
              </ul>
            </>
          )}

          {!loading && !error && (
            <div className="mt-4 space-y-1 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Meta individual por veículo:</span>{" "}
                {LEGENDA_METAS_POR_PLACA}
              </p>
              <p>
                <span className="font-medium text-foreground">Demais veículos, por modelo:</span>{" "}
                {REGRAS_META.map((r) => `${r.descricao} = ${fmt2(r.meta)} km/L`).join(" • ")}
              </p>
              <p>
                Consumo = km rodados ÷ litros, calculado pela diferença de hodômetro entre abastecimentos consecutivos do
                mesmo veículo (mesmo critério da tela de Abastecimentos). O motorista considerado é o registrado em cada
                abastecimento; se vazio, o vinculado ao veículo.
              </p>
              {resultado.trechosDescartados > 0 && (
                <p>
                  {resultado.trechosDescartados} trecho(s) do período foram ignorados por hodômetro ausente, que não
                  aumentou, ou litros zerados.
                </p>
              )}
              {resultado.semMeta > 0 && (
                <p>Veículos sem meta definida aparecem sem cor e fora da classificação.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}