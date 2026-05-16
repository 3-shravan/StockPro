import { cn } from "@/lib/utils";
import { ArrowRight01Icon } from "hugeicons-react";
import { Link } from "react-router-dom";

interface OperationTileProps {
  to: string;
  title: string;
  desc: string;
  icon: any;
  featured?: boolean;
}

export const OperationTile = ({ to, title, desc, icon: Icon, featured = false }: OperationTileProps) => (
  <Link to={to} className="group block h-full">
    <div className={cn(
      "p-8 rounded-[2rem] transition-all duration-500 border h-full flex flex-col justify-end min-h-[220px] relative overflow-hidden",
      featured
        ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20 border-primary/20 hover:scale-[1.02]'
        : 'bg-white/[0.05] backdrop-blur-md border-none hover:bg-white/[0.08] hover:-translate-y-1.5 shadow-lg'
    )}>
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10",
        featured ? 'bg-white/20' : 'bg-primary/10 text-primary border border-primary/10 shadow-inner'
      )}>
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="font-bold text-2xl tracking-tight leading-none relative z-10">{title}</h4>
      <p className={cn(
        "text-xs mt-3 leading-relaxed font-medium uppercase tracking-wider relative z-10",
        featured ? 'text-white/70' : 'text-muted-foreground'
      )}>{desc}</p>

      <div className={cn(
        "mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0",
        featured ? 'text-white' : 'text-primary'
      )}>
        Execute Procedure <ArrowRight01Icon className="w-3 h-3" />
      </div>
    </div>
  </Link>
);
