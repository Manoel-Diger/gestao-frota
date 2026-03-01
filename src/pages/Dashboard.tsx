import { Car, Users, Wrench, Fuel, TrendingUp, AlertTriangle, Activity, ClipboardCheck, Download } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useAlertas } from "@/hooks/useAlertas";
import { useChecklists } from "@/hooks/useChecklists";
import { calcularConsumoMedio, verificarCNHVencendo, calcularDiasParaVencimento } from "@/utils/calculations";
import { exportToPDF, buildHTMLTable, buildSummaryCards } from "@/utils/exportUtils";
import { useMemo } from "react";
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

  const isLoading = loadingV || loadingM || loadingMa || loadingA;

  const totalVeiculos = veiculos.length;
  const motoristasAtivos = motoristas.filter(m => m.status === "Ativo").length;
  const manutencoesPendentes = manutencoes.filter(m => {
    if (!m.data) return true;
    return new Date(m.data) > new Date();
  }).length;
  
  const consumoMedio = useMemo(() => {
    const consumo = calcularConsumoMedio(abastecimentos);
    return consumo > 0 ? consumo.toFixed(1) : "0";
  }, [abastecimentos]);

  const cnhsVencendo = useMemo(() => {
    return verificarCNHVencendo(motoristas, 30);
  }, [motoristas]);

  const checklistStats = useMemo(() => {
    const total = checklists.length;
    const aprovados = checklists.filter(c => c.status_final === 'Aprovado').length;
    const reprovados = checklists.filter(c => c.status_final === 'Reprovado').length;
    const saudePct = total > 0 ? Math.round((aprovados / total) * 100) : 100;
    return { total, aprovados, reprovados, saudePct };
  }, [checklists]);

  const chartData = useMemo(() => {
    const manutencoesPorTipo = manutencoes.reduce((acc, m) => {
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

    const consumoPorVeiculo = abastecimentos.reduce((acc, a) => {
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

    const alertasAtivos = alertas.filter(a => a.ativo);
    const alertasPorPrioridade = alertasAtivos.reduce((acc, a) => {
      const prioridade = a.prioridade || 'Normal';
      acc[prioridade] = (acc[prioridade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const alertasChart = Object.entries(alertasPorPrioridade).map(([name, value]) => ({ name, value }));

    const checklistChart = [
      { name: 'Aprovados', value: checklistStats.aprovados },
      { name: 'Reprovados', value: checklistStats.reprovados },
    ].filter(d => d.value > 0);

    return { manutencaoChart, statusChart, consumoChart, alertasChart, checklistChart };
  }, [manutencoes, veiculos, abastecimentos, alertas, checklistStats]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

  const alertasDinamicos = useMemo(() => {
    const alerts: any[] = [];
    manutencoes.filter(m => m.data && new Date(m.data) < new Date()).forEach(m => {
      alerts.push({ id: `manutencao-${m.id}`, tipo: 'Manutenção Vencida', descricao: `${m.veiculo_placa || 'Veículo'} - ${m.tipo_manutencao || 'Manutenção'}`, prioridade: 'Urgente', variant: 'warning' as const });
    });
    veiculos.filter(v => v.combustivel_atual !== null && v.combustivel_atual < 20).forEach(v => {
      alerts.push({ id: `combustivel-${v.id}`, tipo: 'Combustível Baixo', descricao: `${v.placa} - ${v.combustivel_atual}% restante`, prioridade: 'Atenção', variant: 'default' as const });
    });
    checklists.filter(c => c.status_final === 'Reprovado').slice(0, 3).forEach(c => {
      alerts.push({ id: `checklist-${c.id}`, tipo: 'Checklist Reprovado', descricao: `${c.placa_veiculo} - ${c.total_nao_conformidades} falha(s)`, prioridade: 'Alta', variant: 'warning' as const });
    });
    return alerts.slice(0, 6);
  }, [manutencoes, veiculos, checklists]);

  const handleExportDashboard = () => {
    const summary = buildSummaryCards([
      { label: 'Total de Veículos', value: totalVeiculos },
      { label: 'Motoristas Ativos', value: motoristasAtivos },
      { label: 'Manutenções Pendentes', value: manutencoesPendentes },
      { label: 'Consumo Médio (L)', value: consumoMedio },
      { label: 'Saúde da Frota', value: `${checklistStats.saudePct}%` },
      { label: 'Checklists Realizados', value: checklistStats.total },
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

    const content = `
      ${summary}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua frota</p>
        </div>
        <Button onClick={handleExportDashboard} className="bg-gradient-primary hover:opacity-90 transition-opacity">
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <StaggerContainer>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StaggerItem>
              <StatsCard title="Total de Veículos" value={totalVeiculos.toString()} icon={<Car className="h-5 w-5" />} trend={{ value: `${veiculos.filter(v => v.status === 'Ativo').length} ativos`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Motoristas Ativos" value={motoristasAtivos.toString()} icon={<Users className="h-5 w-5" />} trend={{ value: `${motoristas.length} total`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Manutenções Pendentes" value={manutencoesPendentes.toString()} icon={<Wrench className="h-5 w-5" />} trend={{ value: `${manutencoes.length} total`, isPositive: manutencoesPendentes === 0 }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Consumo Médio" value={`${consumoMedio}L`} icon={<Fuel className="h-5 w-5" />} trend={{ value: `${abastecimentos.length} abastec.`, isPositive: true }} />
            </StaggerItem>
            <StaggerItem>
              <StatsCard title="Saúde da Frota" value={`${checklistStats.saudePct}%`} icon={<ClipboardCheck className="h-5 w-5" />} trend={{ value: `${checklistStats.total} inspeções`, isPositive: checklistStats.saudePct >= 80 }} />
            </StaggerItem>
          </div>
        </StaggerContainer>
      )}

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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.manutencaoChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
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
                <ResponsiveContainer width="100%" height={300}>
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
                <ResponsiveContainer width="100%" height={300}>
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
                <ResponsiveContainer width="100%" height={300}>
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

          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  Alertas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cnhsVencendo.map((motorista) => {
                  const dias = calcularDiasParaVencimento(motorista.cnh_validade);
                  return (
                    <div key={motorista.id} className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">CNH Vencendo</p>
                        <Badge variant="destructive">{dias} dias</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{motorista.nome} - Categoria {motorista.categoria_cnh}</p>
                    </div>
                  );
                })}
                {alertasDinamicos.map((alerta) => (
                  <div key={alerta.id} className={`p-3 border rounded-lg ${alerta.variant === 'warning' ? 'border-warning/20 bg-warning/5' : 'border-primary/20 bg-primary/5'}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{alerta.tipo}</p>
                      <Badge variant={alerta.variant === 'warning' ? 'outline' : 'default'} className={alerta.variant === 'warning' ? 'text-warning border-warning' : ''}>{alerta.prioridade}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alerta.descricao}</p>
                  </div>
                ))}
                {cnhsVencendo.length === 0 && alertasDinamicos.length === 0 && (
                  <div className="p-3 border border-success/20 bg-success/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">Tudo OK</p>
                      <Badge className="bg-success/10 text-success border-success">OK</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Nenhum alerta ativo no momento</p>
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
