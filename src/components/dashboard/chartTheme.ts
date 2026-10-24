/**
 * Tema único para os gráficos (Recharts): paleta, grade, eixos e tooltip.
 * Usa os tokens de design (--chart-*), então acompanha a identidade visual.
 */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export const chartTooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  fontSize: "13px",
  padding: "8px 12px",
  boxShadow: "var(--shadow-elevated)",
} as const;

export const chartTooltipLabelStyle = {
  color: "hsl(var(--foreground))",
  fontWeight: 600,
  marginBottom: 2,
} as const;

/** Realce de coluna ao passar o mouse nos gráficos de barras */
export const chartBarCursor = { fill: "hsl(var(--muted) / 0.7)" } as const;

export const chartGridProps = {
  strokeDasharray: "3 3",
  stroke: "hsl(var(--border))",
  vertical: false,
} as const;

const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 12 } as const;

export const chartXAxisProps = {
  tick: axisTick,
  tickLine: false,
  axisLine: { stroke: "hsl(var(--border))" },
} as const;

export const chartYAxisProps = {
  tick: axisTick,
  tickLine: false,
  axisLine: false,
} as const;

export const chartLegendProps = {
  iconType: "circle" as const,
  iconSize: 8,
  wrapperStyle: { fontSize: "13px", paddingTop: 8 },
};

/** Cor por significado do status (evita "Disponível" aparecer em vermelho por posição). */
export function statusChartColor(name: string, fallbackIndex: number): string {
  const n = (name || "").toLowerCase();
  if (n === "ativo") return "hsl(var(--success))";
  if (n === "disponível" || n === "disponivel") return "hsl(var(--chart-2))";
  if (n === "em uso") return "hsl(var(--chart-1))";
  if (n.includes("manuten")) return "hsl(var(--chart-3))";
  if (n === "inativo" || n === "sem status") return "hsl(var(--chart-6))";
  return CHART_COLORS[fallbackIndex % CHART_COLORS.length];
}
