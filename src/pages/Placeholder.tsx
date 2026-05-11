import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </header>
      <Card>
        <CardHeader>
          <CardTitle>In arrivo</CardTitle>
          <CardDescription>Questo modulo sarà implementato nelle prossime iterazioni.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Il modello dati è già pronto — manca solo l'interfaccia.
        </CardContent>
      </Card>
    </div>
  );
}
