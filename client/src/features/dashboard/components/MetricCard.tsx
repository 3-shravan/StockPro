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
        isPositive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
        isNegative ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted/10 text-muted-foreground border-border"
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
    destructive: 'bg-destructive/10 text-destructive border-destructive/20 group-hover:bg-destructive group-hover:text-destructive-foreground',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white',
  };

  const content = (
    <Card className={cn(
      "rounded-[2.5rem] border-none bg-white/[0.05] backdrop-blur-xl shadow-app-card hover:shadow-app-hover transition-all duration-500 group relative overflow-hidden",
      to && "hover:-translate-y-2 cursor-pointer"
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] -mr-12 -mt-12 rounded-full group-hover:bg-primary/10 transition-colors" />
      
      <CardContent className="p-6 md:p-7 relative z-10">
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
            "font-black tracking-tighter tabular-nums leading-none",
            value.length > 10 ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl"
          )}>{value}</p>
          {trend && <TrendIndicator value={trend.value} label={trend.label} />}
          <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mt-4 truncate">
{hint}</p>
        </div>
        
      </CardContent>
    </Card>
  );

  return to ? <Link to={to} state={state} className="group block">{content}</Link> : content;
};
