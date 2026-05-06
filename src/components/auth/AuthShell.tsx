import { ReactNode } from "react";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: "#f0f4ff" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-primary-foreground text-xl font-bold shadow-[var(--shadow-elegant)]">
            N
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">NODI Portal</h1>
            <p className="text-xs text-muted-foreground">Digital consulting workspace</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
