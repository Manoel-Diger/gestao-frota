import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const fuelSchema = z.object({
  veiculo_placa: z.string().min(1, "Veículo é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  litros: z.number().min(0.1, "Litros deve ser maior que 0"),
  quilometragem: z.number().min(0, "Quilometragem deve ser positiva"),
  custo_total: z.number().min(0.01, "Custo total deve ser maior que 0"),
});

type FuelFormData = z.infer<typeof fuelSchema>;

interface FuelFormProps {
  onSuccess?: () => void;
}

export function FuelForm({ onSuccess }: FuelFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      veiculo_placa: "",
      data: new Date().toISOString().split('T')[0],
      litros: 0,
      quilometragem: 0,
      custo_total: 0,
    },
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await supabase
        .from('Veiculos')
        .select('placa, marca, modelo, quilometragem')
        .order('placa');
      
      if (data) setVehicles(data);
    };

    if (open) fetchVehicles();
  }, [open]);

  const onSubmit = async (data: FuelFormData) => {
    try {
      setLoading(true);
      
      // 1. Insere o registro de abastecimento
      const { error: fuelError } = await supabase
        .from('Abastecimentos')
        .insert([{
          veiculo_placa: data.veiculo_placa,
          data: data.data,
          litros: data.litros,
          quilometragem: data.quilometragem,
          custo_total: data.custo_total,
        }]);

      if (fuelError) throw fuelError;

      // 2. CORREÇÃO: Atualiza a quilometragem atual do veículo
      const { error: vehicleError } = await supabase
        .from('Veiculos')
        .update({ 
          quilometragem: data.quilometragem,
          combustivel_atual: 100 // Assume tanque cheio ao abastecer
        })
        .eq('placa', data.veiculo_placa);

      if (vehicleError) throw vehicleError;

      toast({
        title: "Sucesso!",
        description: "Abastecimento registrado e odômetro do veículo atualizado.",
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar abastecimento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Abastecimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Abastecimento</DialogTitle>
          <DialogDescription>
            Registre o abastecimento e atualize a quilometragem do veículo automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="veiculo_placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.placa} value={v.placa}>
                            {v.placa} - {v.marca} (KM atual: {v.quilometragem})
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
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="litros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Litros</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
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
                    <FormLabel>Nova Quilometragem (KM)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custo_total"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Custo Total (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Registrar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}