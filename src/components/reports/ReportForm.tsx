import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus } from "lucide-react";

const reportSchema = z.object({
  nome_relatorio: z.string().min(2, "Nome do relatório é obrigatório"),
  tipo_analise: z.enum(["Eficiência de Combustível", "Manutenções", "Custos Operacionais", "Desempenho de Motoristas"]),
  periodo: z.enum(["Diário", "Semanal", "Mensal", "Quinzenal"]),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  filtros: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  onSuccess?: () => void;
}

export function ReportForm({ onSuccess }: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      nome_relatorio: "",
      tipo_analise: "Eficiência de Combustível",
      periodo: "Mensal",
      data_inicio: "",
      data_fim: "",
      filtros: "",
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    try {
      setLoading(true);
      
      const { error } = await (supabase as any)
        .from('Relatorios')
        .insert({
          nome_relatorio: data.nome_relatorio,
          tipo_analise: data.tipo_analise,
          periodo: data.periodo,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
          filtros: data.filtros || null,
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Relatório criado com sucesso.",
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar relatório",
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
          Novo Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Relatório</DialogTitle>
          <DialogDescription>
            Configure um novo relatório personalizado para análise dos dados da frota.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="nome_relatorio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Relatório</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Relatório Mensal de Combustível" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_analise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Análise</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Eficiência de Combustível">Eficiência de Combustível</SelectItem>
                          <SelectItem value="Manutenções">Manutenções</SelectItem>
                          <SelectItem value="Custos Operacionais">Custos Operacionais</SelectItem>
                          <SelectItem value="Desempenho de Motoristas">Desempenho de Motoristas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periodo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Diário">Diário</SelectItem>
                          <SelectItem value="Semanal">Semanal</SelectItem>
                          <SelectItem value="Mensal">Mensal</SelectItem>
                          <SelectItem value="Quinzenal">Quinzenal</SelectItem>
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
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="filtros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filtros Adicionais (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva filtros específicos ou critérios adicionais..."
                        className="resize-none"
                        {...field}
                      />
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
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Criando..." : "Criar Relatório"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}