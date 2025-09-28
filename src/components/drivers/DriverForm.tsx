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

// 1. IMPORTAÇÃO DO SEU ARQUIVO DE TIPOS (MANTENDO A CORREÇÃO DE TIPAGEM)
import { TablesUpdate } from "@/integrations/supabase/types"; 

// --- TIPAGEM FINAL CORRIGIDA PARA RESOLVER ts(2559) ---

// O tipo TablesUpdate<'Veiculos'> é usado, e adicionamos 'motorista'
// para contornar o tipo incompleto gerado pelo Supabase.
type VeiculosUpdatePayload = TablesUpdate<'Veiculos'> & {
    motorista?: string | null;
}

// Definir o tipo 'Veiculos' para a consulta
interface VehiclePlateResult {
    placa: string;
}

// --- FIM DA CORREÇÃO DE TIPAGEM ---


// Definição da interface alinhada com MotoristaData
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

const driverSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  categoria_cnh: z.enum(["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"]),
  cnh_numero: z.string().min(5, "Número da CNH é obrigatório"),
  cnh_validade: z.string().min(1, "Data de validade é obrigatória"),
  status: z.enum(["Ativo", "Inativo"]),
  // Placa: Garante que "" é transformado em null antes de ser enviado para o banco
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
      placa: motorista?.placa || null, // Garante que o valor inicial é null se não houver placa
    },
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from('Veiculos')
        .select('placa') as { data: VehiclePlateResult[] | null, error: any };

      if (error) {
        console.error("Error fetching vehicles:", error);
      } else if (data) {
        const plates = data.map(v => v.placa);
        // Filtra nulls para garantir que apenas placas válidas estejam na lista
        setAvailableVehicles(plates.filter((p): p is string => p !== null)); 
      }
    };
    fetchVehicles();
  }, []);

  const onSubmit = async (formData: DriverFormData) => {
    try {
      setLoading(true);

      const novaPlaca = formData.placa;

      // Validação da Nova Placa: Se uma placa foi fornecida (não null), ela deve ser válida.
      if (novaPlaca && !availableVehicles.includes(novaPlaca)) {
        toast({
          title: "Erro de Validação",
          description: "A placa inserida não existe no cadastro de veículos ou está incorreta.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Garante que oldPlaca seja null se não estiver definida, para evitar bugs lógicos.
      const oldPlaca = motorista?.placa || null; 

      if (motorista?.id) {
        // --- MODO EDIÇÃO ---
        
        // 1. Atualiza Motoristas
        const { error: motorError } = await supabase
          .from('Motoristas')
          .update({
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            categoria_cnh: formData.categoria_cnh,
            cnh_numero: formData.cnh_numero,
            cnh_validade: formData.cnh_validade,
            status: formData.status,
            placa: novaPlaca, // Pode ser uma string ou null
          })
          .eq('id', motorista.id);

        if (motorError) {
          // *** REFORÇO DE LOG PARA CAPTURAR FALHAS SILENCIOSAS (RLS/Permissões) ***
          console.error("ERRO CRÍTICO: Falha na atualização do Motorista:", motorError);
          // ********************************************************************

          if (motorError.code === '23505') {
            toast({
              title: "Erro de Cadastro",
              description: "Esta placa já está associada a outro motorista (verifique restrições UNIQUE).",
              variant: "destructive",
            });
          } else {
            // Em caso de erro, lança a mensagem completa para o toast
            throw new Error(`Erro no banco de dados: ${motorError.message}`);
          }
          setLoading(false);
          return;
        }

        // 2. SINCRONIZAÇÃO DA TABELA VEICULOS (LÓGICA CORRIGIDA)
        
        // A) DESASSOCIAÇÃO: Se existia uma placa antiga E ela é diferente da nova
        if (oldPlaca && oldPlaca !== novaPlaca) {
            // Desassocia a placa antiga (motorista = null)
            const { error: desassociarError } = await supabase
              .from('Veiculos')
              .update({ motorista: null } as VeiculosUpdatePayload) 
              .eq('placa', oldPlaca);

            if (desassociarError) {
              console.error("Erro ao desassociar placa antiga:", desassociarError);
              // Não lança erro fatal, pois o motorista principal já foi atualizado
            }
        }

        // B) ASSOCIAÇÃO: Se existe uma nova placa E ela é diferente da antiga
        if (novaPlaca && novaPlaca !== oldPlaca) {
            // Associa a nova placa (motorista = nome)
            const { error: associarError } = await supabase
              .from('Veiculos')
              .update({ motorista: formData.nome } as VeiculosUpdatePayload)
              .eq('placa', novaPlaca);

            if (associarError) {
              console.error("Erro ao associar nova placa:", associarError);
              throw new Error(`Erro ao sincronizar veículo: ${associarError.message}`);
            }
        }

        toast({
          title: "Sucesso!",
          description: "Motorista atualizado e veículo sincronizado com sucesso.",
        });

      } else {
        // --- MODO CRIAÇÃO ---

        // 1. Insere em Motoristas
        const { error: motorError } = await supabase
          .from('Motoristas')
          .insert([
            {
              nome: formData.nome,
              email: formData.email,
              telefone: formData.telefone,
              categoria_cnh: formData.categoria_cnh,
              cnh_numero: formData.cnh_numero,
              cnh_validade: formData.cnh_validade,
              status: formData.status,
              placa: novaPlaca,
            }
          ]);

        if (motorError) {
          // Em caso de erro, lança a mensagem completa para o toast
          if (motorError.code === '23505') {
            toast({
              title: "Erro de Cadastro",
              description: "Esta placa já está associada a outro motorista (verifique restrições UNIQUE).",
              variant: "destructive",
            });
          } else {
            throw new Error(`Erro no banco de dados: ${motorError.message}`);
          }
          setLoading(false);
          return;
        }

        // 2. Sincroniza Veiculos para nova associação (se houver placa)
        if (novaPlaca) {
          const { error: veiculoError } = await supabase
            .from('Veiculos')
            .update({ motorista: formData.nome } as VeiculosUpdatePayload)
            .eq('placa', novaPlaca);

          if (veiculoError) {
            throw new Error(`Erro ao sincronizar veículo: ${veiculoError.message}`);
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
            {motorista ? "Atualize os dados do motorista." : "Preencha os dados do motorista para adicioná-lo à equipe."}
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
                        <SelectItem value="A">A - Motocicletas</SelectItem>
                        <SelectItem value="B">B - Automóveis</SelectItem>
                        <SelectItem value="C">C - Caminhões leves</SelectItem>
                        <SelectItem value="D">D - Transporte coletivo</SelectItem>
                        <SelectItem value="E">E - Caminhões pesados</SelectItem>
                        <SelectItem value="AB">AB - A + B</SelectItem>
                        <SelectItem value="AC">AC - A + C</SelectItem>
                        <SelectItem value="AD">AD - A + D</SelectItem>
                        <SelectItem value="AE">AE - A + E</SelectItem>
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