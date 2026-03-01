import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Abastecimento } from "@/hooks/useAbastecimentos";

interface FuelViewDialogProps {
  abastecimento: Abastecimento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FuelViewDialog({ abastecimento, open, onOpenChange }: FuelViewDialogProps) {
  if (!abastecimento) return null;

  const custoTotal = Number(abastecimento.custo_total) || 0;
  const litros = Number(abastecimento.litros) || 0;
  const precoLitro = litros > 0 ? custoTotal / litros : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Abastecimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Placa do Veículo</p>
              <p className="text-lg font-semibold">{abastecimento.veiculo_placa || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data</p>
              <p className="text-lg font-semibold">
                {abastecimento.data
                  ? new Date(abastecimento.data + 'T12:00:00').toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Litros</p>
              <p className="text-lg font-semibold">{litros.toFixed(1)}L</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quilometragem</p>
              <p className="text-lg font-semibold">
                {Number(abastecimento.quilometragem)?.toLocaleString('pt-BR') || '-'} km
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
              <p className="text-lg font-semibold text-success">R$ {custoTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Preço por Litro</p>
              <p className="text-lg font-semibold">R$ {precoLitro.toFixed(2)}</p>
            </div>
          </div>

          {abastecimento.motorista_nome && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Motorista</p>
              <p className="text-lg font-semibold">{abastecimento.motorista_nome}</p>
            </div>
          )}

          {abastecimento.posto && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Posto</p>
              <p className="text-lg font-semibold">{abastecimento.posto}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">Registrado em</p>
            <p className="text-sm">
              {new Date(abastecimento.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
