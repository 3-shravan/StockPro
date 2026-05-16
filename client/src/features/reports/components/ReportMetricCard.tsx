import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Chart01Icon } from "hugeicons-react";

interface ReportMetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: any;
  color?: 'primary' | 'destructive' | 'success' | 'warning';
  onClick?: () => void;
  trend?: {
    value: string;
    label: string;
  };
}

export const ReportMetricCard = ({ label, value, hint, icon: Icon, color = 'primary', onClick, trend }: ReportMetricCardProps) => {
  const colors: any = {
    primary: 'text-primary bg-primary/10 border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground',
    destructive: 'text-status-error bg-status-error/10 border-status-error/20 group-hover:bg-status-error group-hover:text-white',
    success: 'text-primary bg-primary/10 border-primary/20 group-hover:bg-primary group-hover:text-white',
    warning: 'text-status-warning bg-status-warning/10 border-status-warning/20 group-hover:bg-status-warning group-hover:text-white',
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden group cursor-pointer transition-all duration-300 rounded-3xl border border-border/40 backdrop-blur-xl shadow-sm hover:border-border/60",
        color === 'primary' ? "bg-primary/[0.03]" :
          color === 'destructive' ? "bg-status-error/[0.04]" :
            color === 'warning' ? "bg-status-warning/[0.04]" :
              color === 'success' ? "bg-primary/[0.03]" : "bg-card/40"
      )}
      onClick={onClick}
    >

      <CardContent className="p-5 md:p-6 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">{label}</p>
          </div>
          <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums leading-none truncate">{value}</h3>

          {trend ? (
            <div className="flex items-center gap-2 pt-1">
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full border",
                trend.value.startsWith('+') ? "bg-primary/10 text-primary border-primary/20" :
                  trend.value.startsWith('-') ? "bg-status-error/10 text-status-error border-status-error/20" : "bg-muted text-muted-foreground border-border"
              )}>
                <Chart01Icon className="w-3 h-3" />
                <span className="text-[10px] font-bold tabular-nums">{trend.value}</span>
              </div>
              <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest truncate">
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
