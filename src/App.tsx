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
import TechStack from "./pages/TechStack";
import Contacts from "./pages/Contacts";
import Downloads from "./pages/Downloads";
import AdminGuard from "./components/AdminGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClientDetail from "./pages/admin/AdminClientDetail";

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
            <Route path="/credentials" element={<AppLayout><Credentials /></AppLayout>} />
            <Route path="/stack" element={<AppLayout><TechStack /></AppLayout>} />
            <Route path="/contacts" element={<AppLayout><Contacts /></AppLayout>} />
            <Route path="/downloads" element={<AppLayout><Downloads /></AppLayout>} />
            <Route path="/admin" element={<AppLayout><AdminGuard><AdminDashboard /></AdminGuard></AppLayout>} />
            <Route path="/admin/clients/:id" element={<AppLayout><AdminGuard><AdminClientDetail /></AdminGuard></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
