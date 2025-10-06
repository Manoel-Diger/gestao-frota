import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, User, Wrench, Fuel, Clock, ClipboardCheck } from "lucide-react";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useChecklists } from "@/hooks/useChecklists";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
};

interface RecentActivityProps {
  searchFilter?: string;
}

export function RecentActivity({ searchFilter = "" }: RecentActivityProps) {
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();
  const { checklists } = useChecklists();

  // Aplicar filtro de placa em todos os dados
  const filteredVeiculos = useMemo(() => {
    if (!searchFilter) return veiculos;
    return veiculos.filter(v => (v.placa || "").toLowerCase().includes(searchFilter));
  }, [veiculos, searchFilter]);

  const filteredAbastecimentos = useMemo(() => {
    if (!searchFilter) return abastecimentos;
    return abastecimentos.filter(a => (a.veiculo_placa || "").toLowerCase().includes(searchFilter));
  }, [abastecimentos, searchFilter]);

  const filteredManutencoes = useMemo(() => {
    if (!searchFilter) return manutencoes;
    return manutencoes.filter(m => (m.veiculo_placa || "").toLowerCase().includes(searchFilter));
  }, [manutencoes, searchFilter]);

  const filteredChecklists = useMemo(() => {
    if (!searchFilter) return checklists;
    return checklists.filter(c => (c.placa_veiculo || "").toLowerCase().includes(searchFilter));
  }, [checklists, searchFilter]);

  const filteredMotoristas = useMemo(() => {
    if (!searchFilter) return motoristas;
    return motoristas.filter(m => (m.placa || "").toLowerCase().includes(searchFilter));
  }, [motoristas, searchFilter]);

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

    // Manutenções recentes (filtradas)
    filteredManutencoes.slice(0, 3).forEach((m) => {
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

    // Abastecimentos recentes (filtrados)
    filteredAbastecimentos.slice(0, 3).forEach((a) => {
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

    // Motoristas recentes (filtrados)
    filteredMotoristas.slice(0, 2).forEach((m) => {
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

    // Veículos recentes (filtrados)
    filteredVeiculos.slice(0, 2).forEach((v) => {
      allActivities.push({
        id: `veiculo-${v.id}`,
        type: "vehicle",
        icon: Car,
        title: "Veículo cadastrado",
        description: `${v.marca} ${v.modelo} - ${v.placa}`,
        time: formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: ptBR }),
        status: v.status?.toLowerCase() === 'ativo' ? 'success' : 'warning',
        timestamp: new Date(v.created_at),
      });
    });

    // Checklists recentes (filtrados)
    filteredChecklists.slice(0, 3).forEach((c) => {
      const status = c.status_final?.toLowerCase() === 'aprovado' ? 'success' : 
                     c.total_nao_conformidades > 0 ? 'warning' : 'info';
      allActivities.push({
        id: `checklist-${c.id}`,
        type: "checklist",
        icon: ClipboardCheck,
        title: "Checklist realizado",
        description: `${c.tipo_checklist} - ${c.placa_veiculo}`,
        time: formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR }),
        status,
        timestamp: new Date(c.created_at),
      });
    });

    // Ordenar por timestamp (mais recentes primeiro) e pegar os 8 mais recentes
    return allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }, [filteredVeiculos, filteredMotoristas, filteredManutencoes, filteredAbastecimentos, filteredChecklists]);

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
            {searchFilter ? "Nenhuma atividade encontrada para esta placa" : "Nenhuma atividade registrada"}
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