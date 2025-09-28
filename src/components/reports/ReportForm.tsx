import React, { useState, useEffect } from 'react';
import { useForm, Control, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Componentes da UI (simulados do shadcn/ui)
interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
    className?: string;
}

interface ButtonProps extends ComponentProps {
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    size?: 'default' | 'sm' | 'lg' | 'icon' | null | undefined;
}

const Card = ({ children, className, ...props }: ComponentProps) => <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props}>{children}</div>;
const CardHeader = ({ children, className }: ComponentProps) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className }: ComponentProps) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className }: ComponentProps) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Button = ({ children, className, size, ...props }: ButtonProps) => {
    let sizeClass = 'h-9 px-4 py-2';
    switch (size) {
        case 'sm': sizeClass = 'h-8 px-3'; break;
        case 'lg': sizeClass = 'h-10 px-8'; break;
        case 'icon': sizeClass = 'h-9 w-9'; break;
    }
    return <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${sizeClass} ${className}`} {...props}>{children}</button>;
};
const DialogHeader = ({ children }: ComponentProps) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
const DialogTitle = ({ children }: ComponentProps) => <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
const DialogDescription = ({ children }: ComponentProps) => <p className="text-sm text-muted-foreground">{children}</p>;
const Form = ({ children, ...props }: ComponentProps & { onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void }) => <form {...props}>{children}</form>;
const FormField = ({ control, name, render }: { control: Control<any>, name: string, render: (props: any) => React.ReactNode }) => {
    const { getFieldState } = control as unknown as UseFormReturn<any>;
    const fieldState = getFieldState(name);
    return <>{render({ field: { name, onChange: () => {}, value: "" }, fieldState })}</>;
};
const FormItem = ({ children, ...props }: ComponentProps) => <div {...props}>{children}</div>;
const FormLabel = ({ children, ...props }: ComponentProps) => <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>{children}</label>;
const FormControl = ({ children, ...props }: ComponentProps) => <>{children}</>;
const FormMessage = ({ children }: ComponentProps) => <p className="text-sm font-medium text-destructive">{children}</p>;
const Input = ({ className, ...props }: ComponentProps & { type?: string }) => <input className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
const Textarea = ({ className, ...props }: ComponentProps) => <textarea className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}></textarea>;
const Select = ({ children, onValueChange, defaultValue, ...props }: { children: React.ReactNode, onValueChange: (value: string) => void, defaultValue: string }) => <>{children}</>;
const SelectTrigger = ({ children, placeholder }: ComponentProps & { placeholder?: string }) => <div className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50" >{children}</div>;
const SelectValue = ({ placeholder }: { placeholder: string }) => <>{placeholder}</>;
const SelectContent = ({ children, ...props }: ComponentProps) => <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md" {...props}>{children}</div>;
const SelectItem = ({ children, value, ...props }: ComponentProps & { value: string }) => <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" {...props}>{children}</div>;
const Badge = ({ children, className }: ComponentProps) => <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</div>;

// Mock para Supabase
const supabase = {
    rpc: async (funcName: string, params: any) => {
        console.log(`Simulando chamada RPC para Supabase: ${funcName} com parâmetros:`, params);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { error: null };
    },
};

// Tipo para os relatórios baseados nos dados do banco
type Relatorio = {
    id: number;
    created_at: string;
    nome_relatorio: string | null;
    tipo_analise: string | null;
    periodo: string | null;
    data_inicio: string | null;
    data_fim: string | null;
    filtros: string | null;
};

// Esquema de validação do formulário
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
    initialData?: Partial<ReportFormData>;
}

// Componente do Formulário de Relatório
export function ReportForm({ onSuccess, initialData }: ReportFormProps) {
    const [loading, setLoading] = useState(false);

    // Verificação de contexto de toast para evitar erro
    const toast = typeof window !== 'undefined' && window['toast'] ? window['toast'] : () => {};

    const form = useForm<ReportFormData>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            nome_relatorio: initialData?.nome_relatorio || "",
            tipo_analise: initialData?.tipo_analise || "Eficiência de Combustível",
            periodo: initialData?.periodo || "Mensal",
            data_inicio: initialData?.data_inicio || "",
            data_fim: initialData?.data_fim || "",
            filtros: initialData?.filtros || "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                data_inicio: initialData.data_inicio || "",
                data_fim: initialData.data_fim || "",
            });
        }
    }, [initialData, form]);

    const onSubmit = async (data: ReportFormData) => {
        try {
            setLoading(true);

            const { error } = await supabase.rpc('insert_relatorio', {
                p_nome_relatorio: data.nome_relatorio,
                p_tipo_analise: data.tipo_analise,
                p_periodo: data.periodo,
                p_data_inicio: data.data_inicio,
                p_data_fim: data.data_fim,
                p_filtros: data.filtros || null,
            });

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Relatório criado com sucesso.",
            });

            form.reset();
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
        <Card>
            <CardHeader>
                <DialogTitle>Criar Novo Relatório</DialogTitle>
                <DialogDescription>
                    Configure um novo relatório personalizado para análise dos dados da frota.
                </DialogDescription>
            </CardHeader>
            <CardContent>
                <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <FormField
                            control={form.control as Control<ReportFormData>}
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
                                control={form.control as Control<ReportFormData>}
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
                                control={form.control as Control<ReportFormData>}
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
                                control={form.control as Control<ReportFormData>}
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
                                control={form.control as Control<ReportFormData>}
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
                            control={form.control as Control<ReportFormData>}
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
                            className="w-full sm:w-auto"
                            onClick={() => onSuccess?.()}
                            disabled={loading}
                            size="sm"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? "Criando..." : "Criar Relatório"}
                        </Button>
                    </div>
                </Form>
            </CardContent>
        </Card>
    );
}