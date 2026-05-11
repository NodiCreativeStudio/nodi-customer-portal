import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border/70 bg-background/60 backdrop-blur-md px-3.5 py-2 text-sm ring-offset-background transition-all duration-200 ease-out placeholder:text-muted-foreground hover:border-border focus-visible:outline-none focus-visible:border-primary focus-visible:bg-background/80 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
