import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

type Abastecimento = Tables<'Abastecimentos'>;

const fuelEditSchema = z.object({
  veiculo_placa: z.string().min(1, "Selecione um veículo"),
  data: z.string().min(1, "Data é obrigatória"),
  litros: z.string().min(1, "Litros é obrigatório"),
  quilometragem: z.string().min(1, "Quilometragem é obrigatória"),
  custo_total: z.string().min(1, "Custo total é obrigatório"),
});

type FuelEditFormData = z.infer<typeof fuelEditSchema>;

interface FuelEditDialogProps {
  abastecimento: Abastecimento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FuelEditDialog({ abastecimento, open, onOpenChange, onSuccess }: FuelEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const form = useForm<FuelEditFormData>({
    resolver: zodResolver(fuelEditSchema),
    defaultValues: {
      veiculo_placa: "",
      data: "",
      litros: "",
      quilometragem: "",
      custo_total: "",
    },
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await supabase.from("Veiculos").select("placa");
      setVehicles(data || []);
    };

    if (open) {
      fetchVehicles();
      if (abastecimento) {
        form.reset({
          veiculo_placa: abastecimento.veiculo_placa || "",
          data: abastecimento.data || "",
          litros: String(abastecimento.litros || ""),
          quilometragem: String(abastecimento.quilometragem || ""),
          custo_total: String(abastecimento.custo_total || ""),
        });
      }
    }
  }, [open, abastecimento, form]);

  const onSubmit = async (values: FuelEditFormData) => {
    if (!abastecimento) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("Abastecimentos")
        .update({
          veiculo_placa: values.veiculo_placa,
          data: values.data,
          litros: parseFloat(values.litros),
          quilometragem: parseInt(values.quilometragem),
          custo_total: parseFloat(values.custo_total),
        })
        .eq("id", abastecimento.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Abastecimento atualizado com sucesso.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar abastecimento:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar o abastecimento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!abastecimento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Abastecimento</DialogTitle>
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
                      {vehicles.map((veiculo) => (
                        <SelectItem key={veiculo.placa} value={veiculo.placa}>
                          {veiculo.placa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="litros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quilometragem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quilometragem</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="custo_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo Total (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
