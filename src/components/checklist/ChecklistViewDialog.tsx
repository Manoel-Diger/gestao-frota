import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ImageGallery } from './ImageGallery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle } from 'lucide-react';

interface ChecklistViewDialogProps {
  checklist: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChecklistViewDialog({
  checklist,
  open,
  onOpenChange,
}: ChecklistViewDialogProps) {
  if (!checklist) return null;

  const statusColors: Record<string, string> = {
    Aprovado: 'bg-success text-success-foreground',
    Reprovado: 'bg-destructive text-destructive-foreground',
    Pendente: 'bg-warning text-warning-foreground',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Checklist</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data da Inspeção</p>
              <p className="font-medium">
                {format(new Date(checklist.data_inspecao), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tipo de Checklist</p>
              <p className="font-medium">{checklist.tipo_checklist}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Placa do Veículo</p>
              <p className="font-medium">{checklist.placa_veiculo}</p>
            </div>

            {checklist.placa_implemento && (
              <div>
                <p className="text-sm text-muted-foreground">Placa do Implemento</p>
                <p className="font-medium">{checklist.placa_implemento}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Motorista</p>
              <p className="font-medium">ID: {checklist.motorista}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Local da Inspeção</p>
              <p className="font-medium">{checklist.local_inspecao}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Odômetro</p>
              <p className="font-medium">{checklist.odometro.toLocaleString()} km</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status Final</p>
              <Badge className={statusColors[checklist.status_final] || ''}>
                {checklist.status_final}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Não Conformidades</p>
              <p className="font-medium">{checklist.total_nao_conformidades}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {checklist.assinatura_motorista ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm">Assinatura Motorista</span>
              </div>

              <div className="flex items-center gap-2">
                {checklist.visto_lideranca ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm">Visto Liderança</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Imagens</h3>
            <ImageGallery images={checklist.imagens || []} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
