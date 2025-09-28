import { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ReportForm } from "@/components/reports/ReportForm";
import { useReports } from "@/hooks/useReports";
import { toast } from "@/components/ui/use-toast";

// Tipo para os relatórios baseados nos dados do banco
type Relatorio = {
  id: number;
  created_at: string;
  nome_relatorio: string | null;
  tipo_analise: string | null;
  periodo: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  filtros: string | null;
};

// Tipo para os modelos de relatórios
type ReportTemplate = {
  id: number;
  name: string;
  description: string;
  category: string;
  frequency: string;
  lastGenerated: string;
};

export default function Reports() {
  const { relatorios, loading, error, refreshRelatorios } = useReports();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any | null>(null);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 1,
      name: "Relatório de Eficiência de Combustível",
      description: "Análise detalhada do consumo de combustível por veículo",
      category: "Combustível",
      frequency: "Mensal",
      lastGenerated: "2024-01-20"
    },
    {
      id: 2,
      name: "Relatório de Manutenções",
      description: "Histórico e previsão de manutenções da frota",
      category: "Manutenção",
      frequency: "Semanal",
      lastGenerated: "2024-01-18"
    },
    {
      id: 3,
      name: "Relatório de Custos Operacionais",
      description: "Análise completa dos custos operacionais",
      category: "Financeiro",
      frequency: "Mensal",
      lastGenerated: "2024-01-15"
    },
    {
      id: 4,
      name: "Relatório de Desempenho de Motoristas",
      description: "Avaliação de performance e comportamento",
      category: "Motoristas",
      frequency: "Quinzenal",
      lastGenerated: "2024-01-10"
    }
  ];

  // Função para controlar a abertura do formulário e pré-preencher com dados
  const handleOpenForm = (template?: ReportTemplate) => {
    if (template) {
      setInitialFormData({
        nome_relatorio: template.name,
        tipo_analise: template.category,
        periodo: template.frequency,
      });
    } else {
      setInitialFormData(null);
    }
    setIsFormOpen(true);
  };

  // Função para lidar com o clique no botão Gerar/Download
  const handleGenerateDownload = (relatorio: Relatorio) => {
    if (relatorio.nome_relatorio) {
      toast({
        title: "Geração em Andamento",
        description: `O relatório '${relatorio.nome_relatorio}' está sendo processado para download.`,
      });
      // Placeholder para lógica futura de download
      console.log(`Iniciando download de ${relatorio.nome_relatorio}`);
    } else {
      toast({
        title: "Erro",
        description: "Relatório sem nome definido. Não é possível gerar.",
        variant: "destructive",
      });
    }
  };

  // Funções para lidar com os cliques nos cards da parte inferior
  const handleQuickAction = (actionName: string) => {
    toast({
      title: "Recurso em Desenvolvimento",
      description: `A funcionalidade '${actionName}' será implementada em breve.`,
    });
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      "Combustível": "bg-blue-500/10 text-blue-500 border-blue-500",
      "Manutenção": "bg-orange-500/10 text-orange-500 border-orange-500",
      "Financeiro": "bg-green-500/10 text-green-500 border-green-500",
      "Motoristas": "bg-purple-500/10 text-purple-500 border-purple-500"
    };
    
    return (
      <Badge className={colors[category] || "bg-gray-500/10 text-gray-500 border-gray-500"}>
        {category}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    // A lógica de status "Concluído" vs "Processando" precisa ser implementada no back-end
    // Por enquanto, todos os relatórios da lista são 'Criado'.
    return <Badge className="bg-success/10 text-success border-success">Criado</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e relatórios da sua frota</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleQuickAction('Filtros')}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          {/* O componente ReportForm agora é um Dialog, não um botão */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()}>
                + Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ReportForm 
                onSuccess={() => {
                  refreshRelatorios();
                  setIsFormOpen(false);
                }} 
                initialData={initialFormData} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {reportTemplates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(template.category)}
                      <Badge variant="outline">{template.frequency}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Último: {new Date(template.lastGenerated).toLocaleDateString('pt-BR')}
                  </p>
                  <Button size="sm" onClick={() => handleOpenForm(template)}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Gerar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Criados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando relatórios...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">Erro: {error}</div>
          ) : relatorios.length === 0 ? (
            <div className="text-center py-8">Nenhum relatório criado ainda</div>
          ) : (
            <div className="space-y-4">
              {relatorios.map((relatorio) => (
                <div key={relatorio.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{relatorio.nome_relatorio}</h3>
                      <p className="text-sm text-muted-foreground">
                        {relatorio.tipo_analise} • {relatorio.periodo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relatorio.data_inicio ? new Date(relatorio.data_inicio).toLocaleDateString('pt-BR') : ''} - {relatorio.data_fim ? new Date(relatorio.data_fim).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge("Criado")}
                    <Button variant="outline" size="sm" onClick={() => handleGenerateDownload(relatorio)}>
                      <Download className="mr-2 h-4 w-4" />
                      Gerar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-elegant transition-all duration-300 cursor-pointer" onClick={() => handleQuickAction('Dashboard Executivo')}>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium mb-2">Dashboard Executivo</h3>
            <p className="text-sm text-muted-foreground">Visão geral dos principais KPIs</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-elegant transition-all duration-300 cursor-pointer" onClick={() => handleQuickAction('Relatório Personalizado')}>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium mb-2">Relatório Personalizado</h3>
            <p className="text-sm text-muted-foreground">Crie relatórios sob medida</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-elegant transition-all duration-300 cursor-pointer" onClick={() => handleQuickAction('Exportar Dados')}>
          <CardContent className="p-6 text-center">
            <Download className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium mb-2">Exportar Dados</h3>
            <p className="text-sm text-muted-foreground">Exporte dados em vários formatos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}