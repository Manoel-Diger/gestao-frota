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

const vehicles = [
  {
    id: 1,
    plate: "ABC-1234",
    model: "Mercedes-Benz Actros",
    type: "Caminhão",
    year: 2022,
    status: "Ativo",
    driver: "João Silva",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-04-15",
    fuel: 85,
    location: "São Paulo - SP",
  },
  {
    id: 2,
    plate: "DEF-5678",
    model: "Volkswagen Delivery",
    type: "Van",
    year: 2021,
    status: "Manutenção",
    driver: "Maria Santos",
    lastMaintenance: "2024-02-10",
    nextMaintenance: "2024-05-10",
    fuel: 15,
    location: "Rio de Janeiro - RJ",
  },
  {
    id: 3,
    plate: "GHI-9012",
    model: "Ford Transit",
    type: "Furgão",
    year: 2023,
    status: "Ativo",
    driver: "Carlos Oliveira",
    lastMaintenance: "2024-01-20",
    nextMaintenance: "2024-04-20",
    fuel: 67,
    location: "Belo Horizonte - MG",
  },
];

const statusColors = {
  Ativo: "bg-success text-success-foreground",
  Manutenção: "bg-warning text-warning-foreground",
  Inativo: "bg-muted text-muted-foreground",
};

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
          <p className="text-muted-foreground">Gerencie todos os veículos da frota</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Veículo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">24</p>
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
                <p className="text-2xl font-bold text-success">21</p>
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
                <p className="text-2xl font-bold text-warning">3</p>
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
        <CardContent>
          <div className="rounded-md border">
            <Table>
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
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vehicle.plate}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.model} - {vehicle.year}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[vehicle.status as keyof typeof statusColors]}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{vehicle.driver}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${vehicle.fuel > 50 ? 'bg-success' : vehicle.fuel > 25 ? 'bg-warning' : 'bg-destructive'}`}
                            style={{ width: `${vehicle.fuel}%` }}
                          />
                        </div>
                        <span className="text-sm">{vehicle.fuel}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(vehicle.nextMaintenance).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {vehicle.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}