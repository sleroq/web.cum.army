import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
}

const Tooltip = ({ children, text }: TooltipProps) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-surface/90 px-2 py-1 text-xs text-foreground opacity-0 transition-opacity sm:group-hover:opacity-100 pointer-events-none z-50 border border-foreground/10 backdrop-blur-sm shadow-md">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
