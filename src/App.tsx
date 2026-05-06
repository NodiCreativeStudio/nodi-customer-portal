import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import AppLayout from "./components/AppLayout";
import Placeholder from "./pages/Placeholder";

const queryClient = new QueryClient();

const Wrap = ({ title, description }: { title: string; description?: string }) => (
  <AppLayout>
    <Placeholder title={title} description={description} />
  </AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Wrap title="Onboarding" description="Client onboarding workflow." />} />
            <Route path="/projects" element={<Wrap title="Projects" description="Track project status and milestones." />} />
            <Route path="/uploads" element={<Wrap title="Uploads" description="Documents and assets." />} />
            <Route path="/credentials" element={<Wrap title="Credentials" description="Service access details." />} />
            <Route path="/stack" element={<Wrap title="Tech Stack" description="Active services and renewals." />} />
            <Route path="/contacts" element={<Wrap title="Contacts" description="Key contact people." />} />
            <Route path="/downloads" element={<Wrap title="Downloads" description="Reports and resources." />} />
            <Route path="/admin" element={<Wrap title="Admin" description="Agency administration." />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
