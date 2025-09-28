import { useState } from "react";
import { Users, Search, Phone, Mail } from "lucide-react";
import { DriverForm } from "../components/drivers/DriverForm";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { useMotoristas } from "../hooks/useMotoristas";

// Definição da Interface (Tipo) para o objeto Motorista
interface MotoristaData {
  id: number;
  categoria_cnh: "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE";
  cnh_numero: string;
  cnh_validade: string;
  created_at: string;
  email: string;
  nome: string;
  status: "Ativo" | "Inativo";
  telefone: string;
  placa?: string | null;
}

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editMotorista, setEditMotorista] = useState<MotoristaData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Controle do diálogo no pai
  
  const { motoristas, loading, error } = useMotoristas();

  const filteredDrivers = (motoristas as MotoristaData[]).filter((motorista) => {
    const nomeMatch = motorista.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = motorista.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return nomeMatch || emailMatch;
  });

  const getStatusBadge = (status: string | null) => {
    return status === "Ativo" 
      ? <Badge className="bg-success/10 text-success border-success">Ativo</Badge>
      : <Badge variant="secondary">{status || "Inativo"}</Badge>;
  };

  const handleEdit = (motorista: MotoristaData) => {
    setEditMotorista(motorista);
    setIsDialogOpen(true); // Abre o diálogo ao selecionar um motorista
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
          <p className="text-muted-foreground">Gerencie os motoristas da sua frota</p>
        </div>
        <DriverForm 
          onSuccess={() => {
            setEditMotorista(null);
            setIsDialogOpen(false); // Fecha o diálogo após sucesso
            window.location.reload();
          }} 
          motorista={editMotorista} 
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar motoristas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        {loading ? (
          <div className="col-span-full text-center py-8">
            Carregando motoristas...
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-8 text-destructive">
            Erro: {error}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            Nenhum motorista encontrado
          </div>
        ) : (
          filteredDrivers.map((motorista) => (
            <Card key={motorista.id} className="hover:shadow-elegant transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" alt={motorista.nome || ''} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {motorista.nome?.split(' ').map(n => n[0]).join('') || 'N/A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{motorista.nome || 'Nome não informado'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{motorista.categoria_cnh || 'CNH não informada'}</p>
                  </div>
                  {getStatusBadge(motorista.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{motorista.email || 'Email não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{motorista.telefone || 'Telefone não informado'}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">Veículo Atual:</p>
                  <p className="text-sm text-muted-foreground">{motorista.placa || 'Não designado'}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(motorista)}>
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}