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
      const industries = ["retail", "wellness"] as const;
      const projectStatuses = ["planning", "in_progress", "completed"] as const;
      const taskStatuses = ["todo", "in_progress", "done"] as const;
      const taskPriorities = ["low", "medium", "high"] as const;
      const stamp = Date.now().toString().slice(-5);

      const clientsPayload = industries.map((ind, i) => ({
        company_name: `Test ${ind[0].toUpperCase() + ind.slice(1)} Co ${stamp}-${i + 1}`,
        industry: ind as never,
        status: "active" as never,
        contact_email: user.email,
        contact_phone: "+39 333 0000000",
        website: `https://${ind}-${stamp}.example.com`,
        address: "Via Roma 1, Milano",
        employee_count: "10-50",
      }));
      const { data: clients, error: cErr } = await supabase
        .from("clients").insert(clientsPayload as never).select();
      if (cErr) throw cErr;
      if (!clients?.length) throw new Error("No clients created");

      // Link current user to first fake client so data is immediately visible
      await supabase.from("profiles")
        .update({ company_id: clients[0].id }).eq("id", user.id);

      // Projects: 3 per client
      const projectsPayload = clients.flatMap((c, ci) =>
        Array.from({ length: 3 }).map((_, pi) => ({
          client_id: c.id,
          project_name: `Project ${ci + 1}.${pi + 1} — ${c.company_name}`,
          description: "Auto-generated test project",
          status: projectStatuses[pi % projectStatuses.length] as never,
          start_date: new Date(Date.now() - (30 - pi * 5) * 86400000).toISOString().slice(0, 10),
          end_date: new Date(Date.now() + (30 + pi * 10) * 86400000).toISOString().slice(0, 10),
          budget: 2000 + pi * 1500,
        }))
      );
      const { data: projects, error: pErr } = await supabase
        .from("projects").insert(projectsPayload as never).select();
      if (pErr) throw pErr;

      // Tasks: 5 per project
      const tasksPayload = (projects ?? []).flatMap((p) =>
        Array.from({ length: 5 }).map((_, ti) => ({
          project_id: p.id,
          title: `Task ${ti + 1} for ${p.project_name}`,
          description: "Auto-generated task",
          status: taskStatuses[ti % taskStatuses.length] as never,
          priority: taskPriorities[ti % taskPriorities.length] as never,
          due_date: new Date(Date.now() + (ti + 1) * 5 * 86400000).toISOString().slice(0, 10),
        }))
      );
      if (tasksPayload.length) {
        const { error: tErr } = await supabase.from("tasks").insert(tasksPayload as never);
        if (tErr) throw tErr;
      }

      // 3 services on the linked client
      const stackPayload = [
        { service_name: "ManyChat", category: "whatsapp", cost_monthly: 29 },
        { service_name: "Mailchimp", category: "email", cost_monthly: 49 },
        { service_name: "LoyaltyLion", category: "loyalty", cost_monthly: 199 },
      ].map((s) => ({
        client_id: clients[0].id,
        service_name: s.service_name,
        category: s.category as never,
        cost_monthly: s.cost_monthly,
        status: "active" as never,
        renewal_date: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        auto_renew: true,
      }));
      const { error: sErr } = await supabase.from("tech_stack").insert(stackPayload as never);
      if (sErr) throw sErr;

      // 2 credentials
      const credsPayload = [
        { service_name: "Instagram", category: "social", username: "test@nodi.io", password: "demo-pass-123", access_url: "https://instagram.com" },
        { service_name: "Gmail", category: "email", username: "info@testco.com", password: "demo-pass-456", access_url: "https://mail.google.com" },
      ].map((c) => ({ ...c, client_id: clients[0].id, platform: c.category }));
      const { error: crErr } = await supabase.from("credentials").insert(credsPayload as never);
      if (crErr) throw crErr;

      // 5 upload metadata records
      const uploadsPayload = Array.from({ length: 5 }).map((_, i) => ({
        client_id: clients[0].id,
        file_name: `sample-document-${i + 1}.pdf`,
        file_size: 100000 + i * 50000,
        file_type: "application/pdf",
        folder: "general",
        uploaded_by: user.id,
      }));
      const { error: uErr } = await supabase.from("uploads").insert(uploadsPayload as never);
      if (uErr) throw uErr;

      toast.success("✓ Test data created successfully");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      toast.error("Seed failed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const clearTestData = async () => {
    if (!user) return;
    if (!confirm("Delete all test clients (matching 'Test ') and their related data?")) return;
    setSeeding(true);
    try {
      const { data: clients } = await supabase
        .from("clients").select("id").ilike("company_name", "Test %");
      const ids = (clients ?? []).map((c) => c.id);
      if (ids.length) {
        const { data: projs } = await supabase.from("projects").select("id").in("client_id", ids);
        const projIds = (projs ?? []).map((p) => p.id);
        if (projIds.length) await supabase.from("tasks").delete().in("project_id", projIds);
        await supabase.from("projects").delete().in("client_id", ids);
        await supabase.from("tech_stack").delete().in("client_id", ids);
        await supabase.from("credentials").delete().in("client_id", ids);
        await supabase.from("uploads").delete().in("client_id", ids);
        // Unlink user profile if pointing at a deleted client
        await supabase.from("profiles").update({ company_id: null }).eq("id", user.id).in("company_id", ids);
        await supabase.from("clients").delete().in("id", ids);
      }
      toast.success("✓ Test data cleared");
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      toast.error("Clear failed: " + e.message);
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
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={seedTestData} disabled={seeding}>
              {seeding ? "Working..." : "Generate test data"}
            </Button>
            <Button variant="outline" onClick={clearTestData} disabled={seeding}>
              Clear test data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
