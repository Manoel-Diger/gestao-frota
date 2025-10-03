import { useState, useMemo } from "react";
import { Wrench, DollarSign, TrendingUp, Calendar, AlertTriangle, Search } from "lucide-react";
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

export default function Maintenance() {
  const { manutencoes, loading, error, refetch } = useManutencoes();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Cálculos dinâmicos por filtro
  const stats = useMemo(() => {
    const filtered = searchTerm ? filteredManutencoes : manutencoes;
    const totalCusto = filtered.reduce((sum, man) => sum + (Number(man.custo) || 0), 0);
    const totalManutencoes = filtered.length;
    const custoMedio = totalManutencoes > 0 ? totalCusto / totalManutencoes : 0;
    
    // Conta manutenções agendadas vs concluídas
    const agendadas = filtered.filter(m => m.status === 'Agendada').length;
    const concluidas = filtered.filter(m => m.status === 'Concluída').length;
    
    // Conta manutenções por tipo
    const preventivas = filtered.filter(m => 
      m.tipo_manutencao?.toLowerCase().includes('preventiva')
    ).length;

    return { 
      totalCusto, 
      custoMedio, 
      totalManutencoes, 
      agendadas,
      concluidas,
      preventivas 
    };
  }, [manutencoes, filteredManutencoes, searchTerm]);

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'Concluída':
        return 'default';
      case 'Em Andamento':
        return 'secondary';
      case 'Agendada':
        return 'outline';
      default:
        return 'outline';
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
              {stats.concluidas} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preventivas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.preventivas}</div>
            <p className="text-xs text-muted-foreground">
              Manutenções preventivas
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
              <AlertTriangle className="h-6 w-6 mb-2" />
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManutencoes.map((manutencao) => {
                    const custo = Number(manutencao.custo) || 0;
                    
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
                          <Badge variant={getStatusVariant(manutencao.status)}>
                            {manutencao.status || 'Agendada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {custo.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Detalhes
                          </Button>
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