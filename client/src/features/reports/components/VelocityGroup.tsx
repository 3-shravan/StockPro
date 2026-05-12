import { cn } from "@/lib/utils";

interface VelocityGroupProps {
  label: string;
  ids: number[];
  variant: 'primary' | 'warning' | 'destructive';
  productMap: Record<number, string>;
}

export const VelocityGroup = ({ label, ids, variant, productMap }: VelocityGroupProps) => {
  const colors = {
    primary: 'bg-primary/5 text-primary border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)]',
    warning: 'bg-amber-500/5 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    destructive: 'bg-rose-500/5 text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
  };

  return (
    <div className="space-y-5">
      <p className="text-[11px] font-black text-foreground/70 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-3">
        {ids.length > 0 ? ids.map(id => (
          <span
            key={id}
            className={cn(
              "px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wide border cursor-default transition-all hover:scale-105",
              colors[variant]
            )}
          >
            {productMap[id] || `#${id}`}
          </span>
        )) : (
          <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-wider italic">No activity peak detected</span>
        )}
      </div>
    </div>
  );
};
