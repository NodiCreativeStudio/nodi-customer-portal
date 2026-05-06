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
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>This module will be implemented in upcoming iterations.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The data model is already in place — UI work follows.
        </CardContent>
      </Card>
    </div>
  );
}
