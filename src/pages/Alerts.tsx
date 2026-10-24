import { AlertTriangle, Bell, Settings, Shield, Filter, ShieldAlert, CheckCircle2, IdCard, Wrench, Fuel, ClipboardList, Route } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertForm } from "@/components/alerts/AlertForm";
import { useAlertas } from "@/hooks/useAlertas";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useChecklists } from "@/hooks/useChecklists";
import { useSmartAlerts, SmartAlert } from "@/hooks/useSmartAlerts";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Ícone por categoria de alerta (substitui os emojis por ícones do sistema)
function CategoriaIcon({ categoria }: { categoria: string }) {
  const icons: Record<string, typeof Wrench> = {
    cnh: IdCard,
    manutencao: Wrench,
    combustivel: Fuel,
    checklist: ClipboardList,
    km: Route,
  };
  const Icon = icons[categoria] || AlertTriangle;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

export default function Alerts() {
  const { alertas, loading, error, refreshAlertas } = useAlertas();
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();
  const { checklists } = useChecklists();
  const [filterCategoria, setFilterCategoria] = useState<string>('todos');

  const { alerts: smartAlerts, contagem } = useSmartAlerts({
    motoristas, manutencoes, abastecimentos, veiculos, checklists,
  });

  const filteredSmartAlerts = useMemo(() => {
    if (filterCategoria === 'todos') return smartAlerts;
    return smartAlerts.filter(a => a.categoria === filterCategoria);
  }, [smartAlerts, filterCategoria]);

  const categorias = [
    { value: 'todos', label: 'Todos' },
    { value: 'cnh', label: 'CNH' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'combustivel', label: 'Combustível' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'km', label: 'Km/Revisão' },
  ];

  const alertSettings = [
    { category: "Manutenção", description: "Alertas de manutenções vencidas e próximas", enabled: true },
    { category: "Documentação", description: "CNH, licenciamento e seguros vencendo", enabled: true },
    { category: "Combustível", description: "Níveis baixos de combustível", enabled: true },
    { category: "Comportamento", description: "Velocidade excessiva e direção agressiva", enabled: false },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Crítica": return <Badge variant="destructive">Crítica</Badge>;
      case "Alta": return <Badge variant="warning">Alta</Badge>;
      case "Média": return <Badge variant="default">Média</Badge>;
      case "Baixa": return <Badge variant="muted">Baixa</Badge>;
      default: return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitore alertas inteligentes e notificações</p>
        </div>
        <AlertForm onSuccess={refreshAlertas} />
      </div>

      {/* Summary Banner */}
      {contagem.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Críticos" value={contagem.critica} icon={<ShieldAlert />} tone="danger" />
          <MetricCard title="Altos" value={contagem.alta} icon={<AlertTriangle />} tone="warning" />
          <MetricCard title="Médios" value={contagem.media} icon={<Bell />} tone="primary" />
          <MetricCard title="Baixos" value={contagem.baixa} icon={<CheckCircle2 />} tone="success" />
        </div>
      )}

      <Tabs defaultValue="smart" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="smart" className="gap-2">
            <Shield className="h-4 w-4" />
            Inteligentes ({contagem.total})
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Bell className="h-4 w-4" />
            Manuais ({alertas.length})
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Smart Alerts Tab */}
        <TabsContent value="smart" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categorias.map(c => (
              <Button
                key={c.value}
                variant={filterCategoria === c.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategoria(c.value)}
                className="text-xs"
              >
                {c.label}
              </Button>
            ))}
          </div>

          {filteredSmartAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-success mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Tudo em ordem!</h3>
                <p className="text-muted-foreground text-sm">Nenhum alerta detectado para esta categoria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSmartAlerts.map((alerta) => (
                <Card key={alerta.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CategoriaIcon categoria={alerta.categoria} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{alerta.tipo}</h3>
                          {getPriorityBadge(alerta.prioridade)}
                        </div>
                        <p className="text-sm text-foreground/80">{alerta.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alerta.detalhe}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Manual Alerts Tab */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-primary" />
                Alertas Manuais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando alertas...</div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">Erro: {error}</div>
              ) : alertas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum alerta manual configurado</div>
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
                        <Badge variant={alerta.ativo ? "success" : "muted"}>
                          {alerta.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-primary" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
