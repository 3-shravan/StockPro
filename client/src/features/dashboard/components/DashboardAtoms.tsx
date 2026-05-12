import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

export const WidgetContainer = ({ 
  title, 
  subtitle, 
  children, 
  action, 
  className,
  headerClassName 
}: { 
  title: string; 
  subtitle?: string; 
  children: ReactNode; 
  action?: ReactNode;
  className?: string;
  headerClassName?: string;
}) => (
  <Card className={cn("rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden flex flex-col", className)}>
    <CardHeader className={cn("p-6 pb-4 border-b border-border/30 bg-muted/5", headerClassName)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </CardHeader>
    <CardContent className="p-0 flex-1">
      {children}
    </CardContent>
  </Card>
);

export const TaskItem = ({ 
  icon: Icon, 
  title, 
  desc, 
  action, 
  type = 'primary' 
}: { 
  icon: any; 
  title: string; 
  desc: string; 
  action: ReactNode;
  type?: 'primary' | 'success' | 'warning' | 'destructive';
}) => {
  const colors = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group border-b border-border/30 last:border-0">
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300", colors[type])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold group-hover:text-primary transition-colors">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      {action}
    </div>
  );
};
