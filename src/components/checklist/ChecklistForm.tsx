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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from './ImageUpload';
import { useState, useMemo, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MinusCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { INSPECTION_GROUPS, buildDefaultGroups, type InspectionGroup } from '@/hooks/useChecklists';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useMotoristas } from '@/hooks/useMotoristas';

const formSchema = z.object({
  data_inspecao: z.string().min(1, 'Data é obrigatória'),
  placa_veiculo: z.string().min(1, 'Placa do veículo é obrigatória'),
  placa_implemento: z.string().optional(),
  motorista: z.coerce.number().min(1, 'Motorista é obrigatório'),
  tipo_checklist: z.string().min(1, 'Tipo é obrigatório'),
  local_inspecao: z.string().min(1, 'Local é obrigatório'),
  odometro: z.coerce.number().min(0, 'Odômetro deve ser maior que 0'),
  assinatura_motorista: z.boolean(),
  visto_lideranca: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ChecklistFormProps {
  onSubmit: (values: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export function ChecklistForm({ onSubmit, initialData, isLoading }: ChecklistFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.imagens || []);
  const { veiculos } = useVeiculos();
  const { motoristas } = useMotoristas();

  const defaultGroups = buildDefaultGroups();
  const [inspectionData, setInspectionData] = useState<Record<string, InspectionGroup>>(() => {
    if (initialData) {
      return {
        pneus_rodas: initialData.pneus_rodas || defaultGroups.pneus_rodas,
        iluminacao: initialData.iluminacao || defaultGroups.iluminacao,
        fluidos: initialData.fluidos || defaultGroups.fluidos,
        seguranca: initialData.seguranca || defaultGroups.seguranca,
        cabine: initialData.cabine || defaultGroups.cabine,
      };
    }
    return defaultGroups;
  });

  const counters = useMemo(() => {
    let ok = 0;
    let nok = 0;
    let na = 0;
    for (const group of Object.values(inspectionData)) {
      for (const item of Object.values(group)) {
        if (item.status === 'ok') ok++;
        else if (item.status === 'nok') nok++;
        else na++;
      }
    }
    return { ok, nok, na, total: ok + nok + na };
  }, [inspectionData]);

  const autoStatus = useMemo(() => {
    if (counters.nok === 0) return 'Aprovado';
    return 'Reprovado';
  }, [counters.nok]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_inspecao: initialData?.data_inspecao || new Date().toISOString().split('T')[0],
      placa_veiculo: initialData?.placa_veiculo || '',
      placa_implemento: initialData?.placa_implemento || '',
      motorista: initialData?.motorista || 0,
      tipo_checklist: initialData?.tipo_checklist || 'Inspeção Veicular',
      local_inspecao: initialData?.local_inspecao || '',
      odometro: initialData?.odometro || 0,
      assinatura_motorista: initialData?.assinatura_motorista || false,
      visto_lideranca: initialData?.visto_lideranca || false,
    },
  });

  // --- LÓGICA DE AUTOMAÇÃO (MOTORISTA + ODÔMETRO) ---
  const watchedPlaca = form.watch("placa_veiculo");

  useEffect(() => {
    if (watchedPlaca && veiculos.length > 0) {
      const veiculoSelecionado = veiculos.find(v => v.placa === watchedPlaca);
      
      if (veiculoSelecionado) {
        // Automação do Motorista
        if (veiculoSelecionado.motorista_id) {
          const motoristaExiste = motoristas.some(m => m.id === veiculoSelecionado.motorista_id);
          if (motoristaExiste) {
            form.setValue("motorista", veiculoSelecionado.motorista_id);
          }
        }
        
        // Automação do Odômetro (KM atual do veículo)
        if (veiculoSelecionado.quilometragem !== undefined) {
          form.setValue("odometro", veiculoSelecionado.quilometragem);
        }
      }
    }
  }, [watchedPlaca, veiculos, motoristas, form]);
  // --------------------------------------------------

  const updateItem = (groupKey: string, itemName: string, field: 'status' | 'obs', value: string) => {
    setInspectionData(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        [itemName]: {
          ...prev[groupKey][itemName],
          [field]: value,
        },
      },
    }));
  };

  const selectedMotorista = motoristas.find(m => m.id === form.watch('motorista'));

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      motorista_nome: selectedMotorista?.nome || null,
      status_final: autoStatus,
      total_nao_conformidades: counters.nok,
      imagens: images,
      pneus_rodas: inspectionData.pneus_rodas,
      iluminacao: inspectionData.iluminacao,
      fluidos: inspectionData.fluidos,
      seguranca: inspectionData.seguranca,
      cabine: inspectionData.cabine,
    });
  };

  const groupIcons: Record<string, string> = {
    pneus_rodas: '🛞',
    iluminacao: '💡',
    fluidos: '🛢️',
    seguranca: '🛡️',
    cabine: '🚛',
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-success/30 bg-success/5 transition-all duration-500">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="text-2xl font-bold text-success transition-all duration-500">{counters.ok}</p>
                <p className="text-xs text-muted-foreground">Itens OK</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 bg-destructive/5 transition-all duration-500">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive transition-all duration-500">{counters.nok}</p>
                <p className="text-xs text-muted-foreground">Falhas</p>
              </div>
            </CardContent>
          </Card>
          <Card className={`transition-all duration-500 ${autoStatus === 'Aprovado' ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {autoStatus === 'Aprovado' ? <ShieldCheck className="h-6 w-6 text-success" /> : <ShieldAlert className="h-6 w-6 text-destructive" />}
              <div>
                <p className="text-sm font-bold">{autoStatus}</p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="data_inspecao" render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Inspeção</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="placa_veiculo" render={({ field }) => (
            <FormItem>
              <FormLabel>Veículo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {veiculos.map(v => (
                    <SelectItem key={v.id} value={v.placa}>{v.placa} - {v.marca} {v.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="motorista" render={({ field }) => (
            <FormItem>
              <FormLabel>Motorista</FormLabel>
              <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ''}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {motoristas.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="tipo_checklist" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Inspeção Veicular">Inspeção Veicular</SelectItem>
                  <SelectItem value="Pré-viagem">Pré-viagem</SelectItem>
                  <SelectItem value="Pós-viagem">Pós-viagem</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="local_inspecao" render={({ field }) => (
            <FormItem>
              <FormLabel>Local da Inspeção</FormLabel>
              <FormControl><Input placeholder="Ex: Garagem Central" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="odometro" render={({ field }) => (
            <FormItem>
              <FormLabel>Odômetro (KM)</FormLabel>
              <FormControl><Input type="number" min="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="placa_implemento" render={({ field }) => (
            <FormItem>
              <FormLabel>Implemento (Opcional)</FormLabel>
              <FormControl><Input placeholder="ABC-1234" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {Object.entries(INSPECTION_GROUPS).map(([groupKey, group]) => (
          <Card key={groupKey}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{groupIcons[groupKey]}</span>
                {group.label}
                <Badge variant="outline" className="ml-auto">
                  {Object.values(inspectionData[groupKey] || {}).filter(i => i.status === 'nok').length} falha(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map(itemName => {
                const item = inspectionData[groupKey]?.[itemName] || { status: 'ok', obs: '' };
                return (
                  <div key={itemName} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                    item.status === 'nok' ? 'bg-destructive/5 border border-destructive/20' : 
                    item.status === 'na' ? 'bg-muted/50' : 'bg-success/5 border border-transparent'
                  }`}>
                    <span className="text-sm font-medium min-w-[200px]">{itemName}</span>
                    <RadioGroup
                      value={item.status}
                      onValueChange={(v) => updateItem(groupKey, itemName, 'status', v)}
                      className="flex gap-3"
                    >
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="ok" id={`${groupKey}-${itemName}-ok`} />
                        <Label htmlFor={`${groupKey}-${itemName}-ok`} className="text-xs text-success cursor-pointer">OK</Label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="nok" id={`${groupKey}-${itemName}-nok`} />
                        <Label htmlFor={`${groupKey}-${itemName}-nok`} className="text-xs text-destructive cursor-pointer">NOK</Label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="na" id={`${groupKey}-${itemName}-na`} />
                        <Label htmlFor={`${groupKey}-${itemName}-na`} className="text-xs text-muted-foreground cursor-pointer">N/A</Label>
                      </div>
                    </RadioGroup>
                    {item.status === 'nok' && (
                      <input
                        placeholder="Observação..."
                        value={item.obs || ''}
                        onChange={(e) => updateItem(groupKey, itemName, 'obs', e.target.value)}
                        className="flex-1 h-8 text-xs border rounded px-2"
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="assinatura_motorista" render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Assinatura do Motorista</FormLabel>
            </FormItem>
          )} />
          <FormField control={form.control} name="visto_lideranca" render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Visto da Liderança</FormLabel>
            </FormItem>
          )} />
        </div>

        <div>
          <FormLabel>Imagens</FormLabel>
          <div className="mt-2">
            <ImageUpload images={images} onImagesChange={setImages} />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Salvando...' : 'Salvar Checklist'}
        </Button>
      </form>
    </Form>
  );
}