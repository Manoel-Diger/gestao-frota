import { useState } from "react";
import { Plus, Search, Filter, Car, Fuel, Calendar, MapPin, Eye, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVeiculos, Veiculo } from "@/hooks/useVeiculos";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import VehicleViewDialog from "@/components/vehicles/VehicleViewDialog";
import { VehicleEditDialog } from "@/components/vehicles/VehicleEditDialog";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [viewVeiculo, setViewVeiculo] = useState<Veiculo | null>(null);
  const [editVeiculo, setEditVeiculo] = useState<Veiculo | null>(null);
  const [detailsVeiculo, setDetailsVeiculo] = useState<Veiculo | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteVeiculo, setDeleteVeiculo] = useState<Veiculo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredVehicles = veiculos.filter(veiculo =>
    (veiculo.placa?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (veiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (veiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const totalVeiculos = veiculos.length;
  const veiculosAtivos = veiculos.filter(v => v.status === "Ativo" || v.status === "Em uso").length;
  const veiculosManutencao = veiculos.filter(v => v.status === "Manutenção").length;

  const handleView = (veiculo: Veiculo) => {
    setViewVeiculo(veiculo);
    setViewDialogOpen(true);
  };

  const handleEdit = (veiculo: Veiculo) => {
    setEditVeiculo(veiculo);
    setEditDialogOpen(true);
  };

  const handleDetails = (veiculo: Veiculo) => {
    setDetailsVeiculo(veiculo);
    setDetailsDialogOpen(true);
  };

  const handleDeleteClick = (veiculo: Veiculo) => {
    setDeleteVeiculo(veiculo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteVeiculo) return;
    setDeleting(true);
    try {
      // Check for linked checklists
      const { count: checklistCount } = await (supabase as any)
        .from('checklists')
        .select('id', { count: 'exact', head: true })
        .eq('placa_veiculo', deleteVeiculo.placa);

      // Check for linked manutenções
      const { count: manutencaoCount } = await (supabase as any)
        .from('Manutencoes')
        .select('id', { count: 'exact', head: true })
        .eq('veiculo_placa', deleteVeiculo.placa);

      const hasHistory = (checklistCount || 0) > 0 || (manutencaoCount || 0) > 0;

      if (hasHistory) {
        // Archive instead of delete
        const { error } = await (supabase as any)
          .from('Veiculos')
          .update({ status: 'Inativo' })
          .eq('id', deleteVeiculo.id);
        if (error) throw error;
        toast({
          title: "Veículo arquivado",
          description: `${deleteVeiculo.placa} possui histórico vinculado e foi marcado como Inativo.`,
        });
      } else {
        // Safe to permanently delete
        const { error } = await (supabase as any)
          .from('Veiculos')
          .delete()
          .eq('id', deleteVeiculo.id);
        if (error) throw error;
        toast({
          title: "Veículo excluído",
          description: `${deleteVeiculo.placa} foi removido permanentemente.`,
        });
      }
      await refreshVeiculos();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao processar exclusão",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteVeiculo(null);
    }
  };

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
                      <TableCell>
                        {(veiculo as any).motorista || (veiculo as any).Motoristas?.nome || "Não definido"}
                      </TableCell>
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
                          {veiculo.proxima_manutencao ? new Date(veiculo.proxima_manutencao).toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {veiculo.localizacao || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(veiculo)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(veiculo)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDetails(veiculo)}
                            title="Detalhes"
                          >
                            Detalhes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(veiculo)}
                            title="Excluir"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <VehicleViewDialog
        veiculo={viewVeiculo}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <VehicleViewDialog
        veiculo={detailsVeiculo}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <VehicleEditDialog
        veiculo={editVeiculo}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refreshVeiculos}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Veículo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o veículo <strong>{deleteVeiculo?.placa}</strong> ({deleteVeiculo?.marca} {deleteVeiculo?.modelo})?
              <br /><br />
              Se houver checklists ou manutenções vinculadas, o veículo será arquivado (status "Inativo") para preservar o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Processando..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}