import { useEffect, useState } from "react";
import { ExternalLink, PackageOpen, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientTechStack } from "@/hooks/useClientTechStack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function TechStack() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setCompanyId(data?.company_id ?? null));
  }, [user]);

  const { tools, loading } = useClientTechStack(companyId);

  return (
    <div className="text-slate-950 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">🛠️ Stack Tecnologico</h1>
        <p className="text-muted-foreground mt-1">
          Le tecnologie che utilizziamo per far crescere la tua attività
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              Lo stack tecnologico sarà definito durante il tuo percorso Nodi
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Tornerai qui a scoprire le tecnologie che implementeremo per te
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  {tool.icon_url ? (
                    <img
                      src={tool.icon_url}
                      alt={tool.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Wrench className="h-5 w-5" />
                    </div>
                  )}
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Cos'è: </span>
                    <span className="text-muted-foreground">{tool.description_what}</span>
                  </p>
                  <p>
                    <span className="font-medium">Cosa fa: </span>
                    <span className="text-muted-foreground">{tool.description_do}</span>
                  </p>
                  <p>
                    <span className="font-medium">Perché lo usiamo: </span>
                    <span className="text-muted-foreground">{tool.description_why}</span>
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-auto self-start">
                  <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                    Scopri di più <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
