import { BarChart3, Download, Calendar, Filter, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const reportTemplates = [
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

  const recentReports = [
    {
      id: 1,
      name: "Consumo Combustível - Janeiro 2024",
      type: "PDF",
      size: "2.3 MB",
      generatedAt: "2024-01-20 14:30",
      status: "Concluído"
    },
    {
      id: 2,
      name: "Manutenções Preventivas - Semana 3",
      type: "Excel",
      size: "1.8 MB",
      generatedAt: "2024-01-18 09:15",
      status: "Concluído"
    },
    {
      id: 3,
      name: "Custos Operacionais - Dezembro 2023",
      type: "PDF",
      size: "3.1 MB",
      generatedAt: "2024-01-15 16:45",
      status: "Processando"
    }
  ];

  const getCategoryBadge = (category: string) => {
    const colors = {
      "Combustível": "bg-blue-500/10 text-blue-500 border-blue-500",
      "Manutenção": "bg-orange-500/10 text-orange-500 border-orange-500",
      "Financeiro": "bg-green-500/10 text-green-500 border-green-500",
      "Motoristas": "bg-purple-500/10 text-purple-500 border-purple-500"
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || "bg-gray-500/10 text-gray-500 border-gray-500"}>
        {category}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === "Concluído"
      ? <Badge className="bg-success/10 text-success border-success">Concluído</Badge>
      : <Badge className="bg-warning/10 text-warning border-warning">Processando</Badge>;
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
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button className="bg-gradient-primary hover:bg-primary-hover">
            <BarChart3 className="mr-2 h-4 w-4" />
            Novo Relatório
          </Button>
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
                  <Button size="sm">
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
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{report.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {report.type} • {report.size} • {report.generatedAt}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(report.status)}
                  {report.status === "Concluído" && (
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-elegant transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium mb-2">Dashboard Executivo</h3>
            <p className="text-sm text-muted-foreground">Visão geral dos principais KPIs</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-elegant transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-medium mb-2">Relatório Personalizado</h3>
            <p className="text-sm text-muted-foreground">Crie relatórios sob medida</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-elegant transition-all duration-300 cursor-pointer">
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