import { Car, Users, Wrench, Fuel, TrendingUp, AlertTriangle, Activity } from "lucide-react";
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
import { calcularConsumoMedio, verificarCNHVencendo, calcularDiasParaVencimento } from "@/utils/calculations";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();
  const { alertas } = useAlertas();

  const [search, setSearch] = useState("");
  const searchLower = search.trim().toLowerCase();

  // Filtragem reativa por placa
  const filteredVeiculos = useMemo(() => {
    if (!searchLower) return veiculos;
    return veiculos.filter((v) => (v.placa || "").toLowerCase().includes(searchLower));
  }, [veiculos, searchLower]);

  const filteredAbastecimentos = useMemo(() => {
    if (!searchLower) return abastecimentos;
    return abastecimentos.filter((a) => (a.veiculo_placa || "").toLowerCase().includes(searchLower));
  }, [abastecimentos, searchLower]);

  const filteredManutencoes = useMemo(() => {
    if (!searchLower) return manutencoes;
    return manutencoes.filter((m) => (m.veiculo_placa || "").toLowerCase().includes(searchLower));
  }, [manutencoes, searchLower]);

  const filteredMotoristas = useMemo(() => {
    if (!searchLower) return motoristas;
    return motoristas.filter((m) => (m.placa || "").toLowerCase().includes(searchLower));
  }, [motoristas, searchLower]);

  const filteredAlertas = useMemo(() => {
    if (!searchLower) return alertas;
    return alertas.filter((a) => (a.veiculo || "").toLowerCase().includes(searchLower));
  }, [alertas, searchLower]);

  // Funções para cálculo de tendências
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };
  const startCurrent = daysAgo(30);

  function calcTrend(current: number, previous: number) {
    // Se não houver dados no período anterior, retornar "—"
    if (previous === 0) {
      return { value: "—", isPositive: true };
    }
    const diff = current - previous;
    const pct = (diff / Math.abs(previous)) * 100;
    const rounded = Math.round(pct * 10) / 10;
    return { value: `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}%`, isPositive: rounded >= 0 };
  }

  // Métricas em tempo real (filtradas)
  const totalVeiculos = filteredVeiculos.length;
  const motoristasAtivos = filteredMotoristas.filter((m) => m.status === "Ativo").length;

  const manutencoesAgendadas = useMemo(() => {
    return filteredManutencoes.filter((m) => (m.status || "").toLowerCase() === "agendada").length;
  }, [filteredManutencoes]);

  const consumoMedio = useMemo(() => {
    const consumo = calcularConsumoMedio(filteredAbastecimentos);
    return consumo > 0 ? consumo.toFixed(1) : "0";
  }, [filteredAbastecimentos]);

  const cnhsVencendo = useMemo(() => {
    return verificarCNHVencendo(filteredMotoristas, 30);
  }, [filteredMotoristas]);

  // Tendências (%) - baseadas em valores reais totais
  const trendVeiculos = useMemo(() => {
    // Total atual vs total de 30 dias atrás
    const veiculosAntigos = veiculos.filter(v => {
      const created = new Date(v.created_at);
      return created < startCurrent;
    });
    const totalAtual = filteredVeiculos.length;
    const totalAnterior = veiculosAntigos.length;
    return calcTrend(totalAtual, totalAnterior);
  }, [filteredVeiculos, veiculos, startCurrent]);

  const trendMotoristas = useMemo(() => {
    // Motoristas ativos atuais vs 30 dias atrás
    const motoristasAtivosAtuais = filteredMotoristas.filter(m => m.status === "Ativo").length;
    const motoristasAtivosAntigos = motoristas.filter(m => {
      const created = new Date(m.created_at);
      return created < startCurrent && m.status === "Ativo";
    }).length;
    return calcTrend(motoristasAtivosAtuais, motoristasAtivosAntigos);
  }, [filteredMotoristas, motoristas, startCurrent]);

  // Tendência de manutenções agendadas (total atual vs 30 dias atrás)
  const trendManutencoes = useMemo(() => {
    const agendadasAtuais = filteredManutencoes.filter((m) => (m.status || "").toLowerCase() === "agendada").length;
    const agendadasAntigas = manutencoes.filter(m => {
      const created = new Date(m.created_at);
      return created < startCurrent && (m.status || "").toLowerCase() === "agendada";
    }).length;
    return calcTrend(agendadasAtuais, agendadasAntigas);
  }, [filteredManutencoes, manutencoes, startCurrent]);

  const trendConsumo = useMemo(() => {
    // Consumo médio atual vs anterior
    const consumoAtual = Number(consumoMedio) || 0;
    // Calcular consumo médio dos abastecimentos antigos (mais de 30 dias)
    const abastecimentosAntigos = abastecimentos.filter(a => {
      const created = new Date(a.created_at);
      return created < startCurrent;
    });
    const consumoAnterior = calcularConsumoMedio(abastecimentosAntigos);
    return calcTrend(consumoAtual, consumoAnterior);
  }, [consumoMedio, abastecimentos, startCurrent]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Manutenções por tipo
    const manutencoesPorTipo = filteredManutencoes.reduce((acc: Record<string, number>, m) => {
      const tipo = m.tipo_manutencao || "Outros";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const manutencaoChart = Object.entries(manutencoesPorTipo).map(([name, value]) => ({
      name,
      total: value,
    }));

    // Status dos veículos
    const veiculosPorStatus = filteredVeiculos.reduce((acc: Record<string, number>, v) => {
      const status = v.status || "Sem Status";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusChart = Object.entries(veiculosPorStatus).map(([name, value]) => ({
      name,
      value,
    }));

    // Consumo por veículo (top 5)
    const consumoPorVeiculo = filteredAbastecimentos.reduce((acc: Record<string, { litros: number; custo: number }>, a) => {
      if (!a.veiculo_placa) return acc;
      if (!acc[a.veiculo_placa]) acc[a.veiculo_placa] = { litros: 0, custo: 0 };
      acc[a.veiculo_placa].litros += a.litros || 0;
      acc[a.veiculo_placa].custo += Number(a.custo_total) || 0;
      return acc;
    }, {});

    const consumoChart = Object.entries(consumoPorVeiculo)
      .map(([placa, data]) => ({ placa, litros: data.litros, custo: data.custo }))
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 5);

    return { manutencaoChart, statusChart, consumoChart };
  }, [filteredManutencoes, filteredVeiculos, filteredAbastecimentos]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

  // Alertas dinâmicos
  const alertasDinamicos = useMemo(() => {
    const alerts: any[] = [];

    const manutencoesVencidas = filteredManutencoes.filter((m) => {
      if (!m.data) return false;
      const dataManutencao = new Date(m.data);
      return dataManutencao < new Date();
    });

    manutencoesVencidas.forEach((m) => {
      alerts.push({
        id: `manutencao-${m.id}`,
        tipo: 'Manutenção Vencida',
        descricao: `${m.veiculo_placa || 'Veículo'} - ${m.tipo_manutencao || 'Manutenção'}`,
        prioridade: 'Urgente',
        variant: 'warning' as const,
      });
    });

    const veiculosCombustivelBaixo = filteredVeiculos.filter(v => v.combustivel_atual !== null && v.combustivel_atual < 20);
    veiculosCombustivelBaixo.forEach(v => {
      alerts.push({
        id: `combustivel-${v.id}`,
        tipo: 'Combustível Baixo',
        descricao: `${v.placa} - ${v.combustivel_atual}% restante`,
        prioridade: 'Atenção',
        variant: 'default' as const,
      });
    });

    return alerts.slice(0, 5);
  }, [filteredManutencoes, filteredVeiculos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua frota</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar placa (ex: ABC-1234)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1 text-sm bg-card text-foreground focus:outline-none"
            aria-label="Buscar placa"
          />
          <Button className="bg-gradient-primary hover:bg-primary-hover">
            <TrendingUp className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Veículos"
          value={totalVeiculos.toString()}
          icon={<Car className="h-4 w-4" />}
          trend={trendVeiculos}
        />
        <StatsCard
          title="Motoristas Ativos"
          value={motoristasAtivos.toString()}
          icon={<Users className="h-4 w-4" />}
          trend={trendMotoristas}
        />
        <StatsCard
          title="Manutenções Agendadas"
          value={manutencoesAgendadas.toString()}
          icon={<Wrench className="h-4 w-4" />}
          trend={trendManutencoes}
        />
        <StatsCard
          title="Consumo Médio"
          value={`${consumoMedio}L`}
          icon={<Fuel className="h-4 w-4" />}
          trend={trendConsumo}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manutenções por Tipo */}
        {chartData.manutencaoChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Manutenções por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.manutencaoChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                    {chartData.manutencaoChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status dos Veículos - Pie */}
        {chartData.statusChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Status dos Veículos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={50}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {chartData.statusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Consumo por Veículo */}
        {chartData.consumoChart.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-primary" />
                Top 5 Veículos - Consumo de Combustível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.consumoChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="placa" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="litros" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    name="Litros"
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="custo" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2} 
                    name="Custo (R$)"
                    dot={{ fill: 'hsl(var(--warning))', r: 4 }}
                    />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity searchFilter={searchLower} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cnhsVencendo.map((motorista, index) => {
                const dias = calcularDiasParaVencimento(motorista.cnh_validade);
                return (
                  <div key={motorista.id ?? index} className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">CNH Vencendo</p>
                      <Badge variant="destructive">{dias} dias</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {motorista.nome} - Categoria {motorista.categoria_cnh}
                    </p>
                  </div>
                );
              })}

              {cnhsVencendo.length === 0 && alertasDinamicos.length === 0 && (
                <div className="p-3 border border-success/20 bg-success/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Tudo OK</p>
                    <Badge className="bg-success/10 text-success border-success">OK</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Nenhum alerta ativo no momento</p>
                </div>
              )}

              {alertasDinamicos.map((alerta) => (
                <div key={alerta.id} className={`p-3 border rounded-lg ${alerta.variant === 'warning' ? 'border-warning/20 bg-warning/5' : 'border-primary/20 bg-primary/5'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{alerta.tipo}</p>
                    <Badge variant={alerta.variant === 'warning' ? 'outline' : 'default'} className={alerta.variant === 'warning' ? 'text-warning border-warning' : ''}>
                      {alerta.prioridade}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alerta.descricao}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}