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

  // Filtered data by period
  const filteredAbastecimentos = useMemo(() => filterByPeriod(abastecimentos, period, 'data'), [abastecimentos, period]);
  const filteredManutencoes = useMemo(() => filterByPeriod(manutencoes, period, 'data'), [manutencoes, period]);

  const totalVeiculos = veiculos.length;
  const motoristasAtivos = motoristas.filter(m => m.status === "Ativo").length;
  const manutencoesPendentes = filteredManutencoes.filter(m => {
    const status = (m.status || '').toLowerCase();
    return status !== 'concluída' && status !== 'concluida' && status !== 'finalizada' && status !== 'cancelada';
  }).length;
  
  const consumoMedio = useMemo(() => {
    const consumo = calcularConsumoMedio(filteredAbastecimentos);
    return consumo > 0 ? consumo.toFixed(1) : "0";
  }, [filteredAbastecimentos]);

  // Custo total no período
  const custoTotal = useMemo(() => {
    const custoCombustivel = filteredAbastecimentos.reduce((sum, a) => sum + (Number(a.custo_total) || 0), 0);
    const custoManutencao = filteredManutencoes.reduce((sum, m) => sum + (Number(m.custo) || 0), 0);
    return { combustivel: custoCombustivel, manutencao: custoManutencao, total: custoCombustivel + custoManutencao };
  }, [filteredAbastecimentos, filteredManutencoes]);

  // CPK (Custo por KM)
  const custoPorKm = useMemo(() => {
    const totalKm = filteredAbastecimentos.reduce((sum, a) => sum + (Number(a.quilometragem) || 0), 0);
    if (totalKm === 0 || custoTotal.total === 0) return '—';
    return `R$ ${(custoTotal.total / totalKm).toFixed(2)}`;
  }, [filteredAbastecimentos, custoTotal]);

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

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

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
      case 'Crítica': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'Alta': return 'bg-warning/10 text-warning border-warning/30';
      case 'Média': return 'bg-primary/10 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua frota</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
          <div className="flex items-center gap-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
            <Shield className="h-5 w-5 text-warning flex-shrink-0" />
            <span className="text-sm font-medium">
              {contagem.total} alerta(s) detectado(s)
            </span>
            <div className="flex gap-2 ml-auto">
              {contagem.critica > 0 && <Badge className="bg-destructive/10 text-destructive border-destructive/30">{contagem.critica} crítico(s)</Badge>}
              {contagem.alta > 0 && <Badge className="bg-warning/10 text-warning border-warning/30">{contagem.alta} alto(s)</Badge>}
              {contagem.media > 0 && <Badge className="bg-primary/10 text-primary border-primary/30">{contagem.media} médio(s)</Badge>}
            </div>
          </div>
        </FadeIn>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <StaggerContainer>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StaggerItem>
              <StatsCard title="Veículos" value={totalVeiculos.toString()} icon={<Car className="h-5 w-5" />} trend={{ value: `${veiculos.filter(v => v.status === 'Ativo' || v.status === 'Disponível').length} ativos`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Motoristas" value={motoristasAtivos.toString()} icon={<Users className="h-5 w-5" />} trend={{ value: `${motoristas.length} total`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Manutenções" value={manutencoesPendentes.toString()} icon={<Wrench className="h-5 w-5" />} trend={{ value: 'pendentes', isPositive: manutencoesPendentes === 0 }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Consumo Médio" value={`${consumoMedio} km/L`} icon={<Gauge className="h-5 w-5" />} trend={{ value: `${filteredAbastecimentos.length} abast.`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Custo Total" value={`R$ ${(custoTotal.total / 1000).toFixed(1)}k`} icon={<DollarSign className="h-5 w-5" />} trend={{ value: custoPorKm !== '—' ? `CPK: ${custoPorKm}` : 'Sem dados', isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Saúde Frota" value={`${checklistStats.saudePct}%`} icon={<ClipboardCheck className="h-5 w-5" />} trend={{ value: `${checklistStats.total} inspeções`, isPositive: checklistStats.saudePct >= 80 }} />
            </StaggerItem>
          </div>
        </StaggerContainer>
      )}

      {/* Monthly Comparison - full width */}
      <FadeIn delay={0.2}>
        <MonthlyComparisonChart abastecimentos={abastecimentos} manutencoes={manutencoes} />
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="grid gap-6 lg:grid-cols-2">
          {chartData.manutencaoChart.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  Manutenções por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData.manutencaoChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                      {chartData.manutencaoChart.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.statusChart.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  Status dos Veículos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={chartData.statusChart} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} innerRadius={50} fill="hsl(var(--primary))" dataKey="value">
                      {chartData.statusChart.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.checklistChart.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                    <ClipboardCheck className="h-4 w-4 text-success" />
                  </div>
                  Saúde da Frota (Checklists)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={chartData.checklistChart} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} innerRadius={50} dataKey="value">
                      <Cell fill="hsl(var(--success))" />
                      <Cell fill="hsl(var(--destructive))" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {chartData.consumoChart.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <Fuel className="h-4 w-4 text-warning" />
                  </div>
                  Top 5 Veículos - Consumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData.consumoChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="placa" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="litros" stroke="hsl(var(--primary))" strokeWidth={2} name="Litros" dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="custo" stroke="hsl(var(--warning))" strokeWidth={2} name="Custo (R$)" dot={{ fill: 'hsl(var(--warning))', r: 4 }} />
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
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
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
                  <div key={alerta.id} className={`p-3 border rounded-lg ${getPrioridadeStyle(alerta.prioridade)}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{alerta.tipo}</p>
                      <Badge variant="outline" className={getPrioridadeStyle(alerta.prioridade)}>
                        {alerta.prioridade}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1 opacity-80">{alerta.descricao}</p>
                  </div>
                ))}
                {smartAlerts.length === 0 && (
                  <div className="p-3 border border-success/20 bg-success/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-success">Tudo em ordem!</p>
                      <Badge className="bg-success/10 text-success border-success">OK</Badge>
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
