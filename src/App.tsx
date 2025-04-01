
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// General Contractor Pages
import GCDashboard from "./pages/gc/Dashboard";
import Subcontractors from "./pages/gc/Subcontractors";
import Projects from "./pages/gc/Projects";

// Subcontractor Pages
import SubDashboard from "./pages/sub/Dashboard";

// Common Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* General Contractor Routes */}
            <Route path="/dashboard" element={<GCDashboard />} />
            <Route path="/subcontractors" element={<Subcontractors />} />
            <Route path="/projects" element={<Projects />} />

            {/* Subcontractor Routes */}
            <Route path="/sub-dashboard" element={<SubDashboard />} />

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
