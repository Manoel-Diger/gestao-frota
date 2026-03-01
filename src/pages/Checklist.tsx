import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { ClipboardCheck, Plus, Eye, Edit, Trash2, FileDown } from 'lucide-react';
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

export default function Checklist() {
  const { checklists, loading, refetch } = useChecklists();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [viewChecklist, setViewChecklist] = useState<any>(null);
  const [deleteChecklist, setDeleteChecklist] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusColors: Record<string, string> = {
    Aprovado: 'bg-success text-success-foreground',
    Reprovado: 'bg-destructive text-destructive-foreground',
    Pendente: 'bg-warning text-warning-foreground',
  };

  const handleCreate = async (values: any) => {
    try {
      setIsSubmitting(true);
      const { error } = await (supabase as any).from('checklists').insert([values]);
      if (error) throw error;

      toast({
        title: 'Checklist criado',
        description: 'O checklist foi criado com sucesso. Alertas e manutenções foram gerados automaticamente.',
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
      const { error } = await (supabase as any)
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

      const { error } = await (supabase as any)
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

  // Summary stats
  const totalChecklists = checklists.length;
  const aprovados = checklists.filter(c => c.status_final === 'Aprovado').length;
  const reprovados = checklists.filter(c => c.status_final === 'Reprovado').length;
  const totalNaoConf = checklists.reduce((sum, c) => sum + (c.total_nao_conformidades || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Checklists</h1>
            <p className="text-muted-foreground">Inspeções veiculares com inteligência integrada</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Inspeção
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="transition-all duration-500">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary transition-all duration-500">{totalChecklists}</p>
            <p className="text-xs text-muted-foreground">Total Inspeções</p>
          </CardContent>
        </Card>
        <Card className="border-success/20 transition-all duration-500">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success transition-all duration-500">{aprovados}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 transition-all duration-500">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive transition-all duration-500">{reprovados}</p>
            <p className="text-xs text-muted-foreground">Reprovados</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-500">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning transition-all duration-500">{totalNaoConf}</p>
            <p className="text-xs text-muted-foreground">Não Conformidades</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Inspeções</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma inspeção registrada. Clique em "Nova Inspeção" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Falhas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklists.map((checklist) => (
                  <TableRow key={checklist.id}>
                    <TableCell>
                      {format(new Date(checklist.data_inspecao), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{checklist.tipo_checklist}</TableCell>
                    <TableCell className="font-mono">{checklist.placa_veiculo}</TableCell>
                    <TableCell>{checklist.motorista_nome || `ID: ${checklist.motorista}`}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[checklist.status_final] || ''}>
                        {checklist.status_final}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={checklist.total_nao_conformidades > 0 ? 'text-destructive font-bold' : 'text-success'}>
                        {checklist.total_nao_conformidades}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewChecklist(checklist)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedChecklist(checklist)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteChecklist(checklist)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Inspeção Veicular</DialogTitle>
          </DialogHeader>
          <ChecklistForm onSubmit={handleCreate} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedChecklist} onOpenChange={() => setSelectedChecklist(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Checklist</DialogTitle>
          </DialogHeader>
          <ChecklistForm onSubmit={handleUpdate} initialData={selectedChecklist} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      <ChecklistViewDialog checklist={viewChecklist} open={!!viewChecklist} onOpenChange={() => setViewChecklist(null)} />

      <AlertDialog open={!!deleteChecklist} onOpenChange={() => setDeleteChecklist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.
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
