import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

// ESQUEMA DE VALIDAÇÃO
const formSchema = z.object({
  veiculo_placa: z.string().min(3, "A placa é obrigatória."),
  tipo_manutencao: z.enum(["Preventiva", "Corretiva", "Preditiva"]),
  data: z.string().min(1, "A data de agendamento é obrigatória."),
  
  // VALIDAÇÃO ZOD: Permite 0, proíbe valores negativos.
  custo: z.coerce.number() 
    .min(0, "O custo não pode ser negativo.") // Permite zero!
    .nullish()
    .transform(val => val === null || val === undefined || isNaN(val as number) ? 0 : val), 

  descricao: z.string().min(5, "A descrição é obrigatória."),
  
  // STATUS: Incluído no formulário para ser editável
  status: z.enum(["Agendada", "Concluída", "Cancelada"]).default("Agendada"),
});

type MaintenanceFormValues = z.infer<typeof formSchema>;

// INTERFACE
interface MaintenanceFormProps {
    onSuccess: () => Promise<void>; 
}

// EXPORTAÇÃO: Mantendo o padrão NOMEADO (export function) para estabilidade
export function MaintenanceForm({ onSuccess }: MaintenanceFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculo_placa: "",
      tipo_manutencao: "Preventiva",
      // Correção: Usar data local correta para o Brasil (hoje: 27/09/2025, 23:31 BRT)
      data: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-'),
      custo: 0, 
      descricao: "",
      status: "Agendada",
    },
  });

  // Reinicia o formulário ao abrir o diálogo
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      form.reset({
        veiculo_placa: "",
        tipo_manutencao: "Preventiva",
        data: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-'),
        custo: 0,
        descricao: "",
        status: "Agendada",
      });
    }
  };

  const onSubmit = async (values: MaintenanceFormValues) => {
    setLoading(true);
    try {
      // Inserir no Supabase
      const { error } = await supabase.from('Manutencoes').insert({
        veiculo_placa: values.veiculo_placa,
        tipo_manutencao: values.tipo_manutencao,
        data: values.data,
        custo: values.custo,
        descricao: values.descricao,
        status: values.status,
      });

      if (error) throw error;

      console.log("Dados de Manutenção enviados:", values);

      // Chama o callback de sucesso (refetch) apenas se o insert for bem-sucedido
      await onSuccess(); 
    } catch (err) {
      console.error("Erro ao registrar manutenção:", err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Nova Manutenção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nova Manutenção</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Placa do Veículo */}
            <FormField
              control={form.control}
              name="veiculo_placa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa do Veículo</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Manutenção */}
            <FormField
              control={form.control}
              name="tipo_manutencao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Preventiva">Preventiva</SelectItem>
                      <SelectItem value="Corretiva">Corretiva</SelectItem>
                      <SelectItem value="Preditiva">Preditiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Agendamento */}
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Agendamento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custo (Permite 0, impede negativo, aceita vazio) */}
            <FormField
              control={form.control}
              name="custo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="0.00 (Deixe em branco ou zero se futuro)" 
                      pattern="[0-9]*[.,]?[0-9]*"
                      inputMode="decimal"
                      value={field.value === 0 || field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(',', '.'); // Normaliza vírgula para ponto
                        const value = rawValue.trim();
                        field.onChange(value === '' ? null : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status da Manutenção */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status da Manutenção" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Agendada">Agendada (A Fazer)</SelectItem>
                      <SelectItem value="Concluída">Concluída (Finalizada)</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição/Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Troca de óleo, filtro, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registrando..." : "Registrar Manutenção"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full">
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}