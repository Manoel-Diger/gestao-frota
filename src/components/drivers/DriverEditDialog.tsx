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
import { Motorista } from "@/hooks/useMotoristas";

const driverEditSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  categoria_cnh: z.string().min(1, "Categoria obrigatória"),
  validade_cnh: z.string().optional(),
  status: z.string().min(1, "Status obrigatório"),
  placa: z.string().optional(),
});

type DriverEditData = z.infer<typeof driverEditSchema>;

interface DriverEditDialogProps {
  motorista: Motorista | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DriverEditDialog({ motorista, open, onOpenChange, onSuccess }: DriverEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<DriverEditData>({
    resolver: zodResolver(driverEditSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      categoria_cnh: "B",
      validade_cnh: "",
      status: "Ativo",
      placa: "",
    },
  });

  useEffect(() => {
    if (open && motorista) {
      form.reset({
        nome: motorista.nome || "",
        email: motorista.email || "",
        telefone: motorista.telefone || "",
        categoria_cnh: motorista.categoria_cnh || "B",
        validade_cnh: motorista.validade_cnh || "",
        status: motorista.status || "Ativo",
        placa: motorista.placa || "none",
      });
    }
  }, [open, motorista, form]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await (supabase as any)
        .from("Veiculos")
        .select("placa, marca, modelo")
        .order("placa");
      if (data) setVehicles(data);
    };
    if (open) fetchVehicles();
  }, [open]);

  const onSubmit = async (data: DriverEditData) => {
    if (!motorista) return;
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from("Motoristas")
        .update({
          nome: data.nome,
          email: data.email || null,
          telefone: data.telefone,
          categoria_cnh: data.categoria_cnh,
          validade_cnh: data.validade_cnh || null,
          status: data.status,
          placa: data.placa && data.placa !== "none" ? data.placa : null,
        })
        .eq("id", motorista.id);

      if (error) throw error;

      toast({ title: "Sucesso!", description: "Motorista atualizado com sucesso." });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar motorista",
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
          <DialogTitle>Editar Motorista</DialogTitle>
          <DialogDescription>Atualize os dados do motorista.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoria_cnh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria CNH</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
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
                name="validade_cnh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade da CNH</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Veículo Atual</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {vehicles.filter((v) => v.placa).map((v) => (
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