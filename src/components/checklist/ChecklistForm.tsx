import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Save, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert, ChecklistSecoesType } from "@/integrations/supabase/types";
import { useMotoristas } from "@/hooks/useMotoristas";

const itemSchema = z.object({
    descricao: z.string(),
    conforme: z.boolean(),
    observacoes: z.string().optional(),
});

const secaoSchema = z.object({
    titulo: z.string(),
    itens: z.array(itemSchema),
});

const checklistSchema = z.object({
    motorista: z.number().min(1, "O ID do Motorista é obrigatório e deve ser um número válido"),
    placa_veiculo: z.string().min(1, "Placa do veículo é obrigatória"),
    placa_implemento: z.string().optional(),
    odometro: z.number().min(0, "Odômetro deve ser maior ou igual a zero"),
    local_inspecao: z.string().min(1, "Local da inspeção é obrigatório"),
    tipo_checklist: z.string().min(1, "Tipo de checklist é obrigatório"),
    secoes: z.record(z.string(), secaoSchema),
    assinatura_motorista: z.boolean().refine(val => val === true, {
        message: "A assinatura do motorista é obrigatória.",
    }),
    visto_lideranca: z.boolean().optional(),
    data_inspecao: z.string(),
});

type ChecklistFormData = z.infer<typeof checklistSchema>;

interface ChecklistFormProps {
    onSuccess: () => void;
}

const secoesTemplate: Record<string, z.infer<typeof secaoSchema>> = {
    documentacao: {
        titulo: "Documentação e Obrigatoriedade Legal",
        itens: [
            { descricao: "CNH do Motorista (Válida e na Categoria Correta)", conforme: false, observacoes: "" },
            { descricao: "CRLV (Licenciamento) (Veículo e Implemento, válidos)", conforme: false, observacoes: "" },
            { descricao: "Exame Toxicológico (Se aplicável à categoria)", conforme: false, observacoes: "" },
            { descricao: "Extintor de Incêndio (Cheio, Válido e Acessível)", conforme: false, observacoes: "" },
            { descricao: "Triângulo de Sinalização (Completo e íntegro)", conforme: false, observacoes: "" },
            { descricao: "Macaco e Chave de Roda (Em condições de uso)", conforme: false, observacoes: "" },
        ],
    },
    freios_rodagem: {
        titulo: "Sistema de Freios e Rodagem",
        itens: [
            { descricao: "Pressão dos Pneus (Conforme manual de carga)", conforme: false, observacoes: "" },
            { descricao: "Profundidade dos Sulcos (TWI) (Acima do limite legal)", conforme: false, observacoes: "" },
            { descricao: "Estado Visual dos Pneus (Sem bolhas, cortes ou avarias laterais)", conforme: false, observacoes: "" },
            { descricao: "Rodas e Fixação (Sem folgas, porcas apertadas e íntegras)", conforme: false, observacoes: "" },
            { descricao: "Freio de Serviço (Pedal) (Acionamento firme, sem 'borracha')", conforme: false, observacoes: "" },
            { descricao: "Freio de Estacionamento (Travamento eficiente)", conforme: false, observacoes: "" },
            { descricao: "Nível de Fluido de Freio (Dentro da marcação MIN/MAX)", conforme: false, observacoes: "" },
        ],
    },
    fluidos_motor: {
        titulo: "Níveis de Fluidos e Motor",
        itens: [
            { descricao: "Nível de Óleo do Motor (Entre as marcas de verificação)", conforme: false, observacoes: "" },
            { descricao: "Nível de Água do Radiador (Líquido de arrefecimento)", conforme: false, observacoes: "" },
            { descricao: "Nível de Arla 32 (Se veículo for Diesel Euro V/VI)", conforme: false, observacoes: "" },
            { descricao: "Vazamentos Aparentes (Motor, transmissão, eixos)", conforme: false, observacoes: "" },
            { descricao: "Mangueiras e Correias (Sem rachaduras, bom tensionamento)", conforme: false, observacoes: "" },
            { descricao: "Funcionamento do Motor (Marcha lenta estável, sem ruídos estranhos)", conforme: false, observacoes: "" },
        ],
    },
    iluminacao: {
        titulo: "Iluminação, Sinalização e Elétrica",
        itens: [
            { descricao: "Faróis (Alto e Baixo)", conforme: false, observacoes: "" },
            { descricao: "Lanternas Dianteiras e Traseiras", conforme: false, observacoes: "" },
            { descricao: "Luzes de Freio (Incluindo 3ª Luz de Freio)", conforme: false, observacoes: "" },
            { descricao: "Luzes Indicadoras de Direção (Setas)", conforme: false, observacoes: "" },
            { descricao: "Pisca-Alerta (Funcionamento simultâneo)", conforme: false, observacoes: "" },
            { descricao: "Buzina e Limpador de Para-brisa", conforme: false, observacoes: "" },
            { descricao: "Painel de Instrumentos (Sem luzes de alerta acesas)", conforme: false, observacoes: "" },
        ],
    },
    cabine: {
        titulo: "Cabine e Condições Gerais",
        itens: [
            { descricao: "Para-brisa e Vidros (Sem trincas ou avarias que obstruam a visão)", conforme: false, observacoes: "" },
            { descricao: "Espelhos Retrovisores (Limpos, fixos e sem quebras)", conforme: false, observacoes: "" },
            { descricao: "Condição do Assento e Cinto (Ajustáveis e funcionais)", conforme: false, observacoes: "" },
            { descricao: "Nível de Combustível (Recomendado: acima de 1/4 do tanque)", conforme: false, observacoes: "" },
            { descricao: "Limpeza e Organização da Cabine (Sem lixo ou objetos soltos)", conforme: false, observacoes: "" },
            { descricao: "Tapetes e Forrações (Limpos e sem danos significativos)", conforme: false, observacoes: "" },
            { descricao: "Maçanetas Externas e Internas (Funcionamento suave e sem quebras)", conforme: false, observacoes: "" },
            { descricao: "Pintura Danificada (Cabine) (Pontos de ferrugem, riscos profundos)", conforme: false, observacoes: "" },
            { descricao: "Lataria Danificada (Cabine) (Amassados, partes soltas ou desalinhadas)", conforme: false, observacoes: "" },
        ],
    },
    implemento: {
        titulo: "Implemento e Segurança da Carga",
        itens: [
            { descricao: "Estado Geral do Implemento (Estrutura e Chassi sem trincas ou deformações)", conforme: false, observacoes: "" },
            { descricao: "Pintura Danificada (Implemento) (Rachaduras ou perda de pintura que exponham o material)", conforme: false, observacoes: "" },
            { descricao: "Lataria Danificada (Implemento) (Amassados profundos ou painéis soltos)", conforme: false, observacoes: "" },
            { descricao: "Portas/Tampas e Travamento (Vedação e fechaduras eficientes e seguras)", conforme: false, observacoes: "" },
            { descricao: "Piso do Compartimento de Carga (Limpo, seco e sem avarias estruturais)", conforme: false, observacoes: "" },
            { descricao: "Dispositivos de Amarração (Cintas, catracas ou pontos de fixação íntegros)", conforme: false, observacoes: "" },
            { descricao: "Lacre/Segurança da Carga (Verificar integridade/número do lacre, se aplicável)", conforme: false, observacoes: "" },
        ],
    },
};

export default function ChecklistForm({ onSuccess }: ChecklistFormProps) {
    const [loading, setLoading] = useState(false);

    const { motoristas, loading: loadingMotoristas, error: errorMotoristas } = useMotoristas();

    const form = useForm<ChecklistFormData>({
        resolver: zodResolver(checklistSchema),
        defaultValues: {
            motorista: 0,
            placa_veiculo: "",
            placa_implemento: "",
            odometro: 0,
            local_inspecao: "",
            tipo_checklist: "",
            secoes: secoesTemplate,
            assinatura_motorista: false,
            visto_lideranca: false,
            data_inspecao: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(',', ''),
        },
    });

    const onSubmit = async (data: ChecklistFormData) => {
        setLoading(true);
        try {
            const totalNaoConformidades = Object.values(data.secoes).reduce(
                (total, secao) => total + secao.itens.filter(item => !item.conforme).length,
                0
            );

            const statusFinal = totalNaoConformidades === 0 ? "APROVADO" : "REPROVADO";

            if (statusFinal === "REPROVADO" && !data.visto_lideranca) {
                alert("Atenção: Para checklist REPROVADO, o Visto da Liderança/Frota é obrigatório.");
                setLoading(false);
                return;
            }

            // CORREÇÃO DE DATA: Tenta analisar a data em formato pt-BR e converte para ISO
            let dataInspecaoISO: string;
            try {
                const parts = data.data_inspecao.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
                let dataObj: Date;

                if (parts) {
                    // Monta a string no formato YYYY-MM-DDTHH:mm:ss para ser interpretada corretamente
                    dataObj = new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:${parts[6]}`);
                } else {
                    // Tenta criar a data a partir da string original (pode funcionar em alguns ambientes)
                    dataObj = new Date(data.data_inspecao);
                }

                if (isNaN(dataObj.getTime())) {
                    throw new Error("Data inválida");
                }

                if (dataObj.getFullYear() < 2020 || dataObj.getFullYear() > 2050) {
                    console.warn("Data fora do range esperado. Usando ISO string local.");
                }

                dataInspecaoISO = dataObj.toISOString();

            } catch (dateError) {
                console.error("Erro ao processar data_inspecao. O erro 'Aviso: Data de inspeção inválida' vinha daqui:", dateError);
                dataInspecaoISO = new Date().toISOString();
                alert("Aviso: Data de inspeção inválida. Usando data/hora atual.");
            }

            // Preparação do Payload
            const checklistData: TablesInsert<'checklists'> = {
                motorista: String(data.motorista), // mantém ID numérico convertido para string
                data_inspecao: dataInspecaoISO,
                placa_veiculo: data.placa_veiculo.toUpperCase(),
                placa_implemento: data.placa_implemento ? data.placa_implemento.toUpperCase() : null,
                odometro: data.odometro,
                local_inspecao: data.local_inspecao,
                tipo_checklist: data.tipo_checklist,
                secoes: Object.values(data.secoes) as unknown as ChecklistSecoesType,
                total_nao_conformidades: totalNaoConformidades,
                status_final: statusFinal,
                assinatura_motorista: data.assinatura_motorista,
                visto_lideranca: data.visto_lideranca || false,
            };

            const { error } = await supabase.from('checklists').insert([checklistData]);

            if (error) {
                console.error("Erro detalhado do Supabase:", error);
                if (error.code === '23503' && error.message.includes('fk_checklists_motorista')) {
                    alert(`Erro de Chave Estrangeira: O ID do Motorista ${data.motorista} não está cadastrado.`);
                } else if (error.code === '23503' && error.message.includes('fk_checklists_veiculo')) {
                    alert("Erro de Chave Estrangeira: A placa do veículo não está cadastrada.");
                } else {
                    alert(`Erro ao criar checklist: ${error.message}`);
                }
                return;
            }

            alert("Checklist criado com sucesso!");
            onSuccess();
        } catch (error) {
            console.error("Erro inesperado durante o envio:", error);
            alert("Erro inesperado. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const updateItemField = (secaoKey: keyof typeof secoesTemplate, itemIndex: number, fieldName: 'conforme' | 'observacoes', value: any) => {
        form.setValue(`secoes.${secaoKey}.itens.${itemIndex}.${fieldName}`, value as any, { shouldDirty: true, shouldValidate: true });
        form.trigger("secoes");
    };

    const calculateNaoConformidades = () => {
        const secoes = form.watch("secoes");
        return Object.values(secoes).reduce(
            (total, secao) => total + secao.itens.filter(item => !item.conforme).length,
            0
        );
    };

    const totalNaoConformidades = calculateNaoConformidades();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Informações Básicas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileCheck className="mr-2 h-5 w-5" />
                            Informações Básicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Substituição apenas do campo Motorista */}
                        <FormField
                            control={form.control}
                            name="motorista"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motorista *</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            value={field.value.toString()}
                                            disabled={loadingMotoristas || !!errorMotoristas}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingMotoristas ? "Carregando motoristas..." : "Selecione o motorista"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {motoristas.map((motorista) => (
                                                    <SelectItem key={motorista.id} value={motorista.id.toString()}>
                                                        {motorista.nome}
                                                    </SelectItem>
                                                ))}
                                                {motoristas.length === 0 && !loadingMotoristas && (
                                                    <SelectItem value="0" disabled>
                                                        Nenhum motorista encontrado
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                    {errorMotoristas && <p className="text-red-600 mt-1 text-sm">Erro ao carregar motoristas: {errorMotoristas}</p>}
                                </FormItem>
                            )}
                        />

                        {/* Os demais campos iguais ao seu código original */}
                        <FormField
                            control={form.control}
                            name="placa_veiculo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Placa do Veículo *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="XXX-0000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="placa_implemento"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Placa do Implemento</FormLabel>
                                    <FormControl>
                                        <Input placeholder="XXX-0000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="odometro"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Odômetro (km) *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="local_inspecao"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Local da Inspeção *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Pátio Matriz, Filial X" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tipo_checklist"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Checklist *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Pré-viagem">Pré-viagem</SelectItem>
                                            <SelectItem value="Pós-viagem">Pós-viagem</SelectItem>
                                            <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="data_inspecao"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data e Hora da Inspeção</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            value={field.value}
                                            readOnly
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </CardContent>
                </Card>

                {/* Status do Checklist */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Badge variant={totalNaoConformidades === 0 ? "default" : "destructive"} className="text-base px-3 py-1">
                                    {totalNaoConformidades === 0 ? "APROVADO" : "REPROVADO"}
                                </Badge>
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm">
                                        <strong>Total de Não Conformidades:</strong> {totalNaoConformidades}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Seções do Checklist */}
                <ScrollArea className="h-[600px] border p-4 rounded-lg">
                    <div className="space-y-6">
                        {Object.entries(form.watch("secoes")).map(([secaoKey, secao]) => (
                            <Card key={secaoKey}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{secao.titulo}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {secao.itens.map((item, itemIndex) => (
                                            <div key={itemIndex} className="border rounded-lg p-4 space-y-3">
                                                <div className="font-medium text-sm">{item.descricao}</div>

                                                <div className="flex items-center space-x-6">

                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${secaoKey}-${itemIndex}-conforme`}
                                                            checked={item.conforme}
                                                            onCheckedChange={(checked) => {
                                                                updateItemField(secaoKey as keyof typeof secoesTemplate, itemIndex, 'conforme', checked as boolean);
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`${secaoKey}-${itemIndex}-conforme`}
                                                            className="text-sm font-medium text-green-600 cursor-pointer"
                                                        >
                                                            Conforme
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${secaoKey}-${itemIndex}-nao-conforme`}
                                                            checked={!item.conforme}
                                                            onCheckedChange={(checked) => {
                                                                updateItemField(secaoKey as keyof typeof secoesTemplate, itemIndex, 'conforme', !(checked as boolean));
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`${secaoKey}-${itemIndex}-nao-conforme`}
                                                            className="text-sm font-medium text-red-600 cursor-pointer"
                                                        >
                                                            Não Conforme
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">
                                                        Observações / Ações Corretivas:
                                                    </label>
                                                    <Textarea
                                                        placeholder="Descreva observações ou ações corretivas necessárias..."
                                                        value={item.observacoes || ""}
                                                        onChange={(e) => updateItemField(secaoKey as keyof typeof secoesTemplate, itemIndex, 'observacoes', e.target.value)}
                                                        className="min-h-[60px]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>

                {/* Assinaturas e Visto */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resultado Final e Assinaturas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="assinatura_motorista"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Assinatura Digital do Motorista *</FormLabel>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {totalNaoConformidades > 0 && (
                            <FormField
                                control={form.control}
                                name="visto_lideranca"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Visto da Liderança/Frota (Obrigatório para reprovação)</FormLabel>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar Checklist
                    </Button>
                </div>
            </form>
        </Form>
    );
}