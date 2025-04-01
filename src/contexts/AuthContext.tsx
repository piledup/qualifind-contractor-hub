
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (
    email: string, 
    password: string, 
    name: string, 
    companyName: string, 
    role: UserRole,
    invitedBy?: string,
    invitationCode?: string
  ) => Promise<User | null>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  isAuthenticated: boolean;
  sendEmailVerification: () => Promise<boolean>;
  hasPermission: (permissionName: string) => Promise<boolean>;
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

  // Initialize auth on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && session.user) {
          fetchUserProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile data from profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const user: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          companyName: data.company_name || '',
          createdAt: new Date(data.created_at),
          emailVerified: data.email_verified || false,
          lastSignIn: data.last_sign_in ? new Date(data.last_sign_in) : undefined
        };
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Login with email and password
  const login = async (email: string, password: string, role: UserRole): Promise<User | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      if (data.user) {
        // Fetch user profile to get role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Check if role matches
        if (profileData && profileData.role !== role) {
          await supabase.auth.signOut();
          toast({
            title: "Access denied",
            description: `This account is not registered as a ${role.replace('-', ' ')}.`,
            variant: "destructive"
          });
          setCurrentUser(null);
          return null;
        }

        if (profileData) {
          const user: User = {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            role: profileData.role as UserRole,
            companyName: profileData.company_name || '',
            createdAt: new Date(profileData.created_at),
            emailVerified: profileData.email_verified || false,
            lastSignIn: profileData.last_sign_in ? new Date(profileData.last_sign_in) : undefined
          };
          setCurrentUser(user);
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (
    email: string, 
    password: string, 
    name: string, 
    companyName: string, 
    role: UserRole,
    invitedBy?: string,
    invitationCode?: string
  ): Promise<User | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company_name: companyName,
            role
          }
        }
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      if (data.user) {
        // If registration came from invitation, update invitation status
        if (invitationCode && role === 'subcontractor') {
          const { error: inviteError } = await supabase
            .rpc('verify_invitation_code', { code_param: invitationCode })
            .single();

          if (!inviteError) {
            // Update the invitation status
            const { error: updateError } = await supabase
              .from('invitations')
              .update({ status: 'accepted' })
              .eq('code', invitationCode);
            
            if (updateError) {
              console.error("Error updating invitation:", updateError);
            }
          }
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          role,
          companyName,
          createdAt: new Date(),
          emailVerified: false,
          lastSignIn: undefined
        };
        setCurrentUser(user);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created successfully."
        });
        
        return user;
      }
      return null;
    } catch (error) {
      console.error("Registration error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send password reset email
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions",
      });
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      return false;
    }
  };

  // Update password
  const updatePassword = async (password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      return true;
    } catch (error) {
      console.error("Password update error:", error);
      return false;
    }
  };

  // Send email verification
  const sendEmailVerification = async (): Promise<boolean> => {
    if (!currentUser) {
      return false;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email
      });

      if (error) {
        toast({
          title: "Email verification failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account",
      });
      return true;
    } catch (error) {
      console.error("Email verification error:", error);
      return false;
    }
  };

  // Check if user has specific permission
  const hasPermission = async (permissionName: string): Promise<boolean> => {
    if (!currentUser) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('has_permission', { 
          user_id: currentUser.id, 
          permission_name: permissionName 
        });

      if (error) {
        console.error("Permission check error:", error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    isAuthenticated: !!currentUser,
    sendEmailVerification,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
