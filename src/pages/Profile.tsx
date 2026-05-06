import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, User as UserIcon, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, role } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const toggleRole = async (checked: boolean) => {
    setSwitching(true);
    const newRole = checked ? "admin" : "client";
    const { error } = await supabase.rpc("set_my_role", { _role: newRole });
    setSwitching(false);
    if (error) {
      toast.error("Failed to switch role: " + error.message);
      return;
    }
    toast.success(`Switched to ${newRole} mode. Reloading...`);
    setTimeout(() => window.location.reload(), 600);
  };

  const seedTestData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      // create a fake client company
      const { data: client, error: cErr } = await supabase
        .from("clients")
        .insert({
          company_name: `Test Co ${Math.floor(Math.random() * 1000)}`,
          industry: "tech" as never,
          status: "active" as never,
          contact_email: user.email,
        })
        .select()
        .single();
      if (cErr) throw cErr;

      const { data: project, error: pErr } = await supabase
        .from("projects")
        .insert({
          client_id: client.id,
          project_name: "Sample Project",
          description: "Auto-generated test project",
          status: "in_progress" as never,
          budget: 5000,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      await supabase.from("tasks").insert([
        { project_id: project.id, title: "Kickoff meeting", status: "done" as never, priority: "high" as never },
        { project_id: project.id, title: "Design mockups", status: "in_progress" as never, priority: "medium" as never },
        { project_id: project.id, title: "Deploy MVP", status: "todo" as never, priority: "high" as never },
      ]);

      await supabase.from("tech_stack").insert([
        { client_id: client.id, service_name: "ManyChat", category: "whatsapp" as never, cost_monthly: 29, status: "active" as never },
        { client_id: client.id, service_name: "Mailchimp", category: "email" as never, cost_monthly: 49, status: "active" as never },
      ]);

      toast.success("Test data created");
    } catch (e: any) {
      toast.error("Seed failed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and testing tools.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user?.email}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current role</span>
            <Badge variant={isAdmin ? "default" : "secondary"}>{role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Admin Mode</CardTitle>
          <CardDescription>
            Toggle between client and admin to test admin features without creating a separate account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{isAdmin ? "Admin mode active" : "Client mode active"}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "You have full administrative access." : "Switch on to access the admin panel."}
              </p>
            </div>
            <Switch checked={isAdmin} disabled={switching} onCheckedChange={toggleRole} />
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/admin")} className="w-full">
              Open Admin Panel
            </Button>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Test Data</CardTitle>
            <CardDescription>Seed the database with a fake client, project, tasks and tech stack.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={seedTestData} disabled={seeding}>
              {seeding ? "Creating..." : "Generate test data"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
