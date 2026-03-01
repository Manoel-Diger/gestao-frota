import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-shadow duration-300 hover:shadow-elevated border-border/50",
        className
      )}>
        {/* Subtle gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary rounded-t-lg" />
        
        <CardContent className="p-5 pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          </div>
          {trend && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                trend.isPositive 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
