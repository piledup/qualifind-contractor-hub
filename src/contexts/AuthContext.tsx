
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { mockUsers } from "../data/mockData";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  register: (email: string, password: string, name: string, companyName: string, role: UserRole) => Promise<User>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock login function - in real app would call API
  const login = async (email: string, password: string, role: UserRole): Promise<User> => {
    setLoading(true);
    try {
      // For demo purposes, just find a user with matching email and role
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
      
      if (!user) {
        throw new Error("Invalid credentials or user not found");
      }
      
      // Store user in local storage for session persistence
      localStorage.setItem("currentUser", JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  // Mock register function - in real app would call API
  const register = async (
    email: string, 
    password: string, 
    name: string, 
    companyName: string, 
    role: UserRole
  ): Promise<User> => {
    setLoading(true);
    try {
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        throw new Error("User with this email already exists");
      }
      
      // Create new user (in real app would be done by backend)
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        companyName,
        createdAt: new Date()
      };
      
      // Store user in local storage
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      setCurrentUser(newUser);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!currentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
