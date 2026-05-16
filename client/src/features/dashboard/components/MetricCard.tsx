import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Chart01Icon } from "hugeicons-react";
import { Link } from "react-router-dom";

export const TrendIndicator = ({ value, label }: { value: string, label: string }) => {
  const isPositive = value.startsWith('+');
  const isNegative = value.startsWith('-');

  return (
    <div className="flex items-center gap-1.5 mt-3">
      <div className={cn(
        "flex items-center gap-0.5 px-2 py-0.5 rounded-full border",
        isPositive ? "bg-primary/10 text-primary border-primary/20" :
          isNegative ? "bg-status-error/10 text-status-error border-status-error/20" : "bg-muted/10 text-muted-foreground border-border"
      )}>
        <Chart01Icon className="w-3 h-3" />
        <span className="text-[10px] font-black tabular-nums">{value}</span>
      </div>
      <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">{label}</p>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: any;
  color?: 'primary' | 'destructive' | 'warning';
  to?: string;
  state?: any;
  trend?: {
    value: string;
    label: string;
  };
}

export const MetricCard = ({ label, value, hint, icon: Icon, color = 'primary', to, state, trend }: MetricCardProps) => {
  const colors = {
    primary: 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground',
    destructive: 'bg-status-error/10 text-status-error border-status-error/20 group-hover:bg-status-error group-hover:text-white',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20 group-hover:bg-status-warning group-hover:text-white',
  };

  const content = (
    <Card className={cn(
      "rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-sm hover:border-border/60 transition-all duration-300 group relative overflow-hidden",
      to && "cursor-pointer"
    )}>

      <CardContent className="p-5 md:p-6 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider">{label}</p>
          </div>
          <div className={cn("w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner shrink-0", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-4">
          <p className={cn(
            "font-bold tracking-tight tabular-nums leading-none whitespace-nowrap",
            "text-2xl md:text-3xl"
          )}>{value}</p>
          {trend && <TrendIndicator value={trend.value} label={trend.label} />}
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mt-4 truncate">
            {hint}</p>
        </div>

      </CardContent>
    </Card>
  );

  return to ? <Link to={to} state={state} className="group block">{content}</Link> : content;
};
