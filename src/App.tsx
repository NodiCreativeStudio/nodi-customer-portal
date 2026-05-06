import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword";
import AppLayout from "./components/AppLayout";
import Placeholder from "./pages/Placeholder";
import Onboarding from "./pages/Onboarding";
import ProjectsList from "./pages/projects/ProjectsList";
import ProjectDetail from "./pages/projects/ProjectDetail";
import Uploads from "./pages/Uploads";
import Credentials from "./pages/Credentials";

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
            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<AppLayout><Onboarding /></AppLayout>} />
            <Route path="/projects" element={<AppLayout><ProjectsList /></AppLayout>} />
            <Route path="/projects/:id" element={<AppLayout><ProjectDetail /></AppLayout>} />
            <Route path="/uploads" element={<AppLayout><Uploads /></AppLayout>} />
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
