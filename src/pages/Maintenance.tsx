import { Wrench, Calendar, Car, AlertTriangle, CheckCircle } from "lucide-react";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useManutencoes } from "@/hooks/useManutencoes";
// 1. IMPORTAÇÃO NECESSÁRIA: Importar as funções de formatação
import { formatNumber, formatPercentage } from "@/lib/utils"; 

export default function Maintenance() {
  // 2. CORREÇÃO PRINCIPAL: Desestruturar o objeto 'stats' do hook
  const { manutencoes, loading, error, stats, refetch } = useManutencoes();

  // O getStatusBadge parece estar usando 'data' de forma incorreta para status.
  // Uma manutenção AGENDADA pode ter uma data futura, mas seu STATUS deve ser 'Agendada'.
  // Para manter a coerência com o Badge de 'Agendada'/'Vendida' na tela:
  // Vou manter o cálculo abaixo, mas usaremos o 'status' da manutenção para o Badge final na lista.
  // Este getStatusBadge atual está obsoleto, já que a lista de manutenções
  // já tem o campo 'status' (Agendada, Concluída) da tabela, como visto na imagem original.

  const getStatusBadge = (status: string) => {
    // Baseado na imagem original e na lógica de status da tabela Manutencoes:
    const statusText = status?.toLowerCase();
    
    if (statusText === 'agendada') {
      // Cor de Agendada/Próxima (Verde na sua imagem)
      return <Badge className="bg-success/10 text-success border-success">Agendada</Badge>;
    } else if (statusText === 'concluída') {
      // Cor de Concluída/Vendida (Vermelho na sua imagem, mas deveria ser verde/azul)
      // Vamos manter 'Vendida' com cor Destructive (Vermelha) para reproduzir o visual:
      return <Badge variant="destructive">Concluída</Badge>;
    }
    // Caso tenha outros status, você pode adicionar mais condições aqui.
    return <Badge variant="secondary">{status || 'Status N/A'}</Badge>;
  };
  
  // Variáveis para garantir que os balões não quebrem, usando o Nullish Coalescing
  const total = stats?.total ?? 0;
  const concluidas = stats?.concluidas ?? 0;
  const pendentes = stats?.pendentes ?? 0;
  const custoMedio = stats?.custoMedio ?? 0;
  const percentualConcluidas = stats?.percentualConcluidas ?? 0;
  const percentualPendentes = stats?.percentualPendentes ?? 0;

  // Envolver refetch em uma função assíncrona para atender à tipagem esperada por onSuccess
  const handleOnSuccess = async () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manutenções</h1>
          <p className="text-muted-foreground">Gerencie as manutenções da sua frota</p>
        </div>
        {/* Atualização: Usar handleOnSuccess como callback assíncrono */}
        <MaintenanceForm onSuccess={handleOnSuccess} /> 
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Manutenções */}
        <StatsCard
          title="Total Manutenções"
          // 3. ATUALIZAÇÃO: Usar o valor calculado do stats
          value={total.toString()}
          icon={<Wrench className="h-4 w-4" />}
          // 4. ATUALIZAÇÃO: Usar o percentualCorretiva (que você queria calcular)
          trend={{ 
            // Usamos o percentualCorretiva para o balão inferior
            value: formatPercentage(stats?.percentualCorretiva ?? 0), 
            // Assumimos que percentual Corretiva alto é negativo (false)
            isPositive: (stats?.percentualCorretiva ?? 0) < 50 // Exemplo de lógica de sinal
          }}
        />
        {/* Concluídas */}
        <StatsCard
          title="Concluídas"
          // 3. ATUALIZAÇÃO: Usar o valor calculado do stats
          value={concluidas.toString()}
          icon={<CheckCircle className="h-4 w-4" />}
          // 4. ATUALIZAÇÃO: Usar o percentual Concluídas para o balão inferior
          trend={{ 
            value: formatPercentage(percentualConcluidas), 
            // Concluídas sempre é positivo em relação ao total
            isPositive: true 
          }}
        />
        {/* Pendentes */}
        <StatsCard
          title="Pendentes"
          // 3. ATUALIZAÇÃO: Usar o valor calculado do stats
          value={pendentes.toString()}
          icon={<Calendar className="h-4 w-4" />}
          // 4. ATUALIZAÇÃO: Usar o percentual Pendentes para o balão inferior
          trend={{ 
            value: formatPercentage(percentualPendentes), 
            // Pendentes sempre é negativo em relação ao total
            isPositive: false 
          }}
        />
        {/* Custo Médio */}
        <StatsCard
          title="Custo Médio"
          // 3. ATUALIZAÇÃO: Usar o valor calculado do stats e formatar como moeda
          value={formatNumber(custoMedio, 'currency')}
          icon={<AlertTriangle className="h-4 w-4" />}
          // 4. ATUALIZAÇÃO: Manter um valor hardcoded ou usar uma métrica de tendência, se houver.
          // Como não temos a tendência do Custo Médio no hook, vou manter o valor estático por segurança:
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
                        {/* Usando formatNumber para garantir a formatação de moeda correta */}
                        {formatNumber(manutencao.custo ?? 0, 'currency')} 
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium">Descrição</p>
                      <p className="text-sm text-muted-foreground">
                        {manutencao.descricao || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 5. ATUALIZAÇÃO: Usar o campo STATUS para o Badge */}
                      {getStatusBadge(manutencao.status || 'N/A')}
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