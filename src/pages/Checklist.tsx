import { useState } from "react";
import { Plus, Eye, Trash2, FileCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChecklistForm from "@/components/checklist/ChecklistForm";
import { useChecklists, ChecklistDisplay } from '@/hooks/useChecklists';
import { useMotoristas } from '@/hooks/useMotoristas';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


export default function ChecklistPage() {
  // Hooks dos dados
  const { checklists, loading, refetch, deleteChecklist, error } = useChecklists();
  const { motoristas } = useMotoristas();
  const [showForm, setShowForm] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistDisplay | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Função para obter nome do motorista por ID
  const getMotoristaNome = (id: number | string) => {
    const motorista = motoristas.find(m => m.id.toString() === id.toString());
    return motorista ? motorista.nome : id;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este checklist?")) {
      await deleteChecklist(id);
      refetch();
    }
  };

  const handleViewDetails = (checklist: ChecklistDisplay) => {
    setSelectedChecklist(checklist);
    setShowDetails(true);
  };

  const calculateStats = () => {
    if (!checklists || checklists.length === 0) {
      return { approvedPercentage: 0, totalChecklists: 0, avgNonConformities: 0 };
    }

    const approved = checklists.filter(c => c.status_final === 'APROVADO').length;
    const totalNonConformities = checklists.reduce((sum, c) => sum + (c.total_nao_conformidades || 0), 0);
    const avg = totalNonConformities / checklists.length;

    return {
      approvedPercentage: Math.round((approved / checklists.length) * 100),
      totalChecklists: checklists.length,
      avgNonConformities: parseFloat(avg.toFixed(1)),
    };
  };

  const stats = calculateStats();

  const getStatusBadge = (status: string) => {
    return status === 'APROVADO' ? (
      <Badge className="bg-green-500 hover:bg-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Aprovado
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Reprovado
      </Badge>
    );
  };

  const renderChecklistDetails = () => {
    if (!selectedChecklist) return null;

    const secoes = selectedChecklist.secoes || {};

    return (
      <div className="space-y-6 p-1">
        <div>
          <h3 className="font-semibold mb-3">Informações Básicas</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Data:</strong> {format(new Date(selectedChecklist.data_inspecao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            <div><strong>Motorista:</strong> {getMotoristaNome(selectedChecklist.motorista)}</div>
            <div><strong>Placa Veículo:</strong> {selectedChecklist.placa_veiculo}</div>
            <div><strong>Placa Implemento:</strong> {selectedChecklist.placa_implemento || 'N/A'}</div>
            <div><strong>Odômetro:</strong> {selectedChecklist.odometro} km</div>
            <div><strong>Local:</strong> {selectedChecklist.local_inspecao}</div>
            <div><strong>Tipo:</strong> {selectedChecklist.tipo_checklist}</div>
            <div><strong>Status:</strong> {getStatusBadge(selectedChecklist.status_final)}</div>
          </div>
        </div>

        {Object.entries(secoes).map(([secaoKey, secaoData]) => (
          <div key={secaoKey} className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">{secaoData.titulo || secaoKey}</h4>
            <div className="space-y-2">
              {secaoData.itens?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <span className="text-sm">{item.descricao}</span>
                  <div className="flex items-center space-x-2">
                    {item.conforme ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Conforme</Badge>
                    ) : (
                      <Badge variant="destructive">Não Conforme</Badge>
                    )}
                    {item.observacoes && (
                      <span className="text-xs text-gray-500">({item.observacoes})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Resultado Final</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Total de Não Conformidades:</strong> {selectedChecklist.total_nao_conformidades}</div>
            <div><strong>Assinatura Digital:</strong> {selectedChecklist.assinatura_motorista ? 'Sim' : 'Não'}</div>
            {selectedChecklist.visto_lideranca && (
              <div><strong>Visto da Liderança:</strong> Sim</div>
            )}
          </div>
        </div>

        {selectedChecklist.imagens && selectedChecklist.imagens.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Imagens Anexadas</h4>
            <div className="grid grid-cols-2 gap-2">
              {selectedChecklist.imagens.map((img: string, index: number) => (
                <img
                  key={index}
                  src={img}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklists Veiculares</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore os checklists de inspeção dos veículos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Checklist
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de aprovação dos checklists
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Checklists</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChecklists}</div>
            <p className="text-xs text-muted-foreground">
              Checklists realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Não Conformidades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.avgNonConformities.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Por checklist
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Checklists</CardTitle>
          <CardDescription>
            Visualize todos os checklists realizados e suas informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-6 w-6 mb-2" />
              <p>Erro ao carregar checklists. Verifique sua conexão.</p>
              <Button variant="link" onClick={refetch}>Tentar Novamente</Button>
            </div>
          ) : checklists && checklists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum checklist encontrado.</p>
              <p className="text-sm">Clique em "Novo Checklist" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Não Conformidades</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklists?.map((checklist) => (
                    <TableRow key={checklist.id}>
                      <TableCell>
                        {format(new Date(checklist.data_inspecao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{getMotoristaNome(checklist.motorista)}</TableCell>
                      <TableCell>{checklist.placa_veiculo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{checklist.tipo_checklist}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(checklist.status_final)}</TableCell>
                      <TableCell>
                        <span className={checklist.total_nao_conformidades > 0 ? "text-red-600 font-medium" : ""}>
                          {checklist.total_nao_conformidades}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(checklist)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(checklist.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Checklist Veicular</DialogTitle>
          </DialogHeader>
          <ChecklistForm
            onSuccess={() => {
              setShowForm(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Checklist</DialogTitle>
          </DialogHeader>
          {renderChecklistDetails()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
