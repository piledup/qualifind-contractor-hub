
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Building, Clipboard, Users, Home, FileText, LogOut, Mail } from "lucide-react";

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  
  // Define navigation items based on user role
  const getNavItems = () => {
    if (currentUser?.role === "general-contractor") {
      return [
        { label: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
        { label: "Subcontractors", icon: <Users size={20} />, path: "/subcontractors" },
        { label: "Projects", icon: <Building size={20} />, path: "/projects" },
        { label: "Invitations", icon: <Mail size={20} />, path: "/invitations" },
      ];
    } else {
      return [
        { label: "Dashboard", icon: <Home size={20} />, path: "/sub-dashboard" },
        { label: "General Contractors", icon: <Building size={20} />, path: "/general-contractors" },
        { label: "Projects", icon: <Clipboard size={20} />, path: "/projects" },
        { label: "Qualification", icon: <FileText size={20} />, path: "/qualification" },
      ];
    }
  };
  
  return (
    <aside className="w-64 bg-qualifind-blue text-white h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="text-qualifind-orange">QUALI</span>FIND
        </h1>
      </div>
      
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
            {currentUser?.role === "general-contractor" ? "General Contractor" : "Subcontractor"}
          </h2>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
              <span className="text-lg font-medium">
                {currentUser?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="ml-3">
              <p className="font-medium">{currentUser?.name || "User"}</p>
              <p className="text-sm text-gray-300">{currentUser?.companyName || ""}</p>
            </div>
          </div>
        </div>
        
        <nav>
          <ul className="space-y-1">
            {getNavItems().map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 text-sm rounded-md ${
                      isActive 
                        ? "bg-sidebar-accent text-qualifind-orange"
                        : "text-white hover:bg-sidebar-accent/50 transition-colors"
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <button
          onClick={() => logout()}
          className="w-full flex items-center px-4 py-2 text-sm rounded-md hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
