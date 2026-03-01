import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageGallery } from './ImageGallery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, FileDown } from 'lucide-react';
import { INSPECTION_GROUPS } from '@/hooks/useChecklists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChecklistViewDialogProps {
  checklist: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function exportPDF(checklist: any) {
  const groupLabels: Record<string, string> = {
    pneus_rodas: 'Pneus / Rodas',
    iluminacao: 'Iluminação',
    fluidos: 'Fluidos',
    seguranca: 'Segurança',
    cabine: 'Cabine',
  };

  let html = `<html><head><title>Laudo Técnico - ${checklist.placa_veiculo}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
    th { background: #f5f5f5; }
    .ok { color: green; font-weight: bold; }
    .nok { color: red; font-weight: bold; }
    .na { color: #999; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
    .info-item { padding: 8px; background: #f9f9f9; border-radius: 4px; }
    .info-label { font-size: 11px; color: #888; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .approved { background: #e6f4ea; color: #1e7e34; }
    .failed { background: #fce8e6; color: #c62828; }
    @media print { body { padding: 20px; } }
  </style></head><body>`;

  html += `<h1>🔍 Laudo de Inspeção Veicular</h1>`;
  html += `<div class="info-grid">
    <div class="info-item"><span class="info-label">Data</span><br/>${format(new Date(checklist.data_inspecao), 'dd/MM/yyyy')}</div>
    <div class="info-item"><span class="info-label">Veículo</span><br/>${checklist.placa_veiculo}</div>
    <div class="info-item"><span class="info-label">Motorista</span><br/>${checklist.motorista_nome || 'ID: ' + checklist.motorista}</div>
    <div class="info-item"><span class="info-label">Local</span><br/>${checklist.local_inspecao || '-'}</div>
    <div class="info-item"><span class="info-label">Odômetro</span><br/>${checklist.odometro?.toLocaleString() || 0} km</div>
    <div class="info-item"><span class="info-label">Status</span><br/><span class="status-badge ${checklist.status_final === 'Aprovado' ? 'approved' : 'failed'}">${checklist.status_final}</span></div>
  </div>`;

  for (const [key, label] of Object.entries(groupLabels)) {
    const group = checklist[key];
    if (!group || typeof group !== 'object') continue;
    html += `<h2>${label}</h2><table><tr><th>Item</th><th>Status</th><th>Observação</th></tr>`;
    for (const [item, val] of Object.entries(group as Record<string, any>)) {
      const cls = val.status === 'ok' ? 'ok' : val.status === 'nok' ? 'nok' : 'na';
      const label = val.status === 'ok' ? 'OK' : val.status === 'nok' ? 'NÃO CONFORME' : 'N/A';
      html += `<tr><td>${item}</td><td class="${cls}">${label}</td><td>${val.obs || '-'}</td></tr>`;
    }
    html += `</table>`;
  }

  html += `<br/><p style="text-align:center;color:#999;font-size:11px;">Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p></body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.print();
  }
}

export function ChecklistViewDialog({ checklist, open, onOpenChange }: ChecklistViewDialogProps) {
  if (!checklist) return null;

  const statusColors: Record<string, string> = {
    Aprovado: 'bg-success text-success-foreground',
    Reprovado: 'bg-destructive text-destructive-foreground',
    Pendente: 'bg-warning text-warning-foreground',
  };

  const groupKeys = ['pneus_rodas', 'iluminacao', 'fluidos', 'seguranca', 'cabine'] as const;
  const groupLabels: Record<string, string> = {
    pneus_rodas: '🛞 Pneus / Rodas',
    iluminacao: '💡 Iluminação',
    fluidos: '🛢️ Fluidos',
    seguranca: '🛡️ Segurança',
    cabine: '🚛 Cabine',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Checklist</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => exportPDF(checklist)}>
              <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">{format(new Date(checklist.data_inspecao), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Veículo</p>
              <p className="font-medium">{checklist.placa_veiculo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Motorista</p>
              <p className="font-medium">{checklist.motorista_nome || `ID: ${checklist.motorista}`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Local</p>
              <p className="font-medium">{checklist.local_inspecao}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Odômetro</p>
              <p className="font-medium">{checklist.odometro?.toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[checklist.status_final] || ''}>{checklist.status_final}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Não Conformidades</p>
              <p className="font-bold text-destructive">{checklist.total_nao_conformidades}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {checklist.assinatura_motorista ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                <span className="text-xs">Assinatura</span>
              </div>
              <div className="flex items-center gap-1">
                {checklist.visto_lideranca ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                <span className="text-xs">Visto</span>
              </div>
            </div>
          </div>

          {/* Inspection Groups */}
          {groupKeys.map(key => {
            const group = checklist[key];
            if (!group || typeof group !== 'object' || Object.keys(group).length === 0) return null;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{groupLabels[key]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {Object.entries(group as Record<string, any>).map(([item, val]) => (
                      <div key={item} className={`flex items-center justify-between p-2 rounded text-sm ${
                        val.status === 'nok' ? 'bg-destructive/5' : ''
                      }`}>
                        <span>{item}</span>
                        <div className="flex items-center gap-2">
                          {val.status === 'ok' && <Badge variant="outline" className="text-success border-success text-xs">OK</Badge>}
                          {val.status === 'nok' && <Badge variant="destructive" className="text-xs">NOK</Badge>}
                          {val.status === 'na' && <Badge variant="secondary" className="text-xs">N/A</Badge>}
                          {val.obs && <span className="text-xs text-muted-foreground">({val.obs})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div>
            <h3 className="text-lg font-semibold mb-4">Imagens</h3>
            <ImageGallery images={checklist.imagens || []} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
