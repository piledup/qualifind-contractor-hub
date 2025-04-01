
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TopBar: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 py-3 px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-qualifind-blue">
          {window.location.pathname.split('/')[1].charAt(0).toUpperCase() + 
            window.location.pathname.split('/')[1].slice(1) || "Dashboard"}
        </h1>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="relative"
          >
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-qualifind-orange text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              3
            </span>
          </Button>
          
          <div className="text-right">
            <p className="text-sm font-medium">{currentUser?.name}</p>
            <p className="text-xs text-gray-500">{currentUser?.role === "general-contractor" ? "GC" : "Subcontractor"}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
