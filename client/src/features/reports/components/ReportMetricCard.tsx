import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Chart01Icon } from "hugeicons-react";

interface ReportMetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: any;
  color?: 'primary' | 'destructive' | 'emerald' | 'amber' | 'warning';
  onClick?: () => void;
  trend?: {
    value: string;
    label: string;
  };
}

export const ReportMetricCard = ({ label, value, hint, icon: Icon, color = 'primary', onClick, trend }: ReportMetricCardProps) => {
  const colors: any = {
    primary: 'text-primary bg-primary/10 border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground',
    destructive: 'text-rose-400 bg-rose-400/10 border-rose-400/20 group-hover:bg-rose-400 group-hover:text-white',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white',
    amber: 'text-amber-600 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white',
    warning: 'text-amber-600 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white',
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden group cursor-pointer transition-all duration-500 rounded-[2.5rem] border-border/60 backdrop-blur-xl shadow-app-card hover:shadow-app-hover hover:-translate-y-2",
        color === 'primary' ? "bg-primary/[0.03]" : 
        color === 'destructive' ? "bg-rose-400/[0.04]" : 
        (color === 'warning' || color === 'amber') ? "bg-amber-500/[0.04]" : 
        color === 'emerald' ? "bg-emerald-500/[0.03]" : "bg-card/40"
      )}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] -mr-12 -mt-12 rounded-full group-hover:bg-primary/10 transition-colors" />
      
      <CardContent className="p-6 md:p-7 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">{label}</p>
          </div>
          <div className={cn("w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner shrink-0", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-3xl md:text-4xl font-black tracking-tighter tabular-nums leading-none truncate">{value}</h3>
          
          {trend ? (
            <div className="flex items-center gap-2 pt-1">
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full border",
                trend.value.startsWith('+') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                trend.value.startsWith('-') ? "bg-rose-400/10 text-rose-400 border-rose-400/20" : "bg-muted text-muted-foreground border-border"
              )}>
                 <Chart01Icon className="w-3 h-3" />
                 <span className="text-[10px] font-black tabular-nums">{trend.value}</span>
              </div>
              <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider truncate">
                {trend.label}
              </p>
            </div>
          ) : null}

          <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mt-4 truncate">
            {hint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
