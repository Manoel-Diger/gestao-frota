import { Wrench, Plus, Calendar, Car, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default function Maintenance() {
  const maintenances = [
    {
      id: 1,
      vehicle: "Caminhão ABC-1234",
      type: "Revisão 10.000km",
      status: "Vencida",
      dueDate: "2024-01-15",
      cost: "R$ 850,00",
      priority: "Alta"
    },
    {
      id: 2,
      vehicle: "Van DEF-5678",
      type: "Troca de óleo",
      status: "Agendada",
      dueDate: "2024-02-20",
      cost: "R$ 120,00",
      priority: "Média"
    },
    {
      id: 3,
      vehicle: "Truck GHI-9012",
      type: "Alinhamento",
      status: "Concluída",
      dueDate: "2024-01-10",
      cost: "R$ 180,00",
      priority: "Baixa"
    },
    {
      id: 4,
      vehicle: "Van JKL-3456",
      type: "Revisão freios",
      status: "Em andamento",
      dueDate: "2024-02-05",
      cost: "R$ 450,00",
      priority: "Alta"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Vencida":
        return <Badge variant="destructive">Vencida</Badge>;
      case "Agendada":
        return <Badge className="bg-warning/10 text-warning border-warning">Agendada</Badge>;
      case "Em andamento":
        return <Badge className="bg-primary/10 text-primary border-primary">Em andamento</Badge>;
      case "Concluída":
        return <Badge className="bg-success/10 text-success border-success">Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "text-destructive";
      case "Média":
        return "text-warning";
      case "Baixa":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manutenções</h1>
          <p className="text-muted-foreground">Gerencie as manutenções da sua frota</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Nova Manutenção
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Manutenções Vencidas"
          value="1"
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={{ value: "0%", isPositive: false }}
        />
        <StatsCard
          title="Agendadas"
          value="1"
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: "2.1%", isPositive: true }}
        />
        <StatsCard
          title="Em Andamento"
          value="1"
          icon={<Wrench className="h-4 w-4" />}
          trend={{ value: "1.5%", isPositive: true }}
        />
        <StatsCard
          title="Concluídas (mês)"
          value="8"
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{ value: "12%", isPositive: true }}
        />
      </div>

      {/* Maintenance List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Manutenções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maintenances.map((maintenance) => (
              <div key={maintenance.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{maintenance.vehicle}</h3>
                    <p className="text-sm text-muted-foreground">{maintenance.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">Vencimento</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(maintenance.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">Custo</p>
                    <p className="text-sm text-muted-foreground">{maintenance.cost}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">Prioridade</p>
                    <p className={`text-sm ${getPriorityColor(maintenance.priority)}`}>
                      {maintenance.priority}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(maintenance.status)}
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}