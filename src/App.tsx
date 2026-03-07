import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "./components/AppLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddTrade = lazy(() => import("./pages/AddTrade"));
const TradeList = lazy(() => import("./pages/TradeList"));
const Insights = lazy(() => import("./pages/Insights"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Psychology = lazy(() => import("./pages/Psychology"));
const AICoach = lazy(() => import("./pages/AICoach"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const BrokerSync = lazy(() => import("./pages/BrokerSync"));
const SessionAnalytics = lazy(() => import("./pages/SessionAnalytics"));
const RiskCalculator = lazy(() => import("./pages/RiskCalculator"));

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoutes />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-trade" element={<AddTrade />} />
                <Route path="/trades" element={<TradeList />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/psychology" element={<Psychology />} />
                <Route path="/coach" element={<AICoach />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/broker-sync" element={<BrokerSync />} />
                <Route path="/session-analytics" element={<SessionAnalytics />} />
                <Route path="/risk-calculator" element={<RiskCalculator />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
