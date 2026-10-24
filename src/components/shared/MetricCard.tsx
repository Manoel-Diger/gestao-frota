import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricTone = "primary" | "success" | "warning" | "info" | "danger" | "neutral";

const toneStyles: Record<MetricTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

interface MetricCardProps {
  title: string;
  value: ReactNode;
  /** Unidade exibida ao lado do valor (ex.: "L", "km/L") */
  unit?: string;
  /** Linha de apoio abaixo do valor */
  caption?: ReactNode;
  icon: ReactNode;
  tone?: MetricTone;
  className?: string;
}

/**
 * Cartão de indicador padrão do sistema: rótulo + ícone no topo,
 * valor em destaque (números tabulares) e legenda de apoio.
 */
export function MetricCard({ title, value, unit, caption, icon, tone = "primary", className }: MetricCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex h-full min-h-[120px] flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug text-muted-foreground">{title}</p>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [&>svg]:h-[18px] [&>svg]:w-[18px]",
              toneStyles[tone],
            )}
          >
            {icon}
          </span>
        </div>
        <div className="mt-auto min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
          </div>
          {caption && <div className="mt-2.5 text-xs text-muted-foreground">{caption}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
