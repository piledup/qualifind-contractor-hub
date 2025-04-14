
import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { User, UserRole } from "../types";
import { supabase, mapDbProfileToUser, supabaseQuery } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabaseQuery<any>(() => 
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
      );

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      if (!data) {
        console.log("No profile found for user:", userId);
        return null;
      }

      // Convert database profile to user object
      return mapDbProfileToUser(data);
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log("Setting up auth state");
    
    // First set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state event:", event);
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to avoid recursive Supabase calls
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(user => {
              if (user) {
                setCurrentUser(user);
              } else {
                // If no profile exists but we have a session, create minimal user
                const minimalUser: User = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || session.user.email || 'Unknown User',
                  role: (session.user.user_metadata?.role as UserRole) || 'general-contractor',
                  companyName: session.user.user_metadata?.company_name || '',
                  createdAt: new Date(),
                  emailVerified: session.user.email_confirmed_at ? true : false
                };
                setCurrentUser(minimalUser);
              }
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      }
    );

    // Then check for existing session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        
        if (data.session?.user) {
          const user = await fetchUserProfile(data.session.user.id);
          
          if (user) {
            setCurrentUser(user);
          } else {
            // If no profile exists but we have a session, create minimal user
            const minimalUser: User = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: data.session.user.user_metadata?.name || data.session.user.email || 'Unknown User',
              role: (data.session.user.user_metadata?.role as UserRole) || 'general-contractor',
              companyName: data.session.user.user_metadata?.company_name || '',
              createdAt: new Date(),
              emailVerified: data.session.user.email_confirmed_at ? true : false
            };
            setCurrentUser(minimalUser);
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Create a profile in the database
  const createUserProfile = async (
    userId: string, 
    email: string, 
    name: string, 
    role: UserRole,
    companyName: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        email,
        name,
        role,
        company_name: companyName,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error("Error creating profile:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in createUserProfile:", error);
      return false;
    }
  };

  // Login function
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
        return null;
      }

      if (!data.user) {
        toast({
          title: "Login failed",
          description: "No user returned from login",
          variant: "destructive"
        });
        return null;
      }

      // Check if the user has the correct role
      const profileData = await fetchUserProfile(data.user.id);
      
      if (profileData) {
        if (profileData.role !== role) {
          // Role mismatch, sign out
          await supabase.auth.signOut();
          toast({
            title: "Access denied",
            description: `This account is not registered as a ${role.replace('-', ' ')}.`,
            variant: "destructive"
          });
          return null;
        }
        
        // Update session state (auth state change listener will handle the rest)
        return profileData;
      } else {
        // No profile found, try to create one
        const created = await createUserProfile(
          data.user.id,
          data.user.email || email,
          data.user.user_metadata?.name || email,
          role,
          data.user.user_metadata?.company_name || ''
        );
        
        if (created) {
          const newProfile = await fetchUserProfile(data.user.id);
          return newProfile;
        } else {
          // Create a minimal user if profile creation fails
          const minimalUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || email,
            role,
            companyName: data.user.user_metadata?.company_name || '',
            createdAt: new Date(),
            emailVerified: data.user.email_confirmed_at ? true : false
          };
          return minimalUser;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Register function
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
      // Create user in Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company_name: companyName,
            role
          },
          emailRedirectTo: `${window.location.origin}/update-password`
        }
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      if (!data.user) {
        toast({
          title: "Registration failed",
          description: "No user returned from registration",
          variant: "destructive"
        });
        return null;
      }

      // Create profile in database
      const created = await createUserProfile(
        data.user.id,
        email,
        name,
        role,
        companyName
      );

      if (!created) {
        console.warn("Profile creation failed during registration");
      }

      // Process invitation if it exists
      if (invitationCode && role === 'subcontractor') {
        try {
          const { error: inviteError } = await supabase
            .from('invitations')
            .update({ status: 'accepted' })
            .eq('code', invitationCode);

          if (inviteError) {
            console.error("Invitation update error:", inviteError);
          } else {
            console.log("Invitation accepted successfully");
          }
        } catch (inviteError) {
          console.error("Error processing invitation:", inviteError);
        }
      }

      // Create user object
      const newUser: User = {
        id: data.user.id,
        email,
        name,
        role,
        companyName,
        createdAt: new Date(),
        emailVerified: false
      };
      
      toast({
        title: "Registration complete",
        description: "Your account was created successfully. Please check your email for verification.",
      });
      
      return newUser;
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
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
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  // Update password function
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
      toast({
        title: "Password update failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  // Send email verification function
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
      toast({
        title: "Email verification failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  // Check if user has permission
  const hasPermission = async (permissionName: string): Promise<boolean> => {
    if (!currentUser) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('has_permission', { 
        user_id: currentUser.id, 
        permission_name: permissionName 
      });

      if (error) {
        console.error("Permission check error:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setSession(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out",
        variant: "destructive"
      });
    }
  };

  const value = {
    currentUser,
    session,
    loading,
    isAuthenticated: !!currentUser,
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    sendEmailVerification,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
