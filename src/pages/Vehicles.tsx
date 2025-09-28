import { useState } from "react";
import { Plus, Search, Filter, Car, Fuel, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVeiculos } from "@/hooks/useVeiculos";
import { VehicleForm } from "@/components/vehicles/VehicleForm";

const statusColors = {
  "Ativo": "bg-success text-success-foreground",
  "Manutenção": "bg-warning text-warning-foreground",
  "Inativo": "bg-muted text-muted-foreground",
  "Em uso": "bg-primary text-primary-foreground",
  "Disponível": "bg-success text-success-foreground",
};

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const { veiculos, loading, error, refreshVeiculos } = useVeiculos();

  const filteredVehicles = veiculos.filter(veiculo =>
    (veiculo.placa?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (veiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (veiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (veiculo.motorista?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const totalVeiculos = veiculos.length;
  const veiculosAtivos = veiculos.filter(v => v.status === "Ativo" || v.status === "Em uso").length;
  const veiculosManutencao = veiculos.filter(v => v.status === "Manutenção").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
          <p className="text-muted-foreground">Gerencie todos os veículos da frota</p>
        </div>
        <VehicleForm onSuccess={refreshVeiculos} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalVeiculos}</p>
              </div>
              <Car className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-success">{veiculosAtivos}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                <Car className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold text-warning">{veiculosManutencao}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
                <Car className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consumo Médio</p>
                <p className="text-2xl font-bold">12.5L/100km</p>
              </div>
              <Fuel className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por placa, modelo ou motorista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>

        <div className="w-full overflow-x-auto">
          <Card className="overflow-visible">
            <CardContent className="p-4">
              <div className="min-w-[760px]">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Combustível</TableHead>
                      <TableHead>Próxima Manutenção</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Carregando veículos...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-destructive">
                          Erro: {error}
                        </TableCell>
                      </TableRow>
                    ) : filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Nenhum veículo encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map((veiculo) => (
                        <TableRow key={veiculo.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{veiculo.placa || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                {veiculo.marca} {veiculo.modelo} - {veiculo.ano}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[veiculo.status as keyof typeof statusColors] || "bg-muted text-muted-foreground"}>
                              {veiculo.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{veiculo.motorista || 'Não definido'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${(veiculo.combustivel_atual || 0) > 50 ? 'bg-success' : (veiculo.combustivel_atual || 0) > 25 ? 'bg-warning' : 'bg-destructive'}`}
                                  style={{ width: `${veiculo.combustivel_atual || 0}%` }}
                                />
                              </div>
                              <span className="text-sm">{veiculo.combustivel_atual || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {veiculo.proxima_manutencao ? new Date(veiculo.proxima_manutencao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {veiculo.localizacao || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}