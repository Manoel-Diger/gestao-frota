import { AlertTriangle, Bell, Settings, Check, X, Calendar, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertForm } from "@/components/alerts/AlertForm";
import { useAlertas } from "@/hooks/useAlertas";

export default function Alerts() {
  const { alertas, loading, error, refreshAlertas } = useAlertas();
  
  const alerts = [
    {
      id: 1,
      type: "Manutenção Vencida",
      message: "Caminhão ABC-1234 - Revisão de 10.000km vencida há 5 dias",
      priority: "Alta",
      timestamp: "2024-01-20 08:30",
      vehicle: "ABC-1234",
      status: "Pendente",
      category: "maintenance"
    },
    {
      id: 2,
      type: "CNH Vencendo",
      message: "João Silva - Categoria D vence em 7 dias",
      priority: "Alta",
      timestamp: "2024-01-19 14:15",
      vehicle: null,
      status: "Pendente",
      category: "driver"
    },
    {
      id: 3,
      type: "Combustível Baixo",
      message: "Van DEF-5678 - 15% de combustível restante",
      priority: "Média",
      timestamp: "2024-01-19 11:45",
      vehicle: "DEF-5678",
      status: "Visualizado",
      category: "fuel"
    },
    {
      id: 4,
      type: "Velocidade Excessiva",
      message: "Truck GHI-9012 - Excesso de velocidade na Rodovia Anhanguera",
      priority: "Média",
      timestamp: "2024-01-18 16:20",
      vehicle: "GHI-9012",
      status: "Resolvido",
      category: "behavior"
    }
  ];

  const alertSettings = [
    {
      category: "Manutenção",
      description: "Alertas de manutenções vencidas e próximas",
      enabled: true
    },
    {
      category: "Documentação",
      description: "CNH, licenciamento e seguros vencendo",
      enabled: true
    },
    {
      category: "Combustível",
      description: "Níveis baixos de combustível",
      enabled: true
    },
    {
      category: "Comportamento",
      description: "Velocidade excessiva e direção agressiva",
      enabled: false
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Alta":
        return <Badge variant="destructive">Alta</Badge>;
      case "Média":
        return <Badge className="bg-warning/10 text-warning border-warning">Média</Badge>;
      case "Baixa":
        return <Badge variant="outline">Baixa</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pendente":
        return <Badge variant="destructive">Pendente</Badge>;
      case "Visualizado":
        return <Badge className="bg-warning/10 text-warning border-warning">Visualizado</Badge>;
      case "Resolvido":
        return <Badge className="bg-success/10 text-success border-success">Resolvido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "maintenance":
        return <AlertTriangle className="h-4 w-4" />;
      case "driver":
        return <Calendar className="h-4 w-4" />;
      case "fuel":
        return <Car className="h-4 w-4" />;
      case "behavior":
        return <Bell className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertas</h1>
          <p className="text-muted-foreground">Monitore alertas e notificações importantes</p>
        </div>
        <AlertForm onSuccess={refreshAlertas} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando alertas...</div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">Erro: {error}</div>
              ) : alertas.length === 0 ? (
                <div className="text-center py-8">Nenhum alerta configurado</div>
              ) : (
                <div className="space-y-4">
                  {alertas.map((alerta) => (
                    <div key={alerta.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                              <h3 className="font-medium">{alerta.tipo_alerta}</h3>
                              {getPriorityBadge(alerta.prioridade || 'Média')}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{alerta.descricao}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                              <span>{new Date(alerta.created_at).toLocaleString('pt-BR')}</span>
                              {alerta.veiculo && <span>Veículo: {alerta.veiculo}</span>}
                              {alerta.motorista && <span>Motorista: {alerta.motorista}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={alerta.ativo ? "bg-success/10 text-success border-success" : "bg-gray-500/10 text-gray-500 border-gray-500"}>
                            {alerta.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alertSettings.map((setting, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{setting.category}</h4>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch defaultChecked={setting.enabled} />
                  </div>
                  {index < alertSettings.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Alertas Ativos</span>
                <Badge className="bg-success/10 text-success border-success">
                  {alertas.filter(a => a.ativo).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Alertas Inativos</span>
                <Badge variant="outline">
                  {alertas.filter(a => !a.ativo).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total de Alertas</span>
                <Badge variant="secondary">{alertas.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}