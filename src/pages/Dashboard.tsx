import { Car, Users, Wrench, Fuel, TrendingUp, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua frota</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover">
          <TrendingUp className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Veículos"
          value="24"
          icon={<Car className="h-4 w-4" />}
          trend={{ value: "2.1%", isPositive: true }}
        />
        <StatsCard
          title="Motoristas Ativos"
          value="18"
          icon={<Users className="h-4 w-4" />}
          trend={{ value: "1.2%", isPositive: true }}
        />
        <StatsCard
          title="Manutenções Pendentes"
          value="3"
          icon={<Wrench className="h-4 w-4" />}
          trend={{ value: "0.5%", isPositive: false }}
        />
        <StatsCard
          title="Consumo Médio"
          value="12.5L"
          icon={<Fuel className="h-4 w-4" />}
          trend={{ value: "3.2%", isPositive: false }}
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
              <div className="p-3 border border-warning/20 bg-warning/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Manutenção Vencida</p>
                  <Badge variant="outline" className="text-warning border-warning">
                    Urgente
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Caminhão ABC-1234 - Revisão de 10.000km
                </p>
              </div>

              <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">CNH Vencendo</p>
                  <Badge variant="destructive">
                    7 dias
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  João Silva - Categoria D
                </p>
              </div>

              <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Combustível Baixo</p>
                  <Badge variant="outline" className="text-primary border-primary">
                    Atenção
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Van DEF-5678 - 15% restante
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}