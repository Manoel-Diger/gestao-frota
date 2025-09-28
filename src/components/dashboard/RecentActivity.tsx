import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, User, Wrench, Fuel, Clock, AlertTriangle } from "lucide-react";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useAlertas } from "@/hooks/useAlertas";
import { useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/pt-br';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const statusColors = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
};

export function RecentActivity() {
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();
  const { alertas } = useAlertas(); // Supondo que você tem um hook para alertas

  const recentActivities = useMemo(() => {
    // Combine dados de diferentes fontes em um único array
    const allActivities = [
      ...manutencoes.map(m => ({
        id: `manutencao-${m.id}`,
        created_at: m.created_at,
        type: "maintenance",
        icon: Wrench,
        title: "Manutenção concluída",
        description: `Manutenção do veículo ${m.veiculo_placa}`,
        status: "success",
      })),
      ...abastecimentos.map(a => ({
        id: `abastecimento-${a.id}`,
        created_at: a.created_at,
        type: "fuel",
        icon: Fuel,
        title: "Abastecimento registrado",
        description: `${a.litros}L - Veículo ${a.veiculo_placa}`,
        status: "info",
      })),
      ...alertas.map(a => ({
        id: `alerta-${a.id}`,
        created_at: a.created_at,
        type: "alert",
        icon: AlertTriangle,
        title: "Novo Alerta",
        description: `${a.tipo_alerta} - ${a.descricao}`,
        status: "warning",
      })),
      // Adicione aqui outras fontes de dados, como cadastro de veículos ou motoristas
    ];

    // Ordena as atividades por data de criação e pega as 10 mais recentes
    return allActivities.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()).slice(0, 10);
  }, [manutencoes, abastecimentos, alertas]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-full ${statusColors[activity.status as keyof typeof statusColors]}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{dayjs(activity.created_at).fromNow()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground">Nenhuma atividade recente encontrada.</p>
        )}
      </CardContent>
    </Card>
  );
}