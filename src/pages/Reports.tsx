import { BarChart3, Download, Calendar, Filter, TrendingUp, FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportForm } from "@/components/reports/ReportForm";
import { useReports } from "@/hooks/useReports";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useChecklists } from "@/hooks/useChecklists";
import { exportToPDF, exportToCSV, buildHTMLTable, buildSummaryCards } from "@/utils/exportUtils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { relatorios, loading, error, refreshRelatorios } = useReports();
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();
  const { manutencoes } = useManutencoes();
  const { abastecimentos } = useAbastecimentos();
  const { checklists } = useChecklists();
  const { toast } = useToast();

  const handleExportPDF = (tipo: string) => {
    let content = '';
    let title = '';
    let subtitle = '';

    switch (tipo) {
      case 'combustivel': {
        title = 'Relatório de Eficiência de Combustível';
        subtitle = `${abastecimentos.length} abastecimentos registrados`;
        const totalLitros = abastecimentos.reduce((s, a) => s + (a.litros || 0), 0);
        const totalCusto = abastecimentos.reduce((s, a) => s + (Number(a.custo_total) || 0), 0);
        content = buildSummaryCards([
          { label: 'Total Abastecimentos', value: abastecimentos.length },
          { label: 'Total Litros', value: totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) },
          { label: 'Custo Total', value: `R$ ${totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        ]);
        content += `<h2 class="section-title">Detalhamento por Abastecimento</h2>`;
        content += buildHTMLTable(
          abastecimentos.map(a => ({
            data: a.data ? new Date(a.data).toLocaleDateString('pt-BR') : '—',
            placa: a.veiculo_placa || '—',
            motorista: a.motorista_nome || '—',
            litros: a.litros?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '—',
            custo: `R$ ${Number(a.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            km: a.quilometragem ? Number(a.quilometragem).toLocaleString('pt-BR') : '—',
            posto: a.posto || '—',
          })),
          { data: 'Data', placa: 'Veículo', motorista: 'Motorista', litros: 'Litros', custo: 'Custo', km: 'KM', posto: 'Posto' }
        );
        break;
      }
      case 'manutencao': {
        title = 'Relatório de Manutenções';
        subtitle = `${manutencoes.length} manutenções registradas`;
        const custoTotal = manutencoes.reduce((s, m) => s + (Number(m.custo) || 0), 0);
        const pendentes = manutencoes.filter(m => m.status === 'Pendente').length;
        content = buildSummaryCards([
          { label: 'Total Manutenções', value: manutencoes.length },
          { label: 'Custo Total', value: `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Pendentes', value: pendentes },
        ]);
        content += `<h2 class="section-title">Detalhamento</h2>`;
        content += buildHTMLTable(
          manutencoes.map(m => ({
            data: m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '—',
            placa: m.veiculo_placa || '—',
            tipo: m.tipo_manutencao,
            custo: m.custo ? `R$ ${Number(m.custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—',
            status: m.status || '—',
            oficina: m.oficina || '—',
          })),
          { data: 'Data', placa: 'Veículo', tipo: 'Tipo', custo: 'Custo', status: 'Status', oficina: 'Oficina' }
        );
        break;
      }
      case 'custos': {
        title = 'Relatório de Custos Operacionais';
        const custoManut = manutencoes.reduce((s, m) => s + (Number(m.custo) || 0), 0);
        const custoComb = abastecimentos.reduce((s, a) => s + (Number(a.custo_total) || 0), 0);
        subtitle = `Custo total: R$ ${(custoManut + custoComb).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        content = buildSummaryCards([
          { label: 'Custo Manutenções', value: `R$ ${custoManut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Custo Combustível', value: `R$ ${custoComb.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
          { label: 'Custo Total', value: `R$ ${(custoManut + custoComb).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        ]);
        // Cost per vehicle
        const custosPorVeiculo: Record<string, { manut: number; comb: number }> = {};
        manutencoes.forEach(m => {
          const p = m.veiculo_placa || 'Sem placa';
          if (!custosPorVeiculo[p]) custosPorVeiculo[p] = { manut: 0, comb: 0 };
          custosPorVeiculo[p].manut += Number(m.custo) || 0;
        });
        abastecimentos.forEach(a => {
          const p = a.veiculo_placa || 'Sem placa';
          if (!custosPorVeiculo[p]) custosPorVeiculo[p] = { manut: 0, comb: 0 };
          custosPorVeiculo[p].comb += Number(a.custo_total) || 0;
        });
        content += `<h2 class="section-title">Custo por Veículo</h2>`;
        content += buildHTMLTable(
          Object.entries(custosPorVeiculo).map(([placa, c]) => ({
            placa,
            manutencao: `R$ ${c.manut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            combustivel: `R$ ${c.comb.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            total: `R$ ${(c.manut + c.comb).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          })).sort((a, b) => parseFloat(b.total.replace(/\D/g, '')) - parseFloat(a.total.replace(/\D/g, ''))),
          { placa: 'Veículo', manutencao: 'Manutenção', combustivel: 'Combustível', total: 'Total' }
        );
        break;
      }
      case 'motoristas': {
        title = 'Relatório de Motoristas';
        subtitle = `${motoristas.length} motoristas cadastrados`;
        const ativos = motoristas.filter(m => m.status === 'Ativo').length;
        content = buildSummaryCards([
          { label: 'Total Motoristas', value: motoristas.length },
          { label: 'Ativos', value: ativos },
          { label: 'Inativos', value: motoristas.length - ativos },
        ]);
        content += `<h2 class="section-title">Lista de Motoristas</h2>`;
        content += buildHTMLTable(
          motoristas.map(m => ({
            nome: m.nome,
            email: m.email || '—',
            telefone: m.telefone || '—',
            cnh: m.categoria_cnh || '—',
            validade: m.validade_cnh ? new Date(m.validade_cnh).toLocaleDateString('pt-BR') : '—',
            status: m.status || '—',
            placa: m.placa || '—',
          })),
          { nome: 'Nome', email: 'Email', telefone: 'Telefone', cnh: 'CNH', validade: 'Validade', status: 'Status', placa: 'Veículo' }
        );
        break;
      }
    }

    exportToPDF(title, content, { subtitle });
    toast({ title: 'PDF gerado!', description: `${title} aberto para impressão.` });
  };

  const handleExportCSV = (tipo: string) => {
    switch (tipo) {
      case 'combustivel':
        exportToCSV(
          abastecimentos.map(a => ({
            data: a.data, placa: a.veiculo_placa, motorista: a.motorista_nome,
            litros: a.litros, custo_total: a.custo_total, quilometragem: a.quilometragem, posto: a.posto
          })),
          'abastecimentos',
          { data: 'Data', placa: 'Veículo', motorista: 'Motorista', litros: 'Litros', custo_total: 'Custo Total', quilometragem: 'KM', posto: 'Posto' }
        );
        break;
      case 'manutencao':
        exportToCSV(
          manutencoes.map(m => ({
            data: m.data, placa: m.veiculo_placa, tipo: m.tipo_manutencao,
            custo: m.custo, status: m.status, oficina: m.oficina, descricao: m.descricao
          })),
          'manutencoes',
          { data: 'Data', placa: 'Veículo', tipo: 'Tipo', custo: 'Custo', status: 'Status', oficina: 'Oficina', descricao: 'Descrição' }
        );
        break;
      case 'checklists':
        exportToCSV(
          checklists.map(c => ({
            data: c.data_inspecao, placa: c.placa_veiculo, motorista: c.motorista_nome,
            status: c.status_final, falhas: c.total_nao_conformidades, tipo: c.tipo_checklist
          })),
          'checklists',
          { data: 'Data', placa: 'Veículo', motorista: 'Motorista', status: 'Status', falhas: 'Falhas', tipo: 'Tipo' }
        );
        break;
    }
    toast({ title: 'CSV exportado!', description: 'Arquivo baixado com sucesso.' });
  };

  const reportTemplates = [
    { id: 'combustivel', name: "Eficiência de Combustível", description: "Análise detalhada do consumo por veículo", category: "Combustível", icon: "⛽" },
    { id: 'manutencao', name: "Histórico de Manutenções", description: "Custos e status de manutenções da frota", category: "Manutenção", icon: "🔧" },
    { id: 'custos', name: "Custos Operacionais", description: "Análise completa: manutenção + combustível", category: "Financeiro", icon: "💰" },
    { id: 'motoristas', name: "Cadastro de Motoristas", description: "Lista completa com CNH e status", category: "Motoristas", icon: "👤" },
  ];

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      'Combustível': 'bg-primary/10 text-primary border-primary/30',
      'Manutenção': 'bg-warning/10 text-warning border-warning/30',
      'Financeiro': 'bg-success/10 text-success border-success/30',
      'Motoristas': 'bg-accent text-accent-foreground border-border',
    };
    return map[cat] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Gere e exporte relatórios profissionais da sua frota</p>
        </div>
        <div className="flex gap-2">
          <ReportForm onSuccess={refreshRelatorios} />
        </div>
      </div>

      {/* Quick Export Cards */}
      <StaggerContainer>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reportTemplates.map((t) => (
            <StaggerItem key={t.id}>
              <Card className="group hover:shadow-elevated transition-all duration-300 border-border/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5">
                  <div className="text-2xl mb-3">{t.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                  <Badge className={getCategoryColor(t.category)} variant="outline">{t.category}</Badge>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="default" className="flex-1 h-8 text-xs" onClick={() => handleExportPDF(t.id)}>
                      <FileText className="mr-1 h-3 w-3" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleExportCSV(t.id)}>
                      <FileSpreadsheet className="mr-1 h-3 w-3" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      {/* Checklist Export */}
      <FadeIn delay={0.3}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                <BarChart3 className="h-4 w-4 text-success" />
              </div>
              Exportação Rápida de Checklists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {checklists.length} inspeções realizadas • {checklists.filter(c => c.status_final === 'Aprovado').length} aprovadas • {checklists.filter(c => c.status_final === 'Reprovado').length} reprovadas
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('checklists')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Saved Reports */}
      <FadeIn delay={0.4}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Relatórios Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando relatórios...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">Erro: {error}</div>
            ) : relatorios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum relatório salvo ainda</p>
                <p className="text-xs mt-1">Use o botão "Novo Relatório" para criar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relatorios.map((relatorio) => (
                  <div key={relatorio.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{relatorio.nome_relatorio}</h3>
                        <p className="text-xs text-muted-foreground">
                          {relatorio.tipo_analise} • {relatorio.periodo}
                          {relatorio.data_inicio && ` • ${new Date(relatorio.data_inicio).toLocaleDateString('pt-BR')}`}
                          {relatorio.data_fim && ` - ${new Date(relatorio.data_fim).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/30 w-fit" variant="outline">Salvo</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
