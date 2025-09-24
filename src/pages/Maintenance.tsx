import { Wrench, Calendar, Car, AlertTriangle, CheckCircle } from "lucide-react";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useManutencoes } from "@/hooks/useManutencoes";

export default function Maintenance() {
  const { manutencoes, loading, error } = useManutencoes();

  const getStatusBadge = (data: string | null) => {
    if (!data) return <Badge variant="secondary">Sem data</Badge>;
    
    const today = new Date();
    const manutencaoDate = new Date(data);
    
    if (manutencaoDate < today) {
      return <Badge variant="destructive">Vencida</Badge>;
    } else if (manutencaoDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return <Badge className="bg-warning/10 text-warning border-warning">Próxima</Badge>;
    } else {
      return <Badge className="bg-success/10 text-success border-success">Agendada</Badge>;
    }
  };

  const totalManutencoes = manutencoes.length;
  const manutencoesConcluidas = manutencoes.filter(m => m.data && new Date(m.data) < new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manutenções</h1>
          <p className="text-muted-foreground">Gerencie as manutenções da sua frota</p>
        </div>
        <MaintenanceForm onSuccess={() => window.location.reload()} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Manutenções"
          value={totalManutencoes.toString()}
          icon={<Wrench className="h-4 w-4" />}
          trend={{ value: "0%", isPositive: false }}
        />
        <StatsCard
          title="Concluídas"
          value={manutencoesConcluidas.toString()}
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{ value: "2.1%", isPositive: true }}
        />
        <StatsCard
          title="Pendentes"
          value={(totalManutencoes - manutencoesConcluidas).toString()}
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: "1.5%", isPositive: false }}
        />
        <StatsCard
          title="Custo Médio"
          value="R$ 350"
          icon={<AlertTriangle className="h-4 w-4" />}
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
            {loading ? (
              <div className="text-center py-8">Carregando manutenções...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">Erro: {error}</div>
            ) : manutencoes.length === 0 ? (
              <div className="text-center py-8">Nenhuma manutenção encontrada</div>
            ) : (
              manutencoes.map((manutencao) => (
                <div key={manutencao.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{manutencao.veiculo_placa || 'Veículo não informado'}</h3>
                      <p className="text-sm text-muted-foreground">{manutencao.tipo_manutencao || 'Tipo não informado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">Data</p>
                      <p className="text-sm text-muted-foreground">
                        {manutencao.data ? new Date(manutencao.data).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium">Custo</p>
                      <p className="text-sm text-muted-foreground">
                        {manutencao.custo ? `R$ ${manutencao.custo.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium">Descrição</p>
                      <p className="text-sm text-muted-foreground">
                        {manutencao.descricao || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(manutencao.data)}
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}