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
import { TablesUpdate } from "@/integrations/supabase/types";

// --- Tipagem corrigida e alinhada ao banco ---
type VeiculosUpdatePayload = TablesUpdate<"Veiculos"> & {
  motorista?: string | null;
};

interface VehiclePlateResult {
  placa: string;
}

interface MotoristaData {
  id?: number;
  categoria_cnh: "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE";
  cnh_numero: string;
  cnh_validade: string;
  created_at?: string;
  email: string;
  nome: string;
  status: "Ativo" | "Inativo";
  telefone: string;
  placa?: string | null;
}

// --- Schema de validação ---
const driverSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  categoria_cnh: z.enum(["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"]),
  cnh_numero: z.string().min(5, "Número da CNH é obrigatório"),
  cnh_validade: z.string().min(1, "Data de validade é obrigatória"),
  status: z.enum(["Ativo", "Inativo"]),
  placa: z.string().optional().or(z.literal("")).transform(e => e === "" ? null : e),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface DriverFormProps {
  onSuccess?: () => void;
  motorista?: MotoristaData;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function DriverForm({ onSuccess, motorista, isOpen, setIsOpen }: DriverFormProps) {
  const [loading, setLoading] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<string[]>([]);
  const { toast } = useToast();

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

  // 🔹 Carregar placas de veículos disponíveis
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("Veiculos")
        .select("placa") as { data: VehiclePlateResult[] | null; error: any };

      if (error) {
        console.error("Erro ao buscar veículos:", error);
      } else if (data) {
        const plates = data.map((v) => v.placa);
        setAvailableVehicles(plates.filter((p): p is string => p !== null));
      }
    };
    fetchVehicles();
  }, []);

  const onSubmit = async (formData: DriverFormData) => {
    try {
      setLoading(true);
      const novaPlaca = formData.placa;
      const oldPlaca = motorista?.placa || null;

      // 🔸 Validação: a placa deve existir no cadastro de veículos
      if (novaPlaca && !availableVehicles.includes(novaPlaca)) {
        toast({
          title: "Erro de Validação",
          description: "A placa informada não existe no cadastro de veículos.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (motorista?.id) {
        // --- MODO EDIÇÃO ---
        const { error: motorError } = await supabase
          .from("Motoristas")
          .update({
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            categoria_cnh: formData.categoria_cnh,
            cnh_numero: formData.cnh_numero,
            cnh_validade: formData.cnh_validade,
            status: formData.status,
            placa: novaPlaca,
          })
          .eq("id", motorista.id);

        if (motorError) {
          throw new Error(`Erro ao atualizar motorista: ${motorError.message}`);
        }

        // --- SINCRONIZAÇÃO COM VEÍCULOS ---

        // A) Desassocia veículo antigo, se necessário
        if (oldPlaca && oldPlaca !== novaPlaca) {
          const { error: desassocError } = await supabase
            .from("Veiculos")
            .update({ motorista: null } as VeiculosUpdatePayload)
            .eq("placa", oldPlaca);

          if (desassocError) {
            console.error("Erro ao desassociar veículo antigo:", desassocError);
          }
        }

        // B) Associa novo veículo, se necessário
        if (novaPlaca) {
          const { error: assocError } = await supabase
            .from("Veiculos")
            .update({ motorista: formData.nome } as VeiculosUpdatePayload)
            .eq("placa", novaPlaca);

          if (assocError) {
            throw new Error(`Erro ao associar veículo: ${assocError.message}`);
          }
        }

        toast({
          title: "Sucesso!",
          description: "Motorista atualizado e veículo sincronizado com sucesso.",
        });

      } else {
        // --- MODO CRIAÇÃO ---
        const { error: motorError } = await supabase.from("Motoristas").insert([
          {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            categoria_cnh: formData.categoria_cnh,
            cnh_numero: formData.cnh_numero,
            cnh_validade: formData.cnh_validade,
            status: formData.status,
            placa: novaPlaca,
          },
        ]);

        if (motorError) {
          throw new Error(`Erro ao cadastrar motorista: ${motorError.message}`);
        }

        // Se houver placa, associa o veículo ao novo motorista
        if (novaPlaca) {
          const { error: assocError } = await supabase
            .from("Veiculos")
            .update({ motorista: formData.nome } as VeiculosUpdatePayload)
            .eq("placa", novaPlaca);

          if (assocError) {
            throw new Error(`Erro ao sincronizar veículo: ${assocError.message}`);
          }
        }

        toast({
          title: "Sucesso!",
          description: "Motorista cadastrado e veículo sincronizado com sucesso.",
        });
      }

      form.reset();
      setIsOpen(false);
      onSuccess?.();

    } catch (error) {
      toast({
        title: "Erro Fatal na Transação",
        description: error instanceof Error ? error.message : "Erro desconhecido ao processar a solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:bg-primary-hover w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {motorista ? "Editar Motorista" : "Novo Motorista"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{motorista ? "Editar Motorista" : "Cadastrar Novo Motorista"}</DialogTitle>
          <DialogDescription>
            {motorista
              ? "Atualize os dados do motorista."
              : "Preencha os dados para adicionar um novo motorista."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
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
                      <Input type="email" placeholder="joao@exemplo.com" {...field} />
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
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa do Veículo</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"].map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
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
                name="cnh_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da CNH</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnh_validade"
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
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
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Salvando..." : motorista ? "Atualizar Motorista" : "Salvar Motorista"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
