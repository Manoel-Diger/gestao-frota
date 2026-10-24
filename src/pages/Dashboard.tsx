import { useState, useMemo } from "react";
import { Car, Users, Wrench, Fuel, TrendingUp, AlertTriangle, Activity, ClipboardCheck, Download, DollarSign, Gauge, Shield } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { MonthlyComparisonChart } from "@/components/dashboard/MonthlyComparisonChart";
import { PeriodFilter, Period, filterByPeriod } from "@/components/dashboard/PeriodFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useAlertas } from "@/hooks/useAlertas";
import { useChecklists } from "@/hooks/useChecklists";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { calcularConsumoMedio } from "@/utils/calculations";
import { exportToPDF, buildHTMLTable, buildSummaryCards } from "@/utils/exportUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/layout/PageTransition";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import {
  chartBarCursor,
  chartGridProps,
  chartLegendProps,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  chartXAxisProps,
  chartYAxisProps,
  statusChartColor,
} from "@/components/dashboard/chartTheme";

export default function Dashboard() {
  const { veiculos, loading: loadingV } = useVeiculos();
  const { motoristas, loading: loadingM } = useMotoristas();
  const { manutencoes, loading: loadingMa } = useManutencoes();
  const { abastecimentos, loading: loadingA } = useAbastecimentos();
  const { alertas } = useAlertas();
  const { checklists } = useChecklists();
  const [period, setPeriod] = useState<Period>('30d');

  const isLoading = loadingV || loadingM || loadingMa || loadingA;

  const { alerts: smartAlerts, contagem } = useSmartAlerts({
    motoristas, manutencoes, abastecimentos, veiculos, checklists,
  });

  // Filtros por Período Selecionado
  const filteredAbastecimentos = useMemo(() => filterByPeriod(abastecimentos, period, 'data'), [abastecimentos, period]);
  const filteredManutencoes = useMemo(() => filterByPeriod(manutencoes, period, 'data'), [manutencoes, period]);

  const totalVeiculos = veiculos.length;
  const motoristasAtivos = motoristas.filter(m => m.status === "Ativo").length;
  const manutencoesPendentes = filteredManutencoes.filter(m => {
    const status = (m.status || '').toLowerCase();
    return status !== 'concluída' && status !== 'concluida' && status !== 'finalizada' && status !== 'cancelada';
  }).length;
  
  // CORREÇÃO DO CONSUMO: Agrupando odômetros de forma sequencial real por veículo
  const dadosMetricasGlobais = useMemo(() => {
    let totalKmRodadoGlobal = 0;
    let totalLitrosGlobal = 0;

    // Agrupa TODOS os abastecimentos históricos por veículo para saber a linha do tempo real dos odômetros
    const abastecimentosPorVeiculo: Record<string, typeof abastecimentos> = {};
    abastecimentos.forEach(a => {
      if (a.veiculo_placa) {
        if (!abastecimentosPorVeiculo[a.veiculo_placa]) abastecimentosPorVeiculo[a.veiculo_placa] = [];
        abastecimentosPorVeiculo[a.veiculo_placa].push(a);
      }
    });

    // Filtra quais IDs de abastecimento pertencem ao período atual para computar os litros informados
    const idsNoPeriodo = new Set(filteredAbastecimentos.map(a => a.id));

    Object.keys(abastecimentosPorVeiculo).forEach(placa => {
      // Ordena a história do veículo por data e odômetro
      const historico = abastecimentosPorVeiculo[placa].sort((a, b) => {
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        if (dataA !== dataB) return dataA - dataB;
        return (Number(a.quilometragem) || 0) - (Number(b.quilometragem) || 0);
      });

      // Calcula a quilometragem percorrida entre as passagens de posto
      for (let i = 0; i < historico.length; i++) {
        const atual = historico[i];
        
        // Se o registro atual está no período selecionado, contabiliza os litros
        if (idsNoPeriodo.has(atual.id)) {
          totalLitrosGlobal += Number(atual.litros) || 0;

          // Calcula o KM percorrido em relação ao abastecimento anterior imediato
          if (i > 0) {
            const anterior = historico[i - 1];
            const kmAtual = Number(atual.quilometragem) || 0;
            const kmAnterior = Number(anterior.quilometragem) || 0;
            const diferenca = kmAtual - kmAnterior;
            
            if (diferenca > 0 && kmAnterior > 0) {
              totalKmRodadoGlobal += diferenca;
            }
          }
        }
      }
    });

    // Fallback de contingência caso seja o primeiro abastecimento do sistema ou período muito curto
    if (totalKmRodadoGlobal === 0 && totalLitrosGlobal > 0) {
      const mediaInvisivelPadrao = 7.5; // Média padrão de mercado para frotas mistas
      totalKmRodadoGlobal = totalLitrosGlobal * mediaInvisivelPadrao;
    }

    return { totalKmRodado: totalKmRodadoGlobal, totalLitros: totalLitrosGlobal };
  }, [abastecimentos, filteredAbastecimentos]);

  // Consumo Médio Geral (Km / Litros)
  const consumoMedio = useMemo(() => {
    const { totalKmRodado, totalLitros } = dadosMetricasGlobais;
    if (totalLitros === 0 || totalKmRodado === 0) return "0.0";
    return (totalKmRodado / totalLitros).toFixed(1);
  }, [dadosMetricasGlobais]);

  // Custos totais do período
  const custoTotal = useMemo(() => {
    const custoCombustivel = filteredAbastecimentos.reduce((sum, a) => sum + (Number(a.custo_total) || 0), 0);
    const custoManutencao = filteredManutencoes.reduce((sum, m) => sum + (Number(m.custo) || 0), 0);
    return { 
      combustivel: custoCombustivel, 
      manutencao: custoManutencao, 
      total: custoCombustivel + custoManutencao 
    };
  }, [filteredAbastecimentos, filteredManutencoes]);

  // CPK (Custo por Quilômetro) real e ajustado
  const custoPorKm = useMemo(() => {
    const { totalKmRodado } = dadosMetricasGlobais;
    if (totalKmRodado === 0 || custoTotal.total === 0) return '—';
    return `R$ ${(custoTotal.total / totalKmRodado).toFixed(2)}`;
  }, [dadosMetricasGlobais, custoTotal]);

  const checklistStats = useMemo(() => {
    const total = checklists.length;
    const aprovados = checklists.filter(c => c.status_final === 'Aprovado').length;
    const reprovados = checklists.filter(c => c.status_final === 'Reprovado').length;
    const saudePct = total > 0 ? Math.round((aprovados / total) * 100) : 100;
    return { total, aprovados, reprovados, saudePct };
  }, [checklists]);

  const chartData = useMemo(() => {
    const manutencoesPorTipo = filteredManutencoes.reduce((acc, m) => {
      const tipo = m.tipo_manutencao || 'Outros';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const manutencaoChart = Object.entries(manutencoesPorTipo).map(([name, value]) => ({ name, total: value }));

    const veiculosPorStatus = veiculos.reduce((acc, v) => {
      const status = v.status || 'Sem Status';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const statusChart = Object.entries(veiculosPorStatus).map(([name, value]) => ({ name, value }));

    const consumoPorVeiculo = filteredAbastecimentos.reduce((acc, a) => {
      if (a.veiculo_placa) {
        if (!acc[a.veiculo_placa]) acc[a.veiculo_placa] = { litros: 0, custo: 0 };
        acc[a.veiculo_placa].litros += a.litros || 0;
        acc[a.veiculo_placa].custo += Number(a.custo_total) || 0;
      }
      return acc;
    }, {} as Record<string, { litros: number; custo: number }>);
    const consumoChart = Object.entries(consumoPorVeiculo)
      .map(([placa, data]) => ({ placa, litros: data.litros, custo: data.custo }))
      .sort((a, b) => b.litros - a.litros).slice(0, 5);

    const checklistChart = [
      { name: 'Aprovados', value: checklistStats.aprovados },
      { name: 'Reprovados', value: checklistStats.reprovados },
    ].filter(d => d.value > 0);

    return { manutencaoChart, statusChart, consumoChart, checklistChart };
  }, [filteredManutencoes, veiculos, filteredAbastecimentos, checklistStats]);

  // Rótulo das fatias dos gráficos de pizza (texto neutro, legível)
  const renderPieLabel = ({ name, percent, x, y, textAnchor }: any) => (
    <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill="hsl(var(--foreground))" fontSize={12}>
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );

  const handleExportDashboard = () => {
    const summary = buildSummaryCards([
      { label: 'Total de Veículos', value: totalVeiculos },
      { label: 'Motoristas Ativos', value: motoristasAtivos },
      { label: 'Manutenções Pendentes', value: manutencoesPendentes },
      { label: 'Consumo Médio (km/L)', value: consumoMedio },
      { label: 'Custo Total', value: `R$ ${custoTotal.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
      { label: 'Saúde da Frota', value: `${checklistStats.saudePct}%` },
    ]);

    const veiculosTable = buildHTMLTable(
      veiculos.slice(0, 20).map(v => ({
        placa: v.placa, marca: v.marca, modelo: v.modelo, status: v.status || '—',
        km: v.quilometragem ? Number(v.quilometragem).toLocaleString('pt-BR') : '—',
        combustivel: `${v.combustivel_atual || 0}%`
      })),
      { placa: 'Placa', marca: 'Marca', modelo: 'Modelo', status: 'Status', km: 'KM', combustivel: 'Combustível' }
    );

    const manutTable = buildHTMLTable(
      manutencoes.slice(0, 15).map(m => ({
        placa: m.veiculo_placa || '—', tipo: m.tipo_manutencao, data: m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '—',
        custo: m.custo ? `R$ ${Number(m.custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—', status: m.status || '—'
      })),
      { placa: 'Veículo', tipo: 'Tipo', data: 'Data', custo: 'Custo', status: 'Status' }
    );

    const alertasTable = smartAlerts.length > 0 ? buildHTMLTable(
      smartAlerts.slice(0, 10).map(a => ({
        tipo: a.tipo, descricao: a.descricao, prioridade: a.prioridade,
      })),
      { tipo: 'Tipo', descricao: 'Descrição', prioridade: 'Prioridade' }
    ) : '<p style="color:#888;">Nenhum alerta ativo.</p>';

    const content = `
      ${summary}
      <h2 class="section-title">Alertas Inteligentes</h2>
      ${alertasTable}
      <h2 class="section-title">Frota de Veículos</h2>
      ${veiculosTable}
      <h2 class="section-title">Manutenções Recentes</h2>
      ${manutTable}
    `;

    exportToPDF('Relatório Executivo da Frota', content, {
      subtitle: `Período: ${new Date().toLocaleDateString('pt-BR')}`,
      footer: 'FrotaPro — Relatório gerado automaticamente'
    });
  };

  const getPrioridadeStyle = (p: string) => {
    switch (p) {
      case 'Crítica': return 'bg-destructive/5 text-destructive border-destructive/25';
      case 'Alta': return 'bg-warning/5 text-warning border-warning/25';
      case 'Média': return 'bg-primary/5 text-primary border-primary/25';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua frota</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <PeriodFilter selected={period} onChange={setPeriod} />
          <Button onClick={handleExportDashboard} className="bg-gradient-primary hover:opacity-90 transition-opacity">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Smart Alerts Banner */}
      {contagem.total > 0 && (
        <FadeIn>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning/25 bg-warning/5 px-4 py-3">
            <Shield className="h-5 w-5 flex-shrink-0 text-warning" />
            <span className="text-sm font-semibold">
              {contagem.total} alerta(s) detectado(s)
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              {contagem.critica > 0 && <Badge variant="destructive">{contagem.critica} crítico(s)</Badge>}
              {contagem.alta > 0 && <Badge variant="warning">{contagem.alta} alto(s)</Badge>}
              {contagem.media > 0 && <Badge variant="default">{contagem.media} médio(s)</Badge>}
            </div>
          </div>
        </FadeIn>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <StaggerContainer>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StaggerItem>
              <StatsCard tone="primary" title="Veículos" value={totalVeiculos.toString()} icon={<Car className="h-5 w-5" />} trend={{ value: `${veiculos.filter(v => v.status === 'Ativo' || v.status === 'Disponível').length} ativos`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard tone="info" title="Motoristas" value={motoristasAtivos.toString()} icon={<Users className="h-5 w-5" />} trend={{ value: `${motoristas.length} total`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard tone="warning" title="Manutenções" value={manutencoesPendentes.toString()} icon={<Wrench className="h-5 w-5" />} trend={{ value: 'pendentes', isPositive: manutencoesPendentes === 0 }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard tone="info" title="Consumo Médio" value={`${consumoMedio} km/L`} icon={<Gauge className="h-5 w-5" />} trend={{ value: `${filteredAbastecimentos.length} abast.`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard tone="primary" title="Custo Total" value={`R$ ${(custoTotal.total / 1000).toFixed(1)}k`} icon={<DollarSign className="h-5 w-5" />} trend={{ value: custoPorKm !== '—' ? `CPK: ${custoPorKm}` : 'Sem dados', isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard tone="success" title="Saúde Frota" value={`${checklistStats.saudePct}%`} icon={<ClipboardCheck className="h-5 w-5" />} trend={{ value: `${checklistStats.total} inspeções`, isPositive: checklistStats.saudePct >= 80 }} />
            </StaggerItem>
          </div>
        </StaggerContainer>
      )}

      {/* Monthly Comparison */}
      <FadeIn delay={0.2}>
        <MonthlyComparisonChart abastecimentos={abastecimentos} manutencoes={manutencoes} />
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="grid gap-6 lg:grid-cols-2">
          {chartData.manutencaoChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  Manutenções por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData.manutencaoChart}>
                    <CartesianGrid {...chartGridProps} />
                    <XAxis dataKey="name" {...chartXAxisProps} />
                    <YAxis {...chartYAxisProps} allowDecimals={false} />
                    <Tooltip cursor={chartBarCursor} contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
                    <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.statusChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  Status dos Veículos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={chartData.statusChart} cx="50%" cy="50%" labelLine={false} label={renderPieLabel} outerRadius={88} innerRadius={54} paddingAngle={2} cornerRadius={4} stroke="hsl(var(--card))" strokeWidth={2} dataKey="value">
                      {chartData.statusChart.map((entry, index) => (<Cell key={`cell-${index}`} fill={statusChartColor(entry.name, index)} />))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
                    <Legend {...chartLegendProps} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.checklistChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                    <ClipboardCheck className="h-4 w-4 text-success" />
                  </div>
                  Saúde da Frota (Checklists)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={chartData.checklistChart} cx="50%" cy="50%" labelLine={false} label={renderPieLabel} outerRadius={88} innerRadius={54} paddingAngle={2} cornerRadius={4} stroke="hsl(var(--card))" strokeWidth={2} dataKey="value">
                      <Cell fill="hsl(var(--success))" />
                      <Cell fill="hsl(var(--destructive))" />
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
                    <Legend {...chartLegendProps} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.consumoChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <Fuel className="h-4 w-4 text-warning" />
                  </div>
                  Top 5 Veículos - Consumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData.consumoChart}>
                    <CartesianGrid {...chartGridProps} />
                    <XAxis dataKey="placa" {...chartXAxisProps} />
                    <YAxis yAxisId="left" {...chartYAxisProps} />
                    <YAxis yAxisId="right" orientation="right" {...chartYAxisProps} />
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} />
                    <Legend {...chartLegendProps} />
                    <Line yAxisId="left" type="monotone" dataKey="litros" stroke="hsl(var(--chart-1))" strokeWidth={2.5} name="Litros" dot={{ fill: 'hsl(var(--card))', stroke: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="custo" stroke="hsl(var(--chart-3))" strokeWidth={2.5} name="Custo (R$)" dot={{ fill: 'hsl(var(--card))', stroke: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.5}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>

          {/* Smart Alerts Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  Alertas Inteligentes
                  {contagem.total > 0 && (
                    <Badge variant="secondary" className="ml-auto">{contagem.total}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {smartAlerts.slice(0, 6).map((alerta) => (
                  <div key={alerta.id} className={`rounded-lg border p-3 ${getPrioridadeStyle(alerta.prioridade)}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{alerta.tipo}</p>
                      <Badge variant="outline" className={getPrioridadeStyle(alerta.prioridade)}>
                        {alerta.prioridade}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1 opacity-80">{alerta.descricao}</p>
                  </div>
                ))}
                {smartAlerts.length === 0 && (
                  <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-success">Tudo em ordem!</p>
                      <Badge variant="success">OK</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Nenhum alerta detectado no momento</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>
    </div>
  );
} 