
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface MainLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  roles?: string[];
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children,
  requireAuth = true,
  roles = []
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If specific roles are required, check if current user has one of those roles
  if (roles.length > 0 && (!currentUser || !roles.includes(currentUser.role))) {
    return <Navigate to="/unauthorized" />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {isAuthenticated && <Sidebar />}
      <div className="flex flex-col flex-1 overflow-hidden">
        {isAuthenticated && <TopBar />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-qualifind-light">
          {children}
        </main>
      </div>
    </div>
  );
};
