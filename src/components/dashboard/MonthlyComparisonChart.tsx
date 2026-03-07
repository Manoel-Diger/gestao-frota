import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Abastecimento } from "@/hooks/useAbastecimentos";
import { Manutencao } from "@/hooks/useManutencoes";

interface Props {
  abastecimentos: Abastecimento[];
  manutencoes: Manutencao[];
}

export function MonthlyComparisonChart({ abastecimentos, manutencoes }: Props) {
  const data = useMemo(() => {
    const meses: Record<string, { combustivel: number; manutencao: number }> = {};
    const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      meses[key] = { combustivel: 0, manutencao: 0 };
    }

    abastecimentos.forEach(a => {
      const d = new Date(a.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (meses[key] !== undefined) {
        meses[key].combustivel += Number(a.custo_total) || 0;
      }
    });

    manutencoes.forEach(m => {
      const d = new Date(m.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (meses[key] !== undefined) {
        meses[key].manutencao += Number(m.custo) || 0;
      }
    });

    return Object.entries(meses).map(([key, values]) => {
      const [year, month] = key.split('-');
      return {
        mes: `${nomesMes[parseInt(month) - 1]}/${year.slice(2)}`,
        Combustível: Math.round(values.combustivel),
        Manutenção: Math.round(values.manutencao),
        Total: Math.round(values.combustivel + values.manutencao),
      };
    });
  }, [abastecimentos, manutencoes]);

  if (data.every(d => d.Total === 0)) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          Custos Mensais (R$) — Últimos 6 Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, undefined]}
            />
            <Legend />
            <Bar dataKey="Combustível" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Manutenção" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
