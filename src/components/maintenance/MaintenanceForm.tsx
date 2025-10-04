import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Wrench, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useManutencoes } from "@/hooks/useManutencoes";
import { Tables } from "@/integrations/supabase/types";

type Manutencao = Tables<'Manutencoes'>;

const formSchema = z.object({
  veiculo_placa: z.string().min(3, "A placa é obrigatória."),
  tipo_manutencao: z.enum(["Preventiva", "Corretiva", "Preditiva"]),
  data: z.string().min(1, "A data de agendamento é obrigatória."),
  custo: z.number().min(0, "O custo não pode ser negativo.").default(0),
  descricao: z.string().min(5, "A descrição é obrigatória."),
  status: z.enum(["Agendada", "Concluída", "Cancelada"]).default("Agendada"),
});

type MaintenanceFormValues = z.infer<typeof formSchema>;

interface MaintenanceFormProps {
  onSuccess: () => Promise<void>;
  initialData?: Manutencao | null;
  mode?: 'create' | 'edit';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MaintenanceForm({ 
  onSuccess, 
  initialData = null,
  mode: propMode,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: MaintenanceFormProps) {
  const { createManutencao, updateManutencao } = useManutencoes();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const mode = propMode || (initialData ? 'edit' : 'create');
  const isEditMode = mode === 'edit';

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculo_placa: "",
      tipo_manutencao: "Preventiva",
      data: new Date().toISOString().split('T')[0],
      custo: 0,
      descricao: "",
      status: "Agendada",
    },
  });

  useEffect(() => {
    if (initialData && isEditMode) {
      const custoValue = typeof initialData.custo === 'number' 
        ? initialData.custo 
        : parseFloat(String(initialData.custo || 0));

      form.reset({
        veiculo_placa: initialData.veiculo_placa || "",
        tipo_manutencao: (initialData.tipo_manutencao as "Preventiva" | "Corretiva" | "Preditiva") || "Preventiva",
        data: initialData.data || new Date().toISOString().split('T')[0],
        custo: custoValue,
        descricao: initialData.descricao || "",
        status: ((initialData as any).status as "Agendada" | "Concluída" | "Cancelada") || "Agendada",
      });
    }
  }, [initialData, isEditMode, form]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !isEditMode) {
      form.reset({
        veiculo_placa: "",
        tipo_manutencao: "Preventiva",
        data: new Date().toISOString().split('T')[0],
        custo: 0,
        descricao: "",
        status: "Agendada",
      });
    }
  };

  const onSubmit = async (values: MaintenanceFormValues) => {
    setLoading(true);
    try {
      if (isEditMode && initialData) {
        const result = await updateManutencao(initialData.id, {
          veiculo_placa: values.veiculo_placa,
          tipo_manutencao: values.tipo_manutencao,
          data: values.data,
          custo: values.custo,
          descricao: values.descricao,
          status: values.status,
        });

        if (!result) throw new Error('Falha ao atualizar manutenção');
      } else {
        const result = await createManutencao({
          veiculo_placa: values.veiculo_placa,
          tipo_manutencao: values.tipo_manutencao,
          data: values.data,
          custo: values.custo,
          descricao: values.descricao,
          status: values.status,
        });

        if (!result) throw new Error('Falha ao criar manutenção');
      }

      await onSuccess();
      setOpen(false);
    } catch (err) {
      console.error("Erro ao salvar manutenção:", err);
      alert("Erro ao salvar manutenção. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluída":
        return <Badge className="bg-emerald-500 text-white border-0">Concluída</Badge>;
      case "Cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "Agendada":
        return <Badge className="bg-amber-500 text-white border-0">Agendada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />
            Nova Manutenção
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wrench className="mr-2 h-5 w-5" />
            {isEditMode ? "Editar Manutenção" : "Registrar Nova Manutenção"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Atualize os dados da manutenção abaixo." 
              : "Preencha os dados para registrar uma nova manutenção."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden space-y-6">
            <ScrollArea className="flex-1 px-1 pr-4">
              
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <FormField
                    control={form.control}
                    name="veiculo_placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa do Veículo *</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC-1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo_manutencao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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

                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Agendamento *</FormLabel>
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
                        <FormLabel>Custo (R$) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </CardContent>
              </Card>

              {/* Status e Detalhes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status e Detalhes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status da Manutenção *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status da Manutenção" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Agendada">
                              <div className="flex items-center">
                                <span className="mr-2">🟡</span> Agendada (A Fazer)
                              </div>
                            </SelectItem>
                            <SelectItem value="Concluída">
                              <div className="flex items-center">
                                <span className="mr-2">🟢</span> Concluída (Finalizada)
                              </div>
                            </SelectItem>
                            <SelectItem value="Cancelada">
                              <div className="flex items-center">
                                <span className="mr-2">🔴</span> Cancelada
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="mt-2">
                          {getStatusBadge(field.value)}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição / Observações *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva os serviços realizados ou necessários (ex: Troca de óleo, filtro, revisão de freios...)" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </CardContent>
              </Card>

            </ScrollArea>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? "Salvando..." : "Registrando..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? "Salvar Alterações" : "Registrar Manutenção"}
                  </>
                )}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}