import { Fuel, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { FuelForm } from "@/components/fuel/FuelForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";

export default function FuelPage() {
  const { abastecimentos, loading, error } = useAbastecimentos();

  const totalGasto = abastecimentos.reduce((sum, ab) => sum + (ab.custo_total || 0), 0);
  const totalLitros = abastecimentos.reduce((sum, ab) => sum + (ab.litros || 0), 0);
  const precoMedio = totalLitros > 0 ? totalGasto / totalLitros : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Abastecimentos</h1>
          <p className="text-muted-foreground">Controle de combustível da sua frota</p>
        </div>
        <FuelForm onSuccess={() => window.location.reload()} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Gasto Total"
          value={`R$ ${totalGasto.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{ value: "5.2%", isPositive: false }}
        />
        <StatsCard
          title="Litros Consumidos"
          value={`${totalLitros.toFixed(1)}L`}
          icon={<Fuel className="h-4 w-4" />}
          trend={{ value: "3.1%", isPositive: false }}
        />
        <StatsCard
          title="Total Abastecimentos"
          value={abastecimentos.length.toString()}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: "2.5%", isPositive: true }}
        />
        <StatsCard
          title="Preço Médio/Litro"
          value={`R$ ${precoMedio.toFixed(2)}`}
          icon={<TrendingDown className="h-4 w-4" />}
          trend={{ value: "1.2%", isPositive: false }}
        />
      </div>

      {/* Fuel Records */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Abastecimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Carregando abastecimentos...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">Erro: {error}</div>
            ) : abastecimentos.length === 0 ? (
              <div className="text-center py-8">Nenhum abastecimento encontrado</div>
            ) : (
              abastecimentos.map((abastecimento) => (
                <div key={abastecimento.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Fuel className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{abastecimento.veiculo_placa || 'Veículo não informado'}</h3>
                        <p className="text-sm text-muted-foreground">Abastecimento #{abastecimento.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      <div className="text-center lg:text-left">
                        <p className="text-sm font-medium">Data</p>
                        <p className="text-sm text-muted-foreground">
                          {abastecimento.data ? new Date(abastecimento.data).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="text-center lg:text-left">
                        <p className="text-sm font-medium">Litros</p>
                        <p className="text-sm text-muted-foreground">{abastecimento.litros || 0}L</p>
                      </div>
                      
                      <div className="text-center lg:text-left">
                        <p className="text-sm font-medium">Valor Total</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {(abastecimento.custo_total || 0).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="col-span-2 lg:col-span-1 flex justify-center lg:justify-end">
                        <Button variant="outline" size="sm">
                          Detalhes
                        </Button>
                      </div>
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