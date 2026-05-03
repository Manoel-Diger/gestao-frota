import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MonthYearValue = string; // "all" or "YYYY-MM"

interface MonthYearFilterProps {
  value: MonthYearValue;
  onChange: (v: MonthYearValue) => void;
  availableDates: (string | null | undefined)[];
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MonthYearFilter({ value, onChange, availableDates }: MonthYearFilterProps) {
  const options = Array.from(
    new Set(
      availableDates
        .filter(Boolean)
        .map((d) => {
          const dt = new Date((d as string) + "T12:00:00");
          if (isNaN(dt.getTime())) return null;
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, "0");
          return `${y}-${m}`;
        })
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => (a < b ? 1 : -1));

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os períodos</SelectItem>
        {options.map((opt) => {
          const [y, m] = opt.split("-");
          return (
            <SelectItem key={opt} value={opt}>
              {MONTH_NAMES[parseInt(m, 10) - 1]} / {y}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function matchesMonthYear(dateStr: string | null | undefined, value: MonthYearValue): boolean {
  if (value === "all") return true;
  if (!dateStr) return false;
  const dt = new Date(dateStr + "T12:00:00");
  if (isNaN(dt.getTime())) return false;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}` === value;
}