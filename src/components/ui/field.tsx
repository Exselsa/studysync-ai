import * as React from "react";
import { cn } from "@/lib/cn";

export function FieldGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-4 w-full", className)} {...props}>
      {children}
    </div>
  );
}

export function Field({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)} {...props}>
      {children}
    </div>
  );
}

export function FieldLabel({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 select-none", className)} {...props}>
      {children}
    </label>
  );
}

export function FieldDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[11px] text-muted-foreground leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function FieldError({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-semibold shadow-md flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}
