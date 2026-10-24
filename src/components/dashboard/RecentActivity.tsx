import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, User, Wrench, Fuel, Clock } from "lucide-react";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-primary/10 text-primary",
  error: "bg-destructive/10 text-destructive",
};

export function RecentActivity() {
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();

  const activities = useMemo(() => {
    const allActivities: Array<{
      id: string;
      type: string;
      icon: any;
      title: string;
      description: string;
      time: string;
      status: string;
      timestamp: Date;
    }> = [];

    // Manutenções recentes
    manutencoes.slice(0, 3).forEach((m) => {
      const dataManutencao = m.data ? new Date(m.data) : null;
      const isPast = dataManutencao && dataManutencao < new Date();
      const status = isPast ? 'success' : 'warning';
      
      allActivities.push({
        id: `manutencao-${m.id}`,
        type: "maintenance",
        icon: Wrench,
        title: isPast ? "Manutenção realizada" : "Manutenção agendada",
        description: `${m.tipo_manutencao || 'Manutenção'} - ${m.veiculo_placa || 'Veículo'}`,
        time: formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR }),
        status,
        timestamp: new Date(m.created_at),
      });
    });

    // Abastecimentos recentes
    abastecimentos.slice(0, 3).forEach((a) => {
      allActivities.push({
        id: `abastecimento-${a.id}`,
        type: "fuel",
        icon: Fuel,
        title: "Abastecimento registrado",
        description: `${a.litros || 0}L - ${a.veiculo_placa || 'Veículo'}`,
        time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR }),
        status: "info",
        timestamp: new Date(a.created_at),
      });
    });

    // Motoristas recentes
    motoristas.slice(0, 2).forEach((m) => {
      allActivities.push({
        id: `motorista-${m.id}`,
        type: "driver",
        icon: User,
        title: "Motorista cadastrado",
        description: `${m.nome} - CNH categoria ${m.categoria_cnh || 'N/A'}`,
        time: formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR }),
        status: "success",
        timestamp: new Date(m.created_at),
      });
    });

    // Veículos recentes
    veiculos.slice(0, 2).forEach((v) => {
      allActivities.push({
        id: `veiculo-${v.id}`,
        type: "vehicle",
        icon: Car,
        title: "Veículo cadastrado",
        description: `${v.marca} ${v.modelo} - ${v.placa}`,
        time: formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: ptBR }),
        status: v.status?.toLowerCase() === 'ativo' || v.status?.toLowerCase() === 'disponível' ? 'success' : 'warning',
        timestamp: new Date(v.created_at),
      });
    });

    // Ordenar por timestamp (mais recentes primeiro) e pegar os 8 mais recentes
    return allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }, [veiculos, motoristas, manutencoes, abastecimentos]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/70 pt-0">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade registrada
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusColors[activity.status as keyof typeof statusColors]}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <p className="truncate text-sm text-muted-foreground">{activity.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
