import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export type Period = '7d' | '30d' | '90d' | 'all';

interface PeriodFilterProps {
  selected: Period;
  onChange: (period: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'all', label: 'Tudo' },
];

export function PeriodFilter({ selected, onChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Calendar className="h-4 w-4 text-muted-foreground ml-2 mr-1" />
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={selected === p.value ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs px-3 ${
            selected === p.value 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

export function filterByPeriod<T extends { data?: string; created_at?: string }>(
  items: T[],
  period: Period,
  dateField: 'data' | 'created_at' = 'created_at'
): T[] {
  if (period === 'all') return items;
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return items.filter(item => {
    const dateValue = item[dateField];
    if (!dateValue) return false;
    return new Date(dateValue) >= cutoff;
  });
}
