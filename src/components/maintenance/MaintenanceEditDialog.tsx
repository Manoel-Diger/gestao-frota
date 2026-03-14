import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Manutencao } from "@/hooks/useManutencoes";
import { Loader2 } from "lucide-react";

const editSchema = z.object({
  veiculo_placa: z.string().min(1, "Selecione um veículo"),
  tipo_manutencao: z.string().min(1, "Tipo é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  custo: z.string(),
  descricao: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório"),
  oficina: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface MaintenanceEditDialogProps {
  manutencao: Manutencao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MaintenanceEditDialog({ manutencao, open, onOpenChange, onSuccess }: MaintenanceEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      veiculo_placa: "",
      tipo_manutencao: "Preventiva",
      data: "",
      custo: "0",
      descricao: "",
      status: "Pendente",
      oficina: "",
    },
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await (supabase as any).from("Veiculos").select("placa, marca, modelo").order("placa");
      setVehicles(data || []);
    };

    if (open) {
      fetchVehicles();
      if (manutencao) {
        form.reset({
          veiculo_placa: manutencao.veiculo_placa || "",
          tipo_manutencao: manutencao.tipo_manutencao || "Preventiva",
          data: manutencao.data || "",
          custo: String(manutencao.custo ?? 0),
          descricao: manutencao.descricao || "",
          status: manutencao.status || "Pendente",
          oficina: manutencao.oficina || "",
        });
      }
    }
  }, [open, manutencao, form]);

  const onSubmit = async (values: EditFormData) => {
    if (!manutencao) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("Manutencoes")
        .update({
          veiculo_placa: values.veiculo_placa,
          tipo_manutencao: values.tipo_manutencao,
          data: values.data,
          custo: parseFloat(values.custo) || 0,
          descricao: values.descricao || null,
          status: values.status,
          oficina: values.oficina || null,
        })
        .eq("id", manutencao.id);

      if (error) throw error;

      toast({ title: "Sucesso!", description: "Manutenção atualizada com sucesso." });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar manutenção:", error);
      toast({ title: "Erro", description: "Falha ao atualizar a manutenção.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!manutencao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Manutenção</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="veiculo_placa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veículo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um veículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.placa} value={v.placa}>
                          {v.placa} - {v.marca} {v.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_manutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Preventiva">Preventiva</SelectItem>
                        <SelectItem value="Corretiva">Corretiva</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="oficina"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oficina</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da oficina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva os serviços..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}