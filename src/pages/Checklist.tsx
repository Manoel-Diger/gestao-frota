import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChecklists } from '@/hooks/useChecklists';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  ClipboardCheck,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChecklistForm } from '@/components/checklist/ChecklistForm';
import { ChecklistViewDialog } from '@/components/checklist/ChecklistViewDialog';

const capitalize = (s: string) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export default function Checklist() {
  const { checklists, loading, error, refetch } = useChecklists();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [viewChecklist, setViewChecklist] = useState<any>(null);
  const [deleteChecklist, setDeleteChecklist] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const statusColors: Record<string, string> = {
    Aprovado: 'bg-blue-600 hover:bg-blue-700 text-white',
    Reprovado: 'bg-red-600 hover:bg-red-700 text-white',
    Pendente: 'bg-yellow-500 hover:bg-yellow-600 text-black',
  };

  const filteredChecklists = useMemo(() => {
    return checklists.filter((checklist) => {
      const matchesSearch =
        checklist.placa_veiculo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checklist.motorista_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checklist.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !filterType || checklist.tipo_checklist === filterType;
      return matchesSearch && matchesType;
    });
  }, [checklists, searchTerm, filterType]);

  const statistics = useMemo(() => {
    const total = filteredChecklists.length;
    const totalAprovados = filteredChecklists.filter(
      (c) => c.status_final?.toUpperCase() === 'APROVADO'
    ).length;
    const totalReprovados = filteredChecklists.filter(
      (c) => c.status_final?.toUpperCase() === 'REPROVADO'
    ).length;
    const percentAprovados =
      total > 0 ? ((totalAprovados / total) * 100).toFixed(1) : '0.0';
    const percentReprovados =
      total > 0 ? ((totalReprovados / total) * 100).toFixed(1) : '0.0';
    const totalNaoConformidades = filteredChecklists.reduce(
      (sum, c) => sum + (c.total_nao_conformidades || 0),
      0
    );
    return {
      totalAprovados: totalAprovados,
      totalReprovados: totalReprovados,
      totalChecklists: total,
      mediaNaoConformidades:
        total > 0 ? (totalNaoConformidades / total).toFixed(1) : '0.0',
      percentAprovados,
      percentReprovados,
    };
  }, [filteredChecklists]);

  const handleCreate = async (values: any) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('checklists').insert([values]);
      if (error) throw error;
      toast({
        title: 'Checklist criado',
        description: 'O checklist foi criado com sucesso.',
      });
      setIsCreateOpen(false);
      refetch();
    } catch (error) {
      console.error('Erro ao criar checklist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o checklist.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('checklists')
        .update(values)
        .eq('id', selectedChecklist.id);
      if (error) throw error;
      toast({
        title: 'Checklist atualizado',
        description: 'O checklist foi atualizado com sucesso.',
      });
      setSelectedChecklist(null);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o checklist.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteChecklist) return;
    try {
      if (deleteChecklist.imagens && deleteChecklist.imagens.length > 0) {
        const filePaths = deleteChecklist.imagens
          .map((url: string) => {
            const parts = url.split('/checklist-images/');
            return parts.length > 1 ? parts[1] : null;
          })
          .filter(Boolean);
        if (filePaths.length > 0) {
          await supabase.storage.from('checklist-images').remove(filePaths);
        }
      }
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', deleteChecklist.id);
      if (error) throw error;
      toast({
        title: 'Checklist excluído',
        description: 'O checklist foi excluído com sucesso.',
      });
      setDeleteChecklist(null);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir checklist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o checklist.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklists</h1>
          <p className="text-muted-foreground">Gerenciamento de inspeções veiculares</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Novo Checklist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.percentAprovados}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.totalAprovados} Checklists aprovados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Checklists</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalChecklists}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Inspeções realizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Não Conformidades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.mediaNaoConformidades}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Por checklist
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Reprovados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.percentReprovados}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.totalReprovados} Checklists reprovados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por placa, motorista ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md bg-background focus:ring-1 focus:ring-primary focus:border-primary"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Todos os Tipos</option>
              <option value="Preventiva">Preventiva</option>
              <option value="Pré-viagem">Pré-viagem</option>
              <option value="Pós-viagem">Pós-viagem</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredChecklists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-8 w-8 mx-auto mb-2" />
              <p>
                {searchTerm || filterType
                  ? "Nenhum checklist encontrado para sua pesquisa."
                  : "Nenhum checklist encontrado."}
              </p>
              {!searchTerm && !filterType && <p className="text-sm mt-2">Clique em 'Novo Checklist' para começar.</p>}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Não Conf.</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecklists.map((checklist) => {
                    const normalizedStatus = checklist.status_final ? capitalize(checklist.status_final) : 'Pendente';
                    const statusClassName = statusColors[normalizedStatus] || statusColors['Pendente'];
                    return (
                      <TableRow key={checklist.id}>
                        <TableCell>
                          {format(new Date(checklist.data_inspecao), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>{checklist.tipo_checklist}</TableCell>
                        <TableCell>{checklist.veiculo_info}</TableCell>
                        <TableCell>{checklist.motorista_nome}</TableCell>
                        <TableCell>
                          <Badge className={statusClassName}>
                            {normalizedStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{checklist.total_nao_conformidades}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewChecklist(checklist)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedChecklist(checklist)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteChecklist(checklist)}
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Checklist</DialogTitle>
          </DialogHeader>
          <ChecklistForm onSubmit={handleCreate} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedChecklist}
        onOpenChange={() => setSelectedChecklist(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Checklist</DialogTitle>
          </DialogHeader>
          <ChecklistForm
            onSubmit={handleUpdate}
            initialData={selectedChecklist}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <ChecklistViewDialog
        checklist={viewChecklist}
        open={!!viewChecklist}
        onOpenChange={() => setViewChecklist(null)}
      />

      <AlertDialog
        open={!!deleteChecklist}
        onOpenChange={() => setDeleteChecklist(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este checklist? Esta ação não pode ser
              desfeita e todas as imagens relacionadas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}