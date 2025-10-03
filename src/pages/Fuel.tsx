import { useState, useMemo } from "react";
import { Fuel, TrendingDown, TrendingUp, DollarSign, Search, AlertTriangle } from "lucide-react";
import { FuelForm } from "@/components/fuel/FuelForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";

export default function FuelPage() {
  const { abastecimentos, loading, error, refetch } = useAbastecimentos();
  const [searchTerm, setSearchTerm] = useState("");

  // Filtragem com useMemo
  const filteredAbastecimentos = useMemo(() => {
    if (!abastecimentos) return [];
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearch) return abastecimentos;
    return abastecimentos.filter((abastecimento) => {
      const placaVeiculo = abastecimento.veiculo_placa?.toLowerCase() || "";
      const data = abastecimento.data
        ? new Date(abastecimento.data).toLocaleDateString("pt-BR")
        : "";
      return placaVeiculo.includes(lowerCaseSearch) || data.includes(lowerCaseSearch);
    });
  }, [abastecimentos, searchTerm]);

  // Cálculos dinâmicos por filtro
  const stats = useMemo(() => {
    const filtered = searchTerm ? filteredAbastecimentos : abastecimentos;
    const totalGasto = filtered.reduce((sum, ab) => sum + (Number(ab.custo_total) || 0), 0);
    const totalLitros = filtered.reduce((sum, ab) => sum + (Number(ab.litros) || 0), 0);
    const totalAbastecimentos = filtered.length;
    const precoMedioGeral = totalLitros > 0 ? totalGasto / totalLitros : 0;

    return { totalGasto, totalLitros, totalAbastecimentos, precoMedioGeral };
  }, [abastecimentos, filteredAbastecimentos, searchTerm]);

  return (
    <div className="container mx-auto py-6 space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abastecimentos</h1>
          <p className="text-muted-foreground">Controle de combustível da sua frota</p>
        </div>
        <FuelForm onSuccess={refetch} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalGasto.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Filtrado' : 'Gasto acumulado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Litros Consumidos</CardTitle>
            <Fuel className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLitros.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Filtrado' : 'Total consumido'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abastecimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAbastecimentos}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Filtrado' : 'Abastecimentos realizados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio/Litro</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.precoMedioGeral.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Filtrado' : 'Média geral por litro'}
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
                placeholder="Buscar por placa ou data..."
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
              <p>Erro ao carregar abastecimentos. Verifique sua conexão.</p>
              <Button variant="link" onClick={refetch}>Tentar Novamente</Button>
            </div>
          ) : filteredAbastecimentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Fuel className="h-8 w-8 mx-auto mb-2" />
              <p>
                {searchTerm
                  ? "Nenhum abastecimento encontrado para sua pesquisa."
                  : "Nenhum abastecimento encontrado."}
              </p>
              {!searchTerm && <p className="text-sm mt-2">Clique em 'Novo Abastecimento' para começar.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Litros</TableHead>
                    <TableHead className="text-right">Km</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">R$/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAbastecimentos.map((abastecimento) => {
                    const custoTotal = Number(abastecimento.custo_total) || 0;
                    const litros = Number(abastecimento.litros) || 0;
                    const precoLitro = litros > 0 ? custoTotal / litros : 0;
                    
                    return (
                      <TableRow key={abastecimento.id.toString()}>
                        <TableCell className="font-medium">
                          {abastecimento.veiculo_placa || "N/A"}
                        </TableCell>
                        <TableCell>
                          {abastecimento.data
                            ? new Date(abastecimento.data + 'T12:00:00').toLocaleDateString("pt-BR")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">{litros.toFixed(1)}L</TableCell>
                        <TableCell className="text-right">
                          {abastecimento.quilometragem?.toLocaleString('pt-BR') || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {custoTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {precoLitro.toFixed(2)}
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
