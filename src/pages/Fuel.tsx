import { Fuel, Plus, TrendingDown, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default function FuelPage() {
  const fuelRecords = [
    {
      id: 1,
      vehicle: "Caminhão ABC-1234",
      date: "2024-01-20",
      liters: 80,
      cost: "R$ 480,00",
      pricePerLiter: "R$ 6,00",
      odometer: 15420,
      efficiency: "12.5 km/L",
      station: "Posto Shell - Centro"
    },
    {
      id: 2,
      vehicle: "Van DEF-5678",
      date: "2024-01-19",
      liters: 45,
      cost: "R$ 270,00",
      pricePerLiter: "R$ 6,00",
      odometer: 8750,
      efficiency: "14.2 km/L",
      station: "Posto BR - Vila Madalena"
    },
    {
      id: 3,
      vehicle: "Truck GHI-9012",
      date: "2024-01-18",
      liters: 120,
      cost: "R$ 720,00",
      pricePerLiter: "R$ 6,00",
      odometer: 32100,
      efficiency: "8.5 km/L",
      station: "Posto Ipiranga - Rodovia"
    }
  ];

  const getEfficiencyBadge = (efficiency: string) => {
    const value = parseFloat(efficiency.split(' ')[0]);
    if (value >= 12) {
      return <Badge className="bg-success/10 text-success border-success">Excelente</Badge>;
    } else if (value >= 10) {
      return <Badge className="bg-warning/10 text-warning border-warning">Bom</Badge>;
    } else {
      return <Badge variant="destructive">Baixo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Abastecimentos</h1>
          <p className="text-muted-foreground">Controle de combustível da sua frota</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Novo Abastecimento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Gasto Mensal"
          value="R$ 3.250"
          icon={<DollarSign className="h-4 w-4" />}
          trend={{ value: "5.2%", isPositive: false }}
        />
        <StatsCard
          title="Litros Consumidos"
          value="541L"
          icon={<Fuel className="h-4 w-4" />}
          trend={{ value: "3.1%", isPositive: false }}
        />
        <StatsCard
          title="Eficiência Média"
          value="11.8 km/L"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: "2.5%", isPositive: true }}
        />
        <StatsCard
          title="Preço Médio"
          value="R$ 6,01"
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
            {fuelRecords.map((record) => (
              <div key={record.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{record.vehicle}</h3>
                      <p className="text-sm text-muted-foreground">{record.station}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                    <div className="text-center lg:text-left">
                      <p className="text-sm font-medium">Data</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="text-center lg:text-left">
                      <p className="text-sm font-medium">Litros</p>
                      <p className="text-sm text-muted-foreground">{record.liters}L</p>
                    </div>
                    
                    <div className="text-center lg:text-left">
                      <p className="text-sm font-medium">Valor Total</p>
                      <p className="text-sm text-muted-foreground">{record.cost}</p>
                    </div>
                    
                    <div className="text-center lg:text-left">
                      <p className="text-sm font-medium">Eficiência</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{record.efficiency}</p>
                        {getEfficiencyBadge(record.efficiency)}
                      </div>
                    </div>
                    
                    <div className="col-span-2 lg:col-span-1 flex justify-center lg:justify-end">
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </div>
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