import { Users, Plus, Search, Phone, Mail, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Drivers() {
  const drivers = [
    {
      id: 1,
      name: "João Silva",
      email: "joao.silva@empresa.com",
      phone: "(11) 98765-4321",
      license: "Categoria D",
      status: "Ativo",
      vehicle: "Caminhão ABC-1234",
      location: "São Paulo, SP",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@empresa.com",
      phone: "(11) 99876-5432",
      license: "Categoria E",
      status: "Ativo",
      vehicle: "Van DEF-5678",
      location: "Rio de Janeiro, RJ",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Carlos Oliveira",
      email: "carlos.oliveira@empresa.com",
      phone: "(11) 97654-3210",
      license: "Categoria D",
      status: "Inativo",
      vehicle: "Não designado",
      location: "Belo Horizonte, MG",
      avatar: "/placeholder.svg"
    }
  ];

  const getStatusBadge = (status: string) => {
    return status === "Ativo" 
      ? <Badge className="bg-success/10 text-success border-success">Ativo</Badge>
      : <Badge variant="secondary">Inativo</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
          <p className="text-muted-foreground">Gerencie os motoristas da sua frota</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Novo Motorista
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar motoristas..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-elegant transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={driver.avatar} alt={driver.name} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{driver.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{driver.license}</p>
                </div>
                {getStatusBadge(driver.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{driver.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{driver.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{driver.location}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium">Veículo Atual:</p>
                <p className="text-sm text-muted-foreground">{driver.vehicle}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}