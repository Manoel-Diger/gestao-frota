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
import { Tables } from "@/integrations/supabase/types";

type Veiculo = Tables<"Veiculos">;
type Motorista = Tables<"Motoristas">;

const vehicleSchema = z.object({
  placa: z.string().min(7, "Placa deve ter pelo menos 7 caracteres").max(8, "Placa deve ter no máximo 8 caracteres"),
  marca: z.string().min(2, "Marca é obrigatória"),
  modelo: z.string().min(2, "Modelo é obrigatório"),
  ano: z.number().min(1990, "Ano deve ser maior que 1990").max(new Date().getFullYear() + 1, "Ano inválido"),
  status: z.enum(["Ativo", "Em Manutenção", "Inativo", "Em uso", "Disponível"]),
  quilometragem: z.number().min(0, "Quilometragem deve ser positiva"),
  tipo_combustivel: z.enum(["Gasolina", "Etanol", "Diesel", "Flex"]),
  proxima_manutencao: z.string().min(1, "Data da próxima manutenção é obrigatória"),
  localizacao: z.string().min(2, "Localização é obrigatória"),
  combustivel_atual: z.number().min(0, "Nível de combustível deve ser entre 0 e 100").max(100, "Nível de combustível deve ser entre 0 e 100"),
  motorista_id: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleEditDialogProps {
  veiculo: Veiculo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function VehicleEditDialog({ veiculo, open, onOpenChange, onSuccess }: VehicleEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [motoristas, setMotoristas] = useState<{ id: string; nome: string }[]>([]);
  const { toast } = useToast();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      placa: "",
      marca: "",
      modelo: "",
      ano: new Date().getFullYear(),
      status: "Ativo",
      quilometragem: 0,
      tipo_combustivel: "Flex",
      proxima_manutencao: "",
      localizacao: "",
      combustivel_atual: 100,
      motorista_id: "none",
    },
  });

  useEffect(() => {
    if (open) {
      const fetchMotoristas = async () => {
        try {
          const { data, error } = await supabase
            .from("Motoristas")
            .select("id, nome")
            .order("nome", { ascending: true });

          if (error) throw error;

          if (data) {
            setMotoristas(data.map((m) => ({ id: String(m.id), nome: m.nome || "Sem nome" })));
          }
        } catch (err) {
          console.error("Erro ao carregar motoristas:", err);
          toast({
            title: "Aviso",
            description: "Não foi possível carregar a lista de motoristas",
            variant: "destructive",
          });
        }
      };

      fetchMotoristas();
    }
  }, [open, toast]);

  useEffect(() => {
    if (veiculo && open) {
      form.reset({
        placa: veiculo.placa || "",
        marca: veiculo.marca || "",
        modelo: veiculo.modelo || "",
        ano: veiculo.ano || new Date().getFullYear(),
        status: (veiculo.status as any) || "Ativo",
        quilometragem: veiculo.quilometragem || 0,
        tipo_combustivel: (veiculo.tipo_combustivel as any) || "Flex",
        proxima_manutencao: veiculo.proxima_manutencao || "",
        localizacao: veiculo.localizacao || "",
        combustivel_atual: veiculo.combustivel_atual || 100,
        motorista_id: veiculo.motorista_id ? String(veiculo.motorista_id) : "none",
      });
    }
  }, [veiculo, open, form]);

  const onSubmit = async (data: VehicleFormData) => {
    if (!veiculo) return;

    try {
      setLoading(true);

      const updateData = {
        placa: data.placa.toUpperCase(),
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        status: data.status,
        quilometragem: data.quilometragem,
        tipo_combustivel: data.tipo_combustivel,
        proxima_manutencao: data.proxima_manutencao,
        localizacao: data.localizacao,
        combustivel_atual: data.combustivel_atual,
        motorista_id: data.motorista_id && data.motorista_id !== "none" ? Number(data.motorista_id) : null,
      };

      const { error } = await supabase
        .from("Veiculos")
        .update(updateData)
        .eq("id", veiculo.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Veículo atualizado com sucesso.",
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao atualizar veículo:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar veículo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Veículo</DialogTitle>
          <DialogDescription>Atualize os dados do veículo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-1234"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Mercedes-Benz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Actros" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
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
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Em uso">Em uso</SelectItem>
                        <SelectItem value="Disponível">Disponível</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem motorista</SelectItem>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id}>
                            {motorista.nome}
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
                name="tipo_combustivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Combustível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o combustível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gasolina">Gasolina</SelectItem>
                        <SelectItem value="Etanol">Etanol</SelectItem>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                        <SelectItem value="Flex">Flex</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input
                        type="number"
                        placeholder="15000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="combustivel_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Combustível (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proxima_manutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Manutenção</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="localizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo - SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}