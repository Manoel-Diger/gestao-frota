import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, User, Wrench, Fuel, Clock } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "maintenance",
    icon: Wrench,
    title: "Manutenção concluída",
    description: "Troca de óleo - Caminhão ABC-1234",
    time: "2 horas atrás",
    status: "success",
  },
  {
    id: 2,
    type: "fuel",
    icon: Fuel,
    title: "Abastecimento registrado",
    description: "45L - Van DEF-5678",
    time: "4 horas atrás",
    status: "info",
  },
  {
    id: 3,
    type: "driver",
    icon: User,
    title: "Motorista cadastrado",
    description: "Maria Santos - CNH categoria D",
    time: "1 dia atrás",
    status: "success",
  },
  {
    id: 4,
    type: "vehicle",
    icon: Car,
    title: "Veículo em manutenção",
    description: "Caminhão GHI-9012 - Revisão geral",
    time: "2 dias atrás",
    status: "warning",
  },
];

const statusColors = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
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
        ))}
      </CardContent>
    </Card>
  );
}