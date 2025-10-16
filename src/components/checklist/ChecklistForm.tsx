import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageUpload } from './ImageUpload';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useChecklists } from '@/hooks/useChecklists';

const itemSchema = z.object({
  conforme: z.enum(['conforme', 'nao_conforme']),
  observacoes: z.string().optional(),
});

const formSchema = z.object({
  data_inspecao: z.string().min(1, 'Data é obrigatória'),
  placa_veiculo: z.string().min(1, 'Placa do veículo é obrigatória'),
  placa_implemento: z.string().optional(),
  motorista: z.coerce.number().min(1, 'Motorista é obrigatório'),
  tipo_checklist: z.string().min(1, 'Tipo é obrigatório'),
  status_final: z.string().min(1, 'Status é obrigatório'),
  local_inspecao: z.string().min(1, 'Local é obrigatório'),
  odometro: z.coerce.number().min(0, 'Odômetro deve ser maior que 0'),
  assinatura_motorista: z.string().optional(),
  visto_lideranca: z.string().optional(),
  secao1: z.object({
    item_1_1: itemSchema,
    item_1_2: itemSchema,
    item_1_3: itemSchema,
    item_1_4: itemSchema,
    item_1_5: itemSchema,
    item_1_6: itemSchema,
  }),
  secao2: z.object({
    item_2_1: itemSchema.extend({ psi: z.string().optional() }),
    item_2_2: itemSchema.extend({ especificacao: z.string().optional() }),
    item_2_3: itemSchema,
    item_2_4: itemSchema,
    item_2_5: itemSchema,
    item_2_6: itemSchema,
    item_2_7: itemSchema,
  }),
  secao3: z.object({
    item_3_1: itemSchema,
    item_3_2: itemSchema,
    item_3_3: itemSchema,
    item_3_4: itemSchema,
    item_3_5: itemSchema,
    item_3_6: itemSchema,
  }),
  secao4: z.object({
    item_4_1: itemSchema,
    item_4_2: itemSchema,
    item_4_3: itemSchema,
    item_4_4: itemSchema,
    item_4_5: itemSchema,
    item_4_6: itemSchema,
    item_4_7: itemSchema.extend({ luz_acesa: z.string().optional() }),
  }),
  secao5: z.object({
    item_5_1: itemSchema,
    item_5_2: itemSchema,
    item_5_3: itemSchema,
    item_5_4: itemSchema,
    item_5_5: itemSchema,
    item_5_6: itemSchema,
    item_5_7: itemSchema,
    item_5_8: itemSchema,
    item_5_9: itemSchema,
  }),
  secao6: z.object({
    item_6_1: itemSchema,
    item_6_2: itemSchema,
    item_6_3: itemSchema,
    item_6_4: itemSchema,
    item_6_5: itemSchema,
    item_6_6: itemSchema,
    item_6_7: itemSchema.extend({ numero_lacre: z.string().optional() }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ChecklistFormProps {
  onSubmit: (values: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export function ChecklistForm({ onSubmit, initialData, isLoading }: ChecklistFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.imagens || []);
  const [totalNaoConformidades, setTotalNaoConformidades] = useState(0);
  const { motoristas } = useChecklists();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_inspecao: initialData?.data_inspecao || new Date().toISOString().split('T')[0],
      placa_veiculo: initialData?.placa_veiculo || '',
      placa_implemento: initialData?.placa_implemento || '',
      motorista: initialData?.motorista || 0,
      tipo_checklist: initialData?.tipo_checklist || '',
      status_final: initialData?.status_final || '',
      local_inspecao: initialData?.local_inspecao || '',
      odometro: initialData?.odometro || 0,
      assinatura_motorista: initialData?.assinatura_motorista || '',
      visto_lideranca: initialData?.visto_lideranca || '',
      secao1: initialData?.secoes?.secao1 || {
        item_1_1: { conforme: 'conforme', observacoes: '' },
        item_1_2: { conforme: 'conforme', observacoes: '' },
        item_1_3: { conforme: 'conforme', observacoes: '' },
        item_1_4: { conforme: 'conforme', observacoes: '' },
        item_1_5: { conforme: 'conforme', observacoes: '' },
        item_1_6: { conforme: 'conforme', observacoes: '' },
      },
      secao2: initialData?.secoes?.secao2 || {
        item_2_1: { conforme: 'conforme', observacoes: '', psi: '' },
        item_2_2: { conforme: 'conforme', observacoes: '', especificacao: '' },
        item_2_3: { conforme: 'conforme', observacoes: '' },
        item_2_4: { conforme: 'conforme', observacoes: '' },
        item_2_5: { conforme: 'conforme', observacoes: '' },
        item_2_6: { conforme: 'conforme', observacoes: '' },
        item_2_7: { conforme: 'conforme', observacoes: '' },
      },
      secao3: initialData?.secoes?.secao3 || {
        item_3_1: { conforme: 'conforme', observacoes: '' },
        item_3_2: { conforme: 'conforme', observacoes: '' },
        item_3_3: { conforme: 'conforme', observacoes: '' },
        item_3_4: { conforme: 'conforme', observacoes: '' },
        item_3_5: { conforme: 'conforme', observacoes: '' },
        item_3_6: { conforme: 'conforme', observacoes: '' },
      },
      secao4: initialData?.secoes?.secao4 || {
        item_4_1: { conforme: 'conforme', observacoes: '' },
        item_4_2: { conforme: 'conforme', observacoes: '' },
        item_4_3: { conforme: 'conforme', observacoes: '' },
        item_4_4: { conforme: 'conforme', observacoes: '' },
        item_4_5: { conforme: 'conforme', observacoes: '' },
        item_4_6: { conforme: 'conforme', observacoes: '' },
        item_4_7: { conforme: 'conforme', observacoes: '', luz_acesa: '' },
      },
      secao5: initialData?.secoes?.secao5 || {
        item_5_1: { conforme: 'conforme', observacoes: '' },
        item_5_2: { conforme: 'conforme', observacoes: '' },
        item_5_3: { conforme: 'conforme', observacoes: '' },
        item_5_4: { conforme: 'conforme', observacoes: '' },
        item_5_5: { conforme: 'conforme', observacoes: '' },
        item_5_6: { conforme: 'conforme', observacoes: '' },
        item_5_7: { conforme: 'conforme', observacoes: '' },
        item_5_8: { conforme: 'conforme', observacoes: '' },
        item_5_9: { conforme: 'conforme', observacoes: '' },
      },
      secao6: initialData?.secoes?.secao6 || {
        item_6_1: { conforme: 'conforme', observacoes: '' },
        item_6_2: { conforme: 'conforme', observacoes: '' },
        item_6_3: { conforme: 'conforme', observacoes: '' },
        item_6_4: { conforme: 'conforme', observacoes: '' },
        item_6_5: { conforme: 'conforme', observacoes: '' },
        item_6_6: { conforme: 'conforme', observacoes: '' },
        item_6_7: { conforme: 'conforme', observacoes: '', numero_lacre: '' },
      },
    },
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      let count = 0;
      Object.keys(value).forEach((key) => {
        if (key.startsWith('secao')) {
          const secao = value[key as keyof typeof value] as any;
          Object.keys(secao || {}).forEach((itemKey) => {
            if (secao[itemKey]?.conforme === 'nao_conforme') {
              count++;
            }
          });
        }
      });
      setTotalNaoConformidades(count);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (values: FormValues) => {
    const secoes = {
      secao1: values.secao1,
      secao2: values.secao2,
      secao3: values.secao3,
      secao4: values.secao4,
      secao5: values.secao5,
      secao6: values.secao6,
    };
    onSubmit({
      data_inspecao: values.data_inspecao,
      placa_veiculo: values.placa_veiculo,
      placa_implemento: values.placa_implemento,
      motorista: values.motorista,
      tipo_checklist: values.tipo_checklist,
      status_final: values.status_final,
      local_inspecao: values.local_inspecao,
      odometro: values.odometro,
      total_nao_conformidades: totalNaoConformidades,
      assinatura_motorista: values.assinatura_motorista || null,
      visto_lideranca: values.visto_lideranca || null,
      secoes: secoes,
      imagens: images,
    });
  };

  const renderCheckItem = (
    sectionKey: string,
    itemKey: string,
    label: string,
    extraField?: 'psi' | 'especificacao' | 'luz_acesa' | 'numero_lacre'
  ) => (
    <Card key={`${sectionKey}.${itemKey}`} className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="font-medium">{label}</div>
          <FormField
            control={form.control}
            name={`${sectionKey}.${itemKey}.conforme` as any}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="conforme" id={`${sectionKey}-${itemKey}-conforme`} />
                      <label htmlFor={`${sectionKey}-${itemKey}-conforme`} className="text-sm cursor-pointer">
                        Conforme
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao_conforme" id={`${sectionKey}-${itemKey}-nao-conforme`} />
                      <label htmlFor={`${sectionKey}-${itemKey}-nao-conforme`} className="text-sm cursor-pointer">
                        Não Conforme
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {extraField && (
            <FormField
              control={form.control}
              name={`${sectionKey}.${itemKey}.${extraField}` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {extraField === 'psi' && 'Especificar PSI'}
                    {extraField === 'especificacao' && 'Especificar Pneu com TWI baixo'}
                    {extraField === 'luz_acesa' && 'Especificar luz acesa'}
                    {extraField === 'numero_lacre' && 'Nº do Lacre'}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={`Digite ${extraField === 'psi' ? 'o PSI' : extraField === 'numero_lacre' ? 'o número' : 'a especificação'}`} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name={`${sectionKey}.${itemKey}.observacoes` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações / Ações Corretivas</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descreva observações ou ações corretivas necessárias..."
                    rows={2}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Dados Básicos da Inspeção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inspecao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Inspeção *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motorista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista Responsável *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id.toString()}>
                            {motorista.nome}
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
                name="placa_veiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa do Veículo (Cavalo Mecânico) *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
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
                    <FormLabel>Placa do Implemento (Baú/Carreta)</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234 (se aplicável)" {...field} />
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
                      <Input type="number" min="0" {...field} placeholder="Quilometragem atual" />
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
                      <Input placeholder="Ex: Pátio Matriz, Filial São Paulo" {...field} />
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
                        <SelectItem value="Preventiva">Manutenção Preventiva</SelectItem>
                        <SelectItem value="Pré-viagem">Pré-viagem</SelectItem>
                        <SelectItem value="Pós-viagem">Pós-viagem</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Seção 1: Documentação e Obrigatoriedade Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderCheckItem('secao1', 'item_1_1', '1.1 CNH do Motorista (Válida e na Categoria Correta)')}
            {renderCheckItem('secao1', 'item_1_2', '1.2 CRLV (Licenciamento) - Veículo e Implemento, válidos')}
            {renderCheckItem('secao1', 'item_1_3', '1.3 Exame Toxicológico (Se aplicável à categoria)')}
            {renderCheckItem('secao1', 'item_1_4', '1.4 Extintor de Incêndio (Cheio, Válido e Acessível)')}
            {renderCheckItem('secao1', 'item_1_5', '1.5 Triângulo de Sinalização (Completo e íntegro)')}
            {renderCheckItem('secao1', 'item_1_6', '1.6 Macaco e Chave de Roda (Em condições de uso)')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seção 2: Sistema de Freios e Rodagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderCheckItem('secao2', 'item_2_1', '2.1 Pressão dos Pneus (Conforme manual de carga)', 'psi')}
            {renderCheckItem('secao2', 'item_2_2', '2.2 Profundidade dos Sulcos (TWI) - Acima do limite legal', 'especificacao')}
            {renderCheckItem('secao2', 'item_2_3', '2.3 Estado Visual dos Pneus (Sem bolhas, cortes ou avarias laterais)')}
            {renderCheckItem('secao2', 'item_2_4', '2.4 Rodas e Fixação (Sem folgas, porcas apertadas e íntegras)')}
            {renderCheckItem('secao2', 'item_2_5', '2.5 Freio de Serviço (Pedal) - Acionamento firme, sem "borracha"')}
            {renderCheckItem('secao2', 'item_2_6', '2.6 Freio de Estacionamento (Travamento eficiente)')}
            {renderCheckItem('secao2', 'item_2_7', '2.7 Nível de Fluido de Freio (Dentro da marcação MIN/MAX)')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seção 3: Níveis de Fluidos e Motor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderCheckItem('secao3', 'item_3_1', '3.1 Nível de Óleo do Motor (Entre as marcas de verificação)')}
            {renderCheckItem('secao3', 'item_3_2', '3.2 Nível de Água do Radiador (Líquido de arrefecimento)')}
            {renderCheckItem('secao3', 'item_3_3', '3.3 Nível de Arla 32 (Se veículo for Diesel Euro V/VI)')}
            {renderCheckItem('secao3', 'item_3_4', '3.4 Vazamentos Aparentes (Motor, transmissão, eixos)')}
            {renderCheckItem('secao3', 'item_3_5', '3.5 Mangueiras e Correias (Sem rachaduras, bom tensionamento)')}
            {renderCheckItem('secao3', 'item_3_6', '3.6 Funcionamento do Motor (Marcha lenta estável, sem ruídos estranhos)')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seção 4: Iluminação, Sinalização e Elétrica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderCheckItem('secao4', 'item_4_1', '4.1 Faróis (Alto e Baixo)')}
            {renderCheckItem('secao4', 'item_4_2', '4.2 Lanternas Dianteiras e Traseiras')}
            {renderCheckItem('secao4', 'item_4_3', '4.3 Luzes de Freio (Incluindo 3ª Luz de Freio)')}
            {renderCheckItem('secao4', 'item_4_4', '4.4 Luzes Indicadoras de Direção (Setas)')}
            {renderCheckItem('secao4', 'item_4_5', '4.5 Pisca-Alerta (Funcionamento simultâneo)')}
            {renderCheckItem('secao4', 'item_4_6', '4.6 Buzina e Limpador de Para-brisa')}
            {renderCheckItem('secao4', 'item_4_7', '4.7 Painel de Instrumentos (Sem luzes de alerta acesas)', 'luz_acesa')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seção 5: Cabine e Condições Gerais (Estética e Interna)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderCheckItem('secao5', 'item_5_1', '5.1 Para-brisa e Vidros (Sem trincas ou avarias que obstruam a visão)')}
            {renderCheckItem('secao5', 'item_5_2', '5.2 Espelhos Retrovisores (Limpos, fixos e sem quebras)')}
            {renderCheckItem('secao5', 'item_5_3', '5.3 Condição do Assento e Cinto (Ajustáveis e funcionais)')}
            {renderCheckItem('secao5', 'item_5_4', '5.4 Nível de Combustível (Recomendado: acima de 1/4 do tanque)')}
            {renderCheckItem('secao5', 'item_5_5', '5.5 Limpeza e Organização da Cabine (Sem lixo ou objetos soltos)')}
            {renderCheckItem('secao5', 'item_5_6', '5.6 Tapetes e Forrações (Limpos e sem danos significativos)')}
            {renderCheckItem('secao5', 'item_5_7', '5.7 Maçanetas Externas e Internas (Funcionamento suave e sem quebras)')}
            {renderCheckItem('secao5', 'item_5_8', '5.8 Pintura Danificada (Cabine) - Pontos de ferrugem, riscos profundos')}
            {renderCheckItem('secao5', 'item_5_9', '5.9 Lataria Danificada (Cabine) - Amassados, partes soltas ou desalinhadas')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seção 6: Implemento (Baú, Sider, Carroceria) e Segurança da Carga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderCheckItem('secao6', 'item_6_1', '6.1 Estado Geral do Implemento (Estrutura e Chassi sem trincas ou deformações)')}
            {renderCheckItem('secao6', 'item_6_2', '6.2 Pintura Danificada (Implemento) - Rachaduras ou perda de pintura que exponham o material')}
            {renderCheckItem('secao6', 'item_6_3', '6.3 Lataria Danificada (Implemento) - Amassados profundos ou painéis soltos')}
            {renderCheckItem('secao6', 'item_6_4', '6.4 Portas/Tampas e Travamento (Vedação e fechaduras eficientes e seguras)')}
            {renderCheckItem('secao6', 'item_6_5', '6.5 Piso do Compartimento de Carga (Limpo, seco e sem avarias estruturais)')}
            {renderCheckItem('secao6', 'item_6_6', '6.6 Dispositivos de Amarração (Cintas, catracas ou pontos de fixação íntegros)')}
            {renderCheckItem('secao6', 'item_6_7', '6.7 Lacre/Segurança da Carga (Verificar integridade/número do lacre, se aplicável)', 'numero_lacre')}
          </CardContent>
        </Card>
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Anexos e Evidências Fotográficas</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload images={images} onImagesChange={setImages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Resultado Final e Assinaturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total de Não Conformidades</div>
                <div className="text-3xl font-bold">{totalNaoConformidades}</div>
                <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente</p>
              </div>
              <FormField
                control={form.control}
                name="status_final"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Final da Inspeção *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aprovado">APROVADO</SelectItem>
                        <SelectItem value="Reprovado">REPROVADO</SelectItem>
                        <SelectItem value="Pendente">PENDENTE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assinatura_motorista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assinatura do Motorista (URL ou Base64)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cole a URL ou Base64 da assinatura digital" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visto_lideranca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visto da Liderança/Frota (URL ou Base64)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cole a URL ou Base64 do visto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? 'Salvando...' : 'Salvar Checklist Completo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}