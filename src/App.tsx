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
import Profile from "./pages/Profile";
import { ProtectedOnboardingRoute } from "./components/ProtectedOnboardingRoute";

const queryClient = new QueryClient();

const Wrap = ({ title, description }: { title: string; description?: string }) => (
  <AppLayout>
    <Placeholder title={title} description={description} />
  </AppLayout>
);

const Guarded = ({ children }: { children: React.ReactNode }) => (
  <ProtectedOnboardingRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedOnboardingRoute>
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
            <Route path="/" element={<ProtectedOnboardingRoute><Index /></ProtectedOnboardingRoute>} />
            <Route path="/onboarding" element={<AppLayout><Onboarding /></AppLayout>} />
            <Route path="/projects" element={<Guarded><ProjectsList /></Guarded>} />
            <Route path="/projects/:id" element={<Guarded><ProjectDetail /></Guarded>} />
            <Route path="/uploads" element={<Guarded><Uploads /></Guarded>} />
            <Route path="/credentials" element={<Guarded><Credentials /></Guarded>} />
            <Route path="/stack" element={<Guarded><TechStack /></Guarded>} />
            <Route path="/contacts" element={<Guarded><Contacts /></Guarded>} />
            <Route path="/downloads" element={<Guarded><Downloads /></Guarded>} />
            <Route path="/profile" element={<Guarded><Profile /></Guarded>} />
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
