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

// Definição de tipos preservada
interface MotoristaData {
  id?: number;
  categoria_cnh: "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE";
  cnh_numero: string;
  cnh_validade: string;
  email: string;
  nome: string;
  status: "Ativo" | "Inativo";
  telefone: string;
  placa?: string | null;
}

const driverSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone é obrigatório"),
  categoria_cnh: z.string().min(1, "Selecione a categoria"),
  cnh_numero: z.string().optional(),
  cnh_validade: z.string().min(1, "Data de validade é obrigatória"),
  status: z.enum(["Ativo", "Inativo"]),
  placa: z.string().optional().nullable().transform(v => v === "none" || v === "" ? null : v),
});

type DriverFormData = z.infer<typeof driverSchema>;

export function DriverForm({ onSuccess, motorista, isOpen: externalIsOpen, setIsOpen: setExternalIsOpen }: any) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<string[]>([]);
  const { toast } = useToast();

  // Gerencia se o diálogo é controlado interna ou externamente (para o botão "Editar")
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = setExternalIsOpen !== undefined ? setExternalIsOpen : setInternalIsOpen;

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      nome: motorista?.nome || "",
      email: motorista?.email || "",
      telefone: motorista?.telefone || "",
      categoria_cnh: motorista?.categoria_cnh || "B",
      cnh_numero: motorista?.cnh_numero || "",
      cnh_validade: motorista?.cnh_validade || "",
      status: motorista?.status || "Ativo",
      placa: motorista?.placa || null,
    },
  });

  // Busca as placas na tabela 'Veiculos'
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await supabase.from("Veiculos").select("placa");
      if (data) setAvailableVehicles(data.map(v => v.placa));
    };
    fetchVehicles();
  }, []);

  const onSubmit = async (formData: DriverFormData) => {
    try {
      setLoading(true);
      
      const motoristaPayload = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        status: formData.status,
        categoria_cnh: formData.categoria_cnh,
        validade_cnh: formData.cnh_validade, // CORREÇÃO: usar validade_cnh (minúsculo)
        placa: formData.placa,
      };

      // Guardar placa anterior para limpar depois
      const placaAnterior = motorista?.placa;

      if (motorista?.id) {
        const { error } = await supabase.from("Motoristas").update(motoristaPayload).eq("id", motorista.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("Motoristas").insert([motoristaPayload]);
        if (error) throw error;
      }

      // CORREÇÃO 1: Limpar veículo anterior se mudou
      if (placaAnterior && placaAnterior !== formData.placa) {
        await supabase
          .from("Veiculos")
          .update({ motorista: null })
          .eq("placa", placaAnterior);
      }

      // CORREÇÃO 2: Atualizar novo veículo
      if (formData.placa) {
        const { error: updateError } = await supabase
          .from("Veiculos")
          .update({ motorista: formData.nome }) 
          .eq("placa", formData.placa);
        
        if (updateError) throw updateError;
      }

      toast({ title: "Sucesso!", description: "Dados salvos com sucesso." });
      setIsOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* O botão "Novo Motorista" agora faz parte do componente */}
      {!motorista && (
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Motorista
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{motorista ? "Editar Motorista" : "Cadastrar Novo Motorista"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="placa" render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa do Veículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {availableVehicles.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="categoria_cnh" render={({ field }) => (
                <FormItem><FormLabel>Categoria CNH</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="cnh_numero" render={({ field }) => (
                <FormItem><FormLabel>Número da CNH (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="cnh_validade" render={({ field }) => (
                <FormItem><FormLabel>Validade da CNH</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Motorista"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}