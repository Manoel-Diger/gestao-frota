import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Motorista } from "@/hooks/useMotoristas";

interface DriverViewDialogProps {
  motorista: Motorista | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverViewDialog({ motorista, open, onOpenChange }: DriverViewDialogProps) {
  if (!motorista) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Motorista</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-lg font-semibold">{motorista.nome || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">{motorista.status || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg font-semibold break-all">{motorista.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-lg font-semibold">{motorista.telefone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categoria CNH</p>
              <p className="text-lg font-semibold">{motorista.categoria_cnh || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validade CNH</p>
              <p className="text-lg font-semibold">
                {motorista.validade_cnh
                  ? new Date(motorista.validade_cnh + "T12:00:00").toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Veículo Atual (Placa)</p>
              <p className="text-lg font-semibold">{motorista.placa || "Não designado"}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Cadastrado em</p>
            <p className="text-sm">{new Date(motorista.created_at).toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}