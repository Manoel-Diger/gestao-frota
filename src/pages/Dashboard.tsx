import { Car, Users, Wrench, Fuel, TrendingUp, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { calcularConsumoMedio, verificarCNHVencendo, calcularDiasParaVencimento } from "@/utils/calculations";
import { useMemo } from "react";
import dayjs from "dayjs";
import { AlertForm } from "@/components/alerts/AlertForm";

export default function Dashboard() {
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();

  // Calcular métricas em tempo real
  const totalVeiculos = veiculos.length;
  const motoristasAtivos = motoristas.filter(m => m.status === "Ativo").length;
  const manutencoesPendentes = manutencoes.filter(m => m.data && new Date(m.data) > new Date()).length;
  
  // Calcular consumo médio real (km/L)
  const consumoMedio = useMemo(() => {
    const consumo = calcularConsumoMedio(abastecimentos);
    return consumo > 0 ? consumo.toFixed(1) : "0";
  }, [abastecimentos]);

  // Verificar CNHs vencendo
  const cnhsVencendo = useMemo(() => {
    return verificarCNHVencendo(motoristas, 30);
  }, [motoristas]);

  // Novas métricas para o dashboard
  const manutencoesVencidas = useMemo(() => {
      return manutencoes.filter(m => m.data && new Date(m.data) < new Date());
  }, [manutencoes]);

  const veiculosBaixoCombustivel = useMemo(() => {
      // Filtra veículos com menos de 20% de combustível, por exemplo.
      return veiculos.filter(v => v.combustivel_atual && v.combustivel_atual < 20);
  }, [veiculos]);

  // Lógica para calcular tendências dinâmicas
  const now = dayjs();
  const thirtyDaysAgo = now.subtract(30, 'day');
  const sixtyDaysAgo = now.subtract(60, 'day');

  const calculateTrend = (items: { created_at: string }[]) => {
      const currentPeriodCount = items.filter(item => dayjs(item.created_at).isAfter(thirtyDaysAgo)).length;
      const previousPeriodCount = items.filter(item => dayjs(item.created_at).isAfter(sixtyDaysAgo) && dayjs(item.created_at).isBefore(thirtyDaysAgo)).length;
      
      if (previousPeriodCount === 0) {
          return { value: "100%", isPositive: true };
      }

      const trendValue = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
      return {
          value: `${trendValue.toFixed(1)}%`,
          isPositive: trendValue >= 0,
      };
  };

  const veiculoTrend = useMemo(() => calculateTrend(veiculos), [veiculos]);
  const motoristaTrend = useMemo(() => calculateTrend(motoristas), [motoristas]);
  const manutencaoTrend = useMemo(() => calculateTrend(manutencoes), [manutencoes]);
  const abastecimentoTrend = useMemo(() => calculateTrend(abastecimentos), [abastecimentos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua frota</p>
        </div>
        <div className="flex gap-2">
          {/* Botão de Novo Alerta */}
          <AlertForm />
          {/* Botão de Gerar Relatório */}
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
          trend={veiculoTrend}
        />
        <StatsCard
          title="Motoristas Ativos"
          value={motoristasAtivos.toString()}
          icon={<Users className="h-4 w-4" />}
          trend={motoristaTrend}
        />
        <StatsCard
          title="Manutenções Pendentes"
          value={manutencoesPendentes.toString()}
          icon={<Wrench className="h-4 w-4" />}
          trend={manutencaoTrend}
        />
        <StatsCard
          title="Consumo Médio"
          value={`${consumoMedio}L`}
          icon={<Fuel className="h-4 w-4" />}
          trend={abastecimentoTrend}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Renderizar Manutenções Vencidas (dinâmico) */}
              {manutencoesVencidas.map(m => (
                  <div key={m.id} className="p-3 border border-warning/20 bg-warning/5 rounded-lg">
                      <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">Manutenção Vencida</p>
                          <Badge variant="outline" className="text-warning border-warning">
                              Urgente
                          </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                          Veículo {m.veiculo_placa} - {m.descricao}
                      </p>
                  </div>
              ))}
              
              {/* Renderizar CNHs Vencendo (já estava dinâmico) */}
              {cnhsVencendo.map((motorista, index) => {
                const dias = calcularDiasParaVencimento(motorista.cnh_validade);
                return (
                  <div key={motorista.id} className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">CNH Vencendo</p>
                      <Badge variant="destructive">
                        {dias} dias
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {motorista.nome} - Categoria {motorista.categoria_cnh}
                    </p>
                  </div>
                );
              })}

              {/* Renderizar Veículos com Baixo Combustível (dinâmico) */}
              {veiculosBaixoCombustivel.map(v => (
                  <div key={v.id} className="p-3 border border-primary/20 bg-primary/5 rounded-lg">
                      <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">Combustível Baixo</p>
                          <Badge variant="outline" className="text-primary border-primary">
                              Atenção
                          </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                          Veículo {v.placa} - {v.combustivel_atual}% restante
                      </p>
                  </div>
              ))}

              {/* Mensagem caso não haja alertas */}
              {manutencoesVencidas.length === 0 && cnhsVencendo.length === 0 && veiculosBaixoCombustivel.length === 0 && (
                <div className="p-3 border border-success/20 bg-success/5 rounded-lg text-center">
                    <p className="font-medium text-sm">Tudo Certo!</p>
                    <p className="text-sm text-muted-foreground mt-1">Nenhum alerta pendente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
