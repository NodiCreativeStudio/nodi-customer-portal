import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Upload, Layers, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const stats = [
  { label: "Active projects", value: "—", icon: FolderKanban },
  { label: "Uploads", value: "—", icon: Upload },
  { label: "Stack services", value: "—", icon: Layers },
  { label: "Credentials", value: "—", icon: KeyRound },
];

export default function Dashboard() {
  const { user, role } = useAuth();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          {role === "admin"
            ? "Agency overview across all clients."
            : "Your workspace at a glance."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Use the sidebar to navigate. Future updates will populate this dashboard with live data from your projects, uploads and tech stack.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
