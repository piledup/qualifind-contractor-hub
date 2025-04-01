
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";

// General Contractor Pages
import GCDashboard from "./pages/gc/Dashboard";
import Subcontractors from "./pages/gc/Subcontractors";
import Projects from "./pages/gc/Projects";

// Subcontractor Pages
import SubDashboard from "./pages/sub/Dashboard";

// Common Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, loading, currentUser } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Common Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* General Contractor Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['general-contractor']}>
                  <GCDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subcontractors" 
              element={
                <ProtectedRoute allowedRoles={['general-contractor']}>
                  <Subcontractors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute allowedRoles={['general-contractor']}>
                  <Projects />
                </ProtectedRoute>
              } 
            />

            {/* Subcontractor Routes */}
            <Route 
              path="/sub-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['subcontractor']}>
                  <SubDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
