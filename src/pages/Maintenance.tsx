import { useState, useMemo, useEffect } from "react";
import { Wrench, DollarSign, TrendingUp, Calendar, Search, Eye, Pencil, Trash2, CheckCircle } from "lucide-react";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
import { MaintenanceEditDialog } from "@/components/maintenance/MaintenanceEditDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManutencoes, Manutencao } from "@/hooks/useManutencoes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Maintenance() {
  const { manutencoes, loading, error, refetch, deleteManutencao } = useManutencoes();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editManutencao, setEditManutencao] = useState<Manutencao | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Mapa placa -> motorista (do veículo)
  const [motoristaMap, setMotoristaMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchVeiculos = async () => {
      const { data } = await (supabase as any)
        .from('Veiculos')
        .select('placa, motorista');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((v: any) => {
          if (v.placa) map[v.placa] = v.motorista || 'Não definido';
        });
        setMotoristaMap(map);
      }
    };
    fetchVeiculos();
  }, [manutencoes]);

  // Filtragem com useMemo
  const filteredManutencoes = useMemo(() => {
    if (!manutencoes) return [];
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return manutencoes;
    return manutencoes.filter((manutencao) => {
      const placaVeiculo = manutencao.veiculo_placa?.toLowerCase() || "";
      const data = manutencao.data
        ? new Date(manutencao.data).toLocaleDateString("pt-BR")
        : "";
      const tipo = manutencao.tipo_manutencao?.toLowerCase() || "";
      const motorista = (motoristaMap[manutencao.veiculo_placa || ""] || "").toLowerCase();
      return placaVeiculo.includes(lowerCaseSearch) || 
             data.includes(lowerCaseSearch) || 
             tipo.includes(lowerCaseSearch) ||
             motorista.includes(lowerCaseSearch);
    });
  }, [manutencoes, searchTerm, motoristaMap]);

  // Funções helper para normalização de status
  const normalizeStatus = (status: string | null) =>
    (status || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const statusKey = (status: string | null) => {
    const s = normalizeStatus(status);
    if (s.includes("agendada") || s.includes("a fazer")) return "agendada";
    if (s.includes("concluida") || s.includes("finalizada")) return "concluida";
    if (s.includes("cancelada")) return "cancelada";
    return "outro";
  };

  // Cálculos dinâmicos por filtro
  const stats = useMemo(() => {
    const filtered = searchTerm ? filteredManutencoes : manutencoes;
    const totalCusto = filtered.reduce((sum, man) => sum + (Number(man.custo) || 0), 0);
    const totalManutencoes = filtered.length;
    const custoMedio = totalManutencoes > 0 ? totalCusto / totalManutencoes : 0;

    const agendadas = filtered.filter((m) => statusKey((m as any).status) === 'agendada').length;
    const concluidas = filtered.filter((m) => statusKey((m as any).status) === 'concluida').length;

    return {
      totalCusto,
      custoMedio,
      totalManutencoes,
      agendadas,
      concluidas,
    };
  }, [manutencoes, filteredManutencoes, searchTerm]);

  const getStatusVariant = (status: string | null) => {
    switch (statusKey(status)) {
      case "concluida":
        return "default";
      case "cancelada":
        return "destructive";
      case "agendada":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleEdit = (manutencao: Manutencao) => {
    setEditManutencao(manutencao);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta manutenção?")) {
      const success = await deleteManutencao(id);
      if (success) {
        toast({
          title: "Sucesso!",
          description: "Manutenção excluída com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao excluir a manutenção.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manutenções</h1>
          <p className="text-muted-foreground">Controle de manutenção da sua frota</p>
        </div>
        <MaintenanceForm onSuccess={refetch} />
      </div>

      {/* Stats Cards - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.totalCusto.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Filtrado' : 'Custo acumulado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.custoMedio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Filtrado' : 'Por manutenção'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Manutenções</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalManutencoes}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Filtrado' : 'Total registrado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendadas}</div>
            <p className="text-xs text-muted-foreground">
              Manutenções agendadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluidas}</div>
            <p className="text-xs text-muted-foreground">
              Manutenções concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela com Pesquisa */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por placa, data, tipo ou motorista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <Wrench className="h-6 w-6 mb-2" />
              <p>Erro ao carregar manutenções. Verifique sua conexão.</p>
              <Button variant="link" onClick={refetch}>Tentar Novamente</Button>
            </div>
          ) : filteredManutencoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-8 w-8 mx-auto mb-2" />
              <p>
                {searchTerm
                  ? "Nenhuma manutenção encontrada para sua pesquisa."
                  : "Nenhuma manutenção encontrada."}
              </p>
              {!searchTerm && <p className="text-sm mt-2">Clique em 'Nova Manutenção' para começar.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManutencoes.map((manutencao) => {
                    const custo = Number(manutencao.custo) || 0;
                    const motorista = motoristaMap[manutencao.veiculo_placa || ""] || "N/A";
                    
                    return (
                      <TableRow key={manutencao.id.toString()}>
                        <TableCell className="font-medium">
                          {manutencao.veiculo_placa || "N/A"}
                        </TableCell>
                        <TableCell>
                          {motorista}
                        </TableCell>
                        <TableCell>
                          {manutencao.tipo_manutencao || "N/A"}
                        </TableCell>
                        <TableCell>
                          {manutencao.data
                            ? new Date(manutencao.data + 'T12:00:00').toLocaleDateString("pt-BR", {
                                timeZone: "America/Sao_Paulo",
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant((manutencao as any).status)}>
                            {(manutencao as any).status || 'Agendada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {custo.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(manutencao)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(manutencao.id)}
                              title="Excluir"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MaintenanceEditDialog
        manutencao={editManutencao}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}