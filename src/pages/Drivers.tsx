import { useState } from "react";
import { Users, Search, Phone, Mail, Trash2 } from "lucide-react";
import { DriverForm } from "@/components/drivers/DriverForm";
import { DriverEditDialog } from "@/components/drivers/DriverEditDialog";
import { DriverViewDialog } from "@/components/drivers/DriverViewDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMotoristas, Motorista } from "@/hooks/useMotoristas";
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
import { useToast } from "@/hooks/use-toast";

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState("");
  const { motoristas, loading, error, refreshMotoristas, deleteMotorista } = useMotoristas();
  const [selectedDriver, setSelectedDriver] = useState<Motorista | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Motorista | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteMotorista(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      toast({ title: "Motorista excluído", description: "Registro removido com sucesso." });
      setDeleteTarget(null);
      refreshMotoristas();
    } else {
      toast({
        title: "Não foi possível excluir",
        description: result.message || "Verifique vínculos com veículos ou abastecimentos.",
        variant: "destructive",
      });
    }
  };

  const filteredDrivers = motoristas.filter(motorista =>
    (motorista.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (motorista.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const getStatusBadge = (status: string | null) => {
    return status === "Ativo" 
      ? <Badge className="bg-success/10 text-success border-success">Ativo</Badge>
      : <Badge variant="secondary">{status || "Inativo"}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
          <p className="text-muted-foreground">Gerencie os motoristas da sua frota</p>
        </div>
        <DriverForm onSuccess={refreshMotoristas} />
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDriver(motorista);
                      setEditOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDriver(motorista);
                      setViewOpen(true);
                    }}
                  >
                    Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(motorista)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <DriverEditDialog
        motorista={selectedDriver}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={refreshMotoristas}
      />
      <DriverViewDialog
        motorista={selectedDriver}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este motorista? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}