import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, user, role } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth/login" replace />;
  if (role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold">Admin access required</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view this area.</p>
      </div>
    );
  }
  return <>{children}</>;
}
