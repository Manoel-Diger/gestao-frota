import { AlertTriangle, Bell, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertForm } from "@/components/alerts/AlertForm";
import { useAlertas } from "@/hooks/useAlertas";

function Alerts() {
  const { alertas, loading, error, refreshAlertas } = useAlertas();

  const alertSettings = [
    {
      category: "Manutenção",
      description: "Alertas de manutenções vencidas e próximas",
      enabled: true,
    },
    {
      category: "Documentação",
      description: "CNH, licenciamento e seguros vencendo",
      enabled: true,
    },
    {
      category: "Combustível",
      description: "Níveis baixos de combustível",
      enabled: true,
    },
    {
      category: "Comportamento",
      description: "Velocidade excessiva e direção agressiva",
      enabled: false,
    },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alertas</h1>
          <p className="text-muted-foreground">Monitore alertas e notificações importantes</p>
        </div>
        <AlertForm onSuccess={refreshAlertas} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
                              {getPriorityBadge(alerta.prioridade || "Média")}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{alerta.descricao}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                              <span>{new Date(alerta.created_at).toLocaleString("pt-BR")}</span>
                              {alerta.veiculo && <span>Veículo: {alerta.veiculo}</span>}
                              {alerta.motorista && <span>Motorista: {alerta.motorista}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={alerta.ativo ? "bg-success/10 text-success border-success" : "bg-gray-500/10 text-gray-500 border-gray-500"}
                          >
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

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Alertas Ativos</span>
                <Badge className="bg-success/10 text-success border-success">{alertas.filter((a) => a.ativo).length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Alertas Inativos</span>
                <Badge variant="outline">{alertas.filter((a) => !a.ativo).length}</Badge>
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

export default Alerts;
