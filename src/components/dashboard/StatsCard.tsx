import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MetricCard, MetricTone } from "@/components/shared/MetricCard";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  tone?: MetricTone;
  className?: string;
}

export function StatsCard({ title, value, icon, trend, tone = "primary", className }: StatsCardProps) {
  return (
    <MetricCard
      title={title}
      value={value}
      icon={icon}
      tone={tone}
      className={className}
      caption={
        trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
        )
      }
    />
  );
}
