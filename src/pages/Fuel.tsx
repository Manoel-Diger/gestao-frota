import { useState, useMemo } from "react";
import { Fuel, TrendingDown, TrendingUp, DollarSign, Search, AlertTriangle, Eye, Pencil, Trash2, Gauge, Route } from "lucide-react";
import { FuelForm } from "../components/fuel/FuelForm";
import { FuelViewDialog } from "../components/fuel/FuelViewDialog";
import { FuelEditDialog } from "../components/fuel/FuelEditDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAbastecimentos, Abastecimento } from "../hooks/useAbastecimentos";
import { useToast } from "../hooks/use-toast";
import { MonthYearFilter, matchesMonthYear } from "../components/shared/MonthYearFilter";

export default function FuelPage() {
  const { abastecimentos, loading, error, refetch, deleteAbastecimento } = useAbastecimentos();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [viewAbastecimento, setViewAbastecimento] = useState<Abastecimento | null>(null);
  const [editAbastecimento, setEditAbastecimento] = useState<Abastecimento | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Filtragem com useMemo
  const filteredAbastecimentos = useMemo(() => {
    if (!abastecimentos) return [];
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    return abastecimentos.filter((abastecimento) => {
      if (!matchesMonthYear(abastecimento.data, periodFilter)) return false;
      if (!lowerCaseSearch) return true;
      const placaVeiculo = abastecimento.veiculo_placa?.toLowerCase() || "";
      const data = abastecimento.data
        ? new Date(abastecimento.data).toLocaleDateString("pt-BR")
        : "";
      return placaVeiculo.includes(lowerCaseSearch) || data.includes(lowerCaseSearch);
    });
  }, [abastecimentos, searchTerm, periodFilter]);

  // Cálculos dinâmicos por filtro (sempre baseados nos registros filtrados)
  const stats = useMemo(() => {
    const filtered = filteredAbastecimentos;
    const totalGasto = filtered.reduce((sum, ab) => sum + (Number(ab.custo_total) || 0), 0);
    const totalLitros = filtered.reduce((sum, ab) => sum + (Number(ab.litros) || 0), 0);
    const totalAbastecimentos = filtered.length;
    const precoMedioGeral = totalLitros > 0 ? totalGasto / totalLitros : 0;

    // Consumo Médio (km/L) - baseado na diferença de quilometragem entre abastecimentos
    let consumoMedio = 0;
    let cpk = 0;

    // Agrupar por placa para calcular consumo
    const porPlaca: Record<string, Abastecimento[]> = {};
    filtered.forEach((ab) => {
      const placa = ab.veiculo_placa || "sem_placa";
      if (!porPlaca[placa]) porPlaca[placa] = [];
      porPlaca[placa].push(ab);
    });

    let totalKmRodados = 0;
    let totalLitrosConsumo = 0;
    let totalCustoConsumo = 0;
    let kmPercorridoTotal = 0;

    Object.values(porPlaca).forEach((grupo) => {
      const sorted = [...grupo]
        .filter((ab) => Number.isFinite(Number(ab.quilometragem)))
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      for (let i = 1; i < sorted.length; i++) {
        const kmAtual = Number(sorted[i].quilometragem) || 0;
        const kmAnterior = Number(sorted[i - 1].quilometragem) || 0;
        const litrosAtual = Number(sorted[i].litros) || 0;
        const custoAtual = Number(sorted[i].custo_total) || 0;

        if (kmAtual > kmAnterior) {
          const diff = kmAtual - kmAnterior;
          totalKmRodados += diff;
          totalLitrosConsumo += litrosAtual;
          totalCustoConsumo += custoAtual;
        }
      }
    });

    kmPercorridoTotal = totalKmRodados;
    consumoMedio = totalLitrosConsumo > 0 ? totalKmRodados / totalLitrosConsumo : 0;
    cpk = kmPercorridoTotal > 0 ? totalCustoConsumo / kmPercorridoTotal : 0;

    return { totalGasto, totalLitros, totalAbastecimentos, precoMedioGeral, consumoMedio, cpk, kmPercorridoTotal };
  }, [filteredAbastecimentos]);

  const handleView = (abastecimento: Abastecimento) => {
    setViewAbastecimento(abastecimento);
    setViewDialogOpen(true);
  };

  const handleEdit = (abastecimento: Abastecimento) => {
    setEditAbastecimento(abastecimento);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este abastecimento?")) {
      const success = await deleteAbastecimento(id);
      if (success) {
        toast({
          title: "Sucesso!",
          description: "Abastecimento excluído com sucesso.",
        });
        refetch();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao excluir o abastecimento.",
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
          <h1 className="text-3xl font-bold tracking-tight">Abastecimentos</h1>
          <p className="text-muted-foreground">Controle de combustível da sua frota</p>
        </div>
        <FuelForm onSuccess={refetch} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3">
        <Card className="transition-all duration-300 hover:shadow-md border-slate-200/60">
          <CardHeader className="flex items-start justify-between gap-2 pb-2.5">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Gasto Total</CardTitle>
              <p className="text-xs text-slate-500">Acumulado</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700 flex-shrink-0">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              R$ {stats.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500">{searchTerm ? '🔍 Filtrado' : 'Período'}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-slate-200/60">
          <CardHeader className="flex items-start justify-between gap-2 pb-2.5">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Litros Consumidos</CardTitle>
              <p className="text-xs text-slate-500">Combustível</p>
            </div>
            <div className="rounded-lg bg-sky-100 p-1.5 text-sky-700 flex-shrink-0">
              <Fuel className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              {stats.totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs font-medium text-muted-foreground">L</span>
            </div>
            <p className="text-xs text-slate-500">{searchTerm ? '🔍 Filtrado' : 'Total'}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-slate-200/60">
          <CardHeader className="flex items-start justify-between gap-2 pb-2.5">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Abastecimentos</CardTitle>
              <p className="text-xs text-slate-500">Registros</p>
            </div>
            <div className="rounded-lg bg-orange-100 p-1.5 text-orange-700 flex-shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              {stats.totalAbastecimentos}
            </div>
            <p className="text-xs text-slate-500">{searchTerm ? '🔍 Filtrado' : 'Entradas'}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-slate-200/60">
          <CardHeader className="flex items-start justify-between gap-2 pb-2.5">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Preço Médio</CardTitle>
              <p className="text-xs text-slate-500">Por litro</p>
            </div>
            <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700 flex-shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              R$ {stats.precoMedioGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500">{searchTerm ? '🔍 Filtrado' : 'Média'}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-slate-200/60">
          <CardHeader className="flex items-start justify-between gap-2 pb-2.5">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Consumo Médio</CardTitle>
              <p className="text-xs text-slate-500">Eficiência</p>
            </div>
            <div className="rounded-lg bg-violet-100 p-1.5 text-violet-700 flex-shrink-0">
              <Gauge className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              {stats.consumoMedio > 0 ? stats.consumoMedio.toFixed(1) : '—'} <span className="text-xs font-medium text-muted-foreground">km/L</span>
            </div>
            <p className="text-xs text-slate-500">{searchTerm ? '🔍 Filtrado' : 'Frota'}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-slate-200/60">
          <CardHeader className="flex items-start justify-between gap-2 pb-2.5">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">CPK</CardTitle>
              <p className="text-xs text-slate-500">Custo/km</p>
            </div>
            <div className="rounded-lg bg-amber-100 p-1.5 text-amber-700 flex-shrink-0">
              <Route className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              {stats.cpk > 0 ? `R$ ${stats.cpk.toFixed(2)}` : '—'} <span className="text-xs font-medium text-muted-foreground">/km</span>
            </div>
            <p className="text-xs text-slate-500">{searchTerm ? '🔍 Filtrado' : 'Gestão'}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-slate-200/60">
          <CardHeader className="flex items-start justify-between gap-2 pb-2.5">
            <div className="space-y-0.5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">KM Rodado</CardTitle>
              <p className="text-xs text-slate-500">Distância</p>
            </div>
            <div className="rounded-lg bg-cyan-100 p-1.5 text-cyan-700 flex-shrink-0">
              <Route className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              {stats.kmPercorridoTotal.toLocaleString('pt-BR')} <span className="text-xs font-medium text-muted-foreground">km</span>
            </div>
            <p className="text-xs text-slate-500">{searchTerm || periodFilter !== 'all' ? '🔍 Filtrado' : 'Total'}</p>
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
            <MonthYearFilter
              value={periodFilter}
              onChange={setPeriodFilter}
              availableDates={abastecimentos.map((a) => a.data)}
            />
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
                    <TableHead>Motorista</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Litros</TableHead>
                    <TableHead className="text-right">Km</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">R$/L</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
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
                          {abastecimento.motorista_nome || "N/A"}
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
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(abastecimento)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(abastecimento)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(abastecimento.id)}
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

      <FuelViewDialog
        abastecimento={viewAbastecimento}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <FuelEditDialog
        abastecimento={editAbastecimento}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}