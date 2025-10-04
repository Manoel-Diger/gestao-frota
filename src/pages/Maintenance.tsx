import { useState, useMemo } from "react";
import { Wrench, DollarSign, TrendingUp, Calendar, Search, Eye, Pencil, Trash2, CheckCircle } from "lucide-react";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
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
import { useManutencoes } from "@/hooks/useManutencoes";
import { Tables } from "@/integrations/supabase/types";

type Manutencao = Tables<'Manutencoes'>;

export default function Maintenance() {
  const { manutencoes, loading, error, refetch, deleteManutencao } = useManutencoes();
  const [searchTerm, setSearchTerm] = useState("");
  
  // BUG #2 CORRIGIDO: Estados para controlar edição
  const [editingManutencao, setEditingManutencao] = useState<Manutencao | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      return placaVeiculo.includes(lowerCaseSearch) || 
             data.includes(lowerCaseSearch) || 
             tipo.includes(lowerCaseSearch);
    });
  }, [manutencoes, searchTerm]);

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

  // BUG #1 CORRIGIDO: Cálculos sempre sobre filteredManutencoes
  const stats = useMemo(() => {
    // SEMPRE usar filteredManutencoes, que já contém a lista correta (completa ou filtrada)
    const totalCusto = filteredManutencoes.reduce((sum, man) => {
      const custo = typeof man.custo === 'number' ? man.custo : parseFloat(String(man.custo || 0));
      return sum + custo;
    }, 0);
    
    const totalManutencoes = filteredManutencoes.length;
    const custoMedio = totalManutencoes > 0 ? totalCusto / totalManutencoes : 0;

    // Contar status sobre a lista filtrada
    const agendadas = filteredManutencoes.filter((m) => 
      statusKey((m as any).status) === 'agendada'
    ).length;
    
    const concluidas = filteredManutencoes.filter((m) => 
      statusKey((m as any).status) === 'concluida'
    ).length;

    return {
      totalCusto,
      custoMedio,
      totalManutencoes,
      agendadas,
      concluidas,
    };
  }, [filteredManutencoes]); // Dependência ÚNICA: filteredManutencoes

  // Badges com cores usando classes do Tailwind existentes
  const getStatusBadge = (status: string | null) => {
    const key = statusKey(status);
    const displayText = status || 'Agendada';
    
    switch (key) {
      case "concluida":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
            {displayText}
          </Badge>
        );
      case "cancelada":
        return <Badge variant="destructive">{displayText}</Badge>;
      case "agendada":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
            {displayText}
          </Badge>
        );
      default:
        return <Badge variant="outline">{displayText}</Badge>;
    }
  };

  const handleView = (id: number) => {
    const manutencao = manutencoes.find(m => m.id === id);
    if (manutencao) {
      console.log("📋 Visualizar manutenção:", manutencao);
      // TODO: Implementar modal de visualização (read-only)
      alert(`Visualização:\n\nPlaca: ${manutencao.veiculo_placa}\nTipo: ${manutencao.tipo_manutencao}\nCusto: R$ ${typeof manutencao.custo === 'number' ? manutencao.custo.toFixed(2) : '0.00'}`);
    }
  };

  // BUG #2 CORRIGIDO: Implementar edição real
  const handleEdit = (id: number) => {
    const manutencao = manutencoes.find(m => m.id === id);
    if (manutencao) {
      console.log("✏️ Editar manutenção:", manutencao);
      setEditingManutencao(manutencao);
      setIsEditDialogOpen(true);
    }
  };

  // BUG #2 CORRIGIDO: Implementar exclusão real
  const handleDelete = async (id: number) => {
    const manutencao = manutencoes.find(m => m.id === id);
    if (!manutencao) return;

    const confirmMsg = `Tem certeza que deseja excluir esta manutenção?\n\nPlaca: ${manutencao.veiculo_placa}\nTipo: ${manutencao.tipo_manutencao}`;
    
    if (confirm(confirmMsg)) {
      console.log("🗑️ Excluindo manutenção:", id);
      const success = await deleteManutencao(id);
      if (success) {
        console.log("✅ Manutenção excluída com sucesso");
      } else {
        console.error("🔴 Erro ao excluir manutenção");
        alert("Erro ao excluir manutenção. Verifique as permissões.");
      }
    }
  };

  const handleEditSuccess = async () => {
    await refetch();
    setIsEditDialogOpen(false);
    setEditingManutencao(null);
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

      {/* Dialog de Edição Separado */}
      {editingManutencao && (
        <MaintenanceForm
          initialData={editingManutencao}
          mode="edit"
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingManutencao(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Stats Cards - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              R$ {stats.custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                placeholder="Buscar por placa, data ou tipo..."
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManutencoes.map((manutencao) => {
                    const custo = typeof manutencao.custo === 'number' 
                      ? manutencao.custo 
                      : parseFloat(String(manutencao.custo || 0));
                    
                    return (
                      <TableRow key={manutencao.id.toString()}>
                        <TableCell className="font-medium">
                          {manutencao.veiculo_placa || "N/A"}
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
                          {getStatusBadge((manutencao as any).status)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(manutencao.id)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(manutencao.id)}
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
    </div>
  );
}