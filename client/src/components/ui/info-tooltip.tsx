import * as React from "react";
import { InformationCircleIcon } from "hugeicons-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export const InfoTooltip = ({ content, className }: InfoTooltipProps) => {
  const [show, setShow] = React.useState(false);

  return (
    <div 
      className={cn("relative inline-block ml-1.5 group", className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <InformationCircleIcon className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-primary transition-colors cursor-help" />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[11px] rounded-lg shadow-xl border border-border z-50 animate-in fade-in zoom-in duration-200">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
};
