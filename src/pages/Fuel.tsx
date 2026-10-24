import { useState, useMemo } from "react";
import { Fuel, TrendingDown, TrendingUp, DollarSign, Search, AlertTriangle, Eye, Pencil, Trash2, Gauge, Route } from "lucide-react";
import { FuelForm } from "@/components/fuel/FuelForm";
import { FuelViewDialog } from "@/components/fuel/FuelViewDialog";
import { FuelEditDialog } from "@/components/fuel/FuelEditDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
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
import { useAbastecimentos, Abastecimento } from "@/hooks/useAbastecimentos";
import { useToast } from "@/hooks/use-toast";
import { MonthYearFilter, matchesMonthYear } from "@/components/shared/MonthYearFilter";

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

    // KM Percorrido / Consumo: para cada abastecimento filtrado, o trecho é a
    // diferença entre o hodômetro atual e o do abastecimento ANTERIOR do mesmo
    // veículo na base completa (mesmo que o anterior esteja fora do período filtrado)
    const porPlacaCompleto: Record<string, Abastecimento[]> = {};
    (abastecimentos || []).forEach((ab) => {
      const placa = ab.veiculo_placa || "sem_placa";
      if (!porPlacaCompleto[placa]) porPlacaCompleto[placa] = [];
      porPlacaCompleto[placa].push(ab);
    });
    Object.values(porPlacaCompleto).forEach((grupo) => {
      grupo.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    });

    let totalKmRodados = 0;
    let totalLitrosDosIntervalos = 0;
    let totalCustoDosIntervalos = 0;
    let kmPercorridoTotal = 0;

    filtered.forEach((ab) => {
      const placa = ab.veiculo_placa || "sem_placa";
      const historico = porPlacaCompleto[placa] || [];
      const idx = historico.findIndex((h) => h.id === ab.id);
      if (idx <= 0) return; // sem abastecimento anterior conhecido

      const kmAtual = Number(ab.quilometragem) || 0;
      const kmAnterior = Number(historico[idx - 1].quilometragem) || 0;
      if (kmAtual > 0 && kmAnterior > 0 && kmAtual > kmAnterior) {
        const diff = kmAtual - kmAnterior;
        totalKmRodados += diff;
        kmPercorridoTotal += diff;
        totalLitrosDosIntervalos += Number(ab.litros) || 0;
        totalCustoDosIntervalos += Number(ab.custo_total) || 0;
      }
    });

    consumoMedio = totalLitrosDosIntervalos > 0 ? totalKmRodados / totalLitrosDosIntervalos : 0;
    cpk = totalKmRodados > 0 ? totalGasto / totalKmRodados : 0;

    return { totalGasto, totalLitros, totalAbastecimentos, precoMedioGeral, consumoMedio, cpk, kmPercorridoTotal };
  }, [filteredAbastecimentos, abastecimentos]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Abastecimentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Controle de combustível da sua frota</p>
        </div>
        <FuelForm onSuccess={refetch} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        {(() => {
          const isFiltered = !!searchTerm || periodFilter !== 'all';
          const cards = [
            {
              title: 'Gasto Total',
              icon: DollarSign,
              tone: 'success' as const,
              value: `R$ ${stats.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              subtitle: isFiltered ? 'Filtrado' : 'Gasto acumulado',
            },
            {
              title: 'Litros Consumidos',
              icon: Fuel,
              tone: 'primary' as const,
              value: stats.totalLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
              unit: 'L',
              subtitle: isFiltered ? 'Filtrado' : 'Total consumido',
            },
            {
              title: 'Total Abastecimentos',
              icon: TrendingUp,
              tone: 'warning' as const,
              value: String(stats.totalAbastecimentos),
              subtitle: isFiltered ? 'Filtrado' : 'Registros',
            },
            {
              title: 'Preço Médio/Litro',
              icon: TrendingDown,
              tone: 'danger' as const,
              value: `R$ ${stats.precoMedioGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              subtitle: isFiltered ? 'Filtrado' : 'Média geral',
            },
            {
              title: 'Consumo Médio',
              icon: Gauge,
              tone: 'info' as const,
              value: stats.consumoMedio > 0 ? stats.consumoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—',
              unit: 'km/L',
              subtitle: isFiltered ? 'Filtrado' : 'Média da frota',
            },
            {
              title: 'CPK',
              icon: Route,
              tone: 'warning' as const,
              value: stats.cpk > 0 ? `R$ ${stats.cpk.toFixed(2)}` : '—',
              unit: '/km',
              subtitle: isFiltered ? 'Filtrado' : 'Custo por km',
            },
            {
              title: 'KM Percorrido',
              icon: Route,
              tone: 'info' as const,
              value: stats.kmPercorridoTotal.toLocaleString('pt-BR'),
              unit: 'km',
              subtitle: isFiltered ? 'Filtrado' : 'Distância total',
            },
          ];
          return cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <MetricCard
                key={c.title}
                className={i < 4 ? "lg:col-span-3" : i < 6 ? "lg:col-span-4" : "sm:col-span-2 lg:col-span-4"}
                title={c.title}
                value={c.value}
                unit={c.unit}
                tone={c.tone}
                icon={<Icon />}
                caption={
                  <span className="flex items-center gap-1.5">
                    {isFiltered && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                    {c.subtitle}
                  </span>
                }
              />
            );
          });
        })()}
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
                        <TableCell className="font-semibold tracking-wide">
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
                        <TableCell className="whitespace-nowrap text-right">{litros.toFixed(1)}L</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {abastecimento.quilometragem?.toLocaleString('pt-BR') || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          R$ {custoTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
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
