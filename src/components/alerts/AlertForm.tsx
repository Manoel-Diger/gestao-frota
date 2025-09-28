import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { useVeiculos } from "@/hooks/useVeiculos";
import { useMotoristas } from "@/hooks/useMotoristas";
import { Plus } from "lucide-react";

const alertSchema = z.object({
  tipo_alerta: z.enum(["Manutenção Vencida", "CNH Vencendo", "Combustível Baixo", "Comportamento"]),
  veiculo: z.string().optional(),
  motorista: z.string().optional(),
  prioridade: z.enum(["Baixa", "Média", "Alta"]),
  descricao: z.string().min(5, "Descrição é obrigatória"),
  ativo: z.enum(["Sim", "Não"]),
});

type AlertFormData = z.infer<typeof alertSchema>;

interface AlertFormProps {
  onSuccess?: () => void;
}

export function AlertForm({ onSuccess }: AlertFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();

  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      tipo_alerta: "Manutenção Vencida",
      veiculo: "",
      motorista: "",
      prioridade: "Média",
      descricao: "",
      ativo: "Sim",
    },
  });

  const onSubmit = async (data: AlertFormData) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .rpc('insert_alerta', {
          p_tipo_alerta: data.tipo_alerta,
          p_veiculo: data.veiculo || null,
          p_motorista: data.motorista || null,
          p_prioridade: data.prioridade,
          p_descricao: data.descricao,
          p_ativo: data.ativo === "Sim",
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Alerta configurado com sucesso.",
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao configurar alerta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:bg-primary-hover w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Alerta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Novo Alerta</DialogTitle>
          <DialogDescription>
            Configure um novo alerta para monitoramento da frota.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_alerta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Alerta</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manutenção Vencida">Manutenção Vencida</SelectItem>
                          <SelectItem value="CNH Vencendo">CNH Vencendo</SelectItem>
                          <SelectItem value="Combustível Baixo">Combustível Baixo</SelectItem>
                          <SelectItem value="Comportamento">Comportamento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="veiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {veiculos.map((veiculo) => (
                            <SelectItem key={veiculo.id} value={veiculo.placa || ''}>
                              {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
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
                  name="motorista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motorista (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um motorista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {motoristas.map((motorista) => (
                            <SelectItem key={motorista.id} value={motorista.nome || ''}>
                              {motorista.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva as condições do alerta..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sim">Ativo</SelectItem>
                        <SelectItem value="Não">Inativo</SelectItem>
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
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Configurando..." : "Configurar Alerta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}