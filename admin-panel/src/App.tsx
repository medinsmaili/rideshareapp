import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import AdminLayout from "@/components/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import RidesPage from "@/pages/RidesPage";
import BookingsPage from "@/pages/BookingsPage";
import VehiclesPage from "@/pages/VehiclesPage";
import ReportsPage from "@/pages/ReportsPage";
import VerificationsPage from "@/pages/VerificationsPage";
import CitiesPage from "@/pages/CitiesPage";
import LanguagesPage from "@/pages/LanguagesPage";
import TranslationsPage from "@/pages/TranslationsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import MeetingPointsPage from "@/pages/MeetingPointsPage";
import LogsPage from "@/pages/LogsPage";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/rides" element={<RidesPage />} />
      <Route path="/bookings" element={<BookingsPage />} />
      <Route path="/vehicles" element={<VehiclesPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/verifications" element={<VerificationsPage />} />
      <Route path="/cities" element={<CitiesPage />} />
      <Route path="/meeting-points" element={<MeetingPointsPage />} />
      <Route path="/languages" element={<LanguagesPage />} />
      <Route path="/translations" element={<TranslationsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/logs" element={<LogsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
