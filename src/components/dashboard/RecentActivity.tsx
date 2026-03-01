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
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
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
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade registrada
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-full ${statusColors[activity.status as keyof typeof statusColors]}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
