import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: any;
  };
  className?: string;
  containerClassName?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  containerClassName
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-12 md:p-20 rounded-[2.5rem] border border-dashed border-border/60 bg-card/20 backdrop-blur-sm animate-in fade-in zoom-in duration-500",
      containerClassName
    )}>
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-[2rem] bg-card border border-border shadow-app-card flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <Icon className="w-10 h-10 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
      </div>
      
      <div className={cn("max-w-md space-y-3", className)}>
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground uppercase">{title}</h3>
        <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
          {description}
        </p>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-10 px-8 h-12 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 shadow-app-subtle shadow-primary/20 flex items-center gap-3"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
};
