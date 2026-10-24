
import {
  AlertTriangle,
  Bell,
  Settings,
  Shield,
  ShieldAlert,
  CheckCircle2,
  IdCard,
  Wrench,
  Fuel,
  ClipboardList,
  Route,
} from "lucide-react";
import { useMemo, useState } from "react";

import { MetricCard } from "@/components/shared/MetricCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AlertForm } from "@/components/alerts/AlertForm";
import { useAlertas } from "@/hooks/useAlertas";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useChecklists } from "@/hooks/useChecklists";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";

// Ícone por categoria de alerta.
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

const prioridadeOrdem: Record<string, number> = {
  "crítica": 1,
  critica: 1,
  alta: 2,
  média: 3,
  media: 3,
  baixa: 4,
};

export default function Alerts() {
  const { alertas, loading, error, refreshAlertas } = useAlertas();

  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();
  const { checklists } = useChecklists();

  const [filterCategoria, setFilterCategoria] = useState("todos");

  const { alerts: smartAlerts, contagem } = useSmartAlerts({
    motoristas,
    manutencoes,
    abastecimentos,
    veiculos,
    checklists,
  });

  const filteredSmartAlerts = useMemo(() => {
    if (filterCategoria === "todos") return smartAlerts;

    return smartAlerts.filter(
      (alerta) => alerta.categoria === filterCategoria
    );
  }, [smartAlerts, filterCategoria]);

  // Ordena os alertas manuais sem modificar os dados do banco.
  const alertasOrdenados = useMemo(() => {
    return [...alertas].sort((a, b) => {
      const prioridadeA =
        prioridadeOrdem[a.prioridade?.trim().toLocaleLowerCase("pt-BR") ?? ""] ??
        99;

      const prioridadeB =
        prioridadeOrdem[b.prioridade?.trim().toLocaleLowerCase("pt-BR") ?? ""] ??
        99;

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }

      return (b.created_at || "").localeCompare(a.created_at || "");
    });
  }, [alertas]);

  const categorias = [
    { value: "todos", label: "Todos" },
    { value: "cnh", label: "CNH" },
    { value: "manutencao", label: "Manutenção" },
    { value: "combustivel", label: "Combustível" },
    { value: "checklist", label: "Checklist" },
    { value: "km", label: "Km/Revisão" },
  ];

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
    switch (priority.trim().toLocaleLowerCase("pt-BR")) {
      case "crítica":
      case "critica":
        return <Badge variant="destructive">Crítica</Badge>;

      case "alta":
        return <Badge variant="warning">Alta</Badge>;

      case "média":
      case "media":
        return <Badge variant="default">Média</Badge>;

      case "baixa":
        return <Badge variant="muted">Baixa</Badge>;

      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
            Alertas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitore alertas inteligentes e notificações da frota.
          </p>
        </div>

        <AlertForm onSuccess={refreshAlertas} />
      </div>

      {/* Resumo dos alertas inteligentes */}
      {contagem.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Críticos"
            value={contagem.critica}
            icon={<ShieldAlert />}
            tone="danger"
          />
          <MetricCard
            title="Altos"
            value={contagem.alta}
            icon={<AlertTriangle />}
            tone="warning"
          />
          <MetricCard
            title="Médios"
            value={contagem.media}
            icon={<Bell />}
            tone="primary"
          />
          <MetricCard
            title="Baixos"
            value={contagem.baixa}
            icon={<CheckCircle2 />}
            tone="success"
          />
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

        {/* Alertas inteligentes */}
        <TabsContent value="smart" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <Button
                key={categoria.value}
                variant={
                  filterCategoria === categoria.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setFilterCategoria(categoria.value)}
                className="text-xs"
              >
                {categoria.label}
              </Button>
            ))}
          </div>

          {filteredSmartAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="mx-auto mb-3 h-12 w-12 text-success" />
                <h3 className="text-lg font-semibold">Tudo em ordem!</h3>
                <p className="text-sm text-muted-foreground">
                  Nenhum alerta detectado para esta categoria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSmartAlerts.map((alerta) => (
                <Card key={alerta.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CategoriaIcon categoria={alerta.categoria} />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <h3 className="text-sm font-semibold">
                            {alerta.tipo}
                          </h3>
                          {getPriorityBadge(alerta.prioridade)}
                        </div>

                        <p className="text-sm text-foreground/80">
                          {alerta.descricao}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {alerta.detalhe}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alertas manuais */}
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
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Carregando alertas...
                </div>
              ) : error ? (
                <div className="space-y-3 py-8 text-center">
                  <p className="text-sm text-destructive">
                    Não foi possível carregar os alertas: {error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refreshAlertas()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : alertasOrdenados.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="mx-auto mb-3 h-9 w-9 text-muted-foreground/60" />
                  <p className="font-medium">Nenhum alerta manual cadastrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Os alertas criados aparecerão nesta área.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasOrdenados.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <AlertTriangle className="h-[18px] w-[18px]" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                              <h3 className="font-medium">
                                {alerta.tipo_alerta || "Alerta manual"}
                              </h3>

                              {getPriorityBadge(alerta.prioridade || "Média")}
                            </div>

                            <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                              {alerta.descricao || "Sem descrição informada."}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                              <span>
                                {alerta.created_at
                                  ? new Date(alerta.created_at).toLocaleString(
                                      "pt-BR"
                                    )
                                  : "Data não informada"}
                              </span>

                              {alerta.veiculo && (
                                <span>Veículo: {alerta.veiculo}</span>
                              )}

                              {alerta.motorista && (
                                <span>Motorista: {alerta.motorista}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={alerta.ativo ? "success" : "muted"}
                          className="w-fit shrink-0"
                        >
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

        {/* Configurações existentes */}
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
                <div key={setting.category}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium">
                        {setting.category}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>

                    <Switch
                      defaultChecked={setting.enabled}
                      aria-label={`Ativar alertas de ${setting.category}`}
                    />
                  </div>

                  {index < alertSettings.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
