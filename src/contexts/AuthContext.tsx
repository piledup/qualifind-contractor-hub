
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { 
  supabase, 
  filterById, 
  typedInsert, 
  typedUpdate, 
  castToBoolean, 
  convertDbProfileToUser 
} from "@/integrations/supabase/client";
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

  // Handle auth state changes, including email confirmations
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        // Handle various auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session && session.user) {
            await fetchUserProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (event === 'USER_UPDATED') {
          if (session && session.user) {
            await fetchUserProfile(session.user.id);
          }
        }
        
        if (!session) {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Checking existing session:", session?.user?.id);
      
      if (session && session.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', filterById(userId))
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }

      if (data) {
        console.log("User profile fetched:", data);
        // Convert database profile to User type
        const user = convertDbProfileToUser(data);
        setCurrentUser(user);
      } else {
        console.warn("No profile found for user:", userId);
        
        // If no profile exists, try to get basic user info and create a profile
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) throw userError;
          
          if (userData && userData.user) {
            // Create a minimal user object from auth data
            const minimalUser: User = {
              id: userData.user.id,
              email: userData.user.email || '',
              name: userData.user.user_metadata?.name || userData.user.email || 'Unknown User',
              role: (userData.user.user_metadata?.role as UserRole) || 'general-contractor',
              companyName: userData.user.user_metadata?.company_name || '',
              createdAt: new Date(),
              emailVerified: userData.user.email_confirmed_at ? true : false
            };
            
            setCurrentUser(minimalUser);
            
            // Try to create profile
            await typedInsert('profiles', {
              id: userData.user.id,
              email: userData.user.email || '',
              name: userData.user.user_metadata?.name || userData.user.email || 'Unknown User',
              role: userData.user.user_metadata?.role || 'general-contractor',
              company_name: userData.user.user_metadata?.company_name || '',
              email_verified: userData.user.email_confirmed_at ? true : false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } catch (createError) {
          console.error("Error creating profile from auth data:", createError);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

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
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', filterById(data.user.id))
            .single();

          if (profileError) {
            throw profileError;
          }

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
            // Convert database profile to User type
            const user = convertDbProfileToUser(profileData);
            setCurrentUser(user);
            return user;
          }
        } catch (profileErr) {
          console.error("Profile fetch error:", profileErr);
          return null;
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
      console.log("Starting registration process for:", email);
      
      // First create the user in Supabase auth
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
        console.error("Registration error:", error);
        
        // More descriptive user-facing error
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = "This email address is already registered. Please login instead.";
        }
        
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        throw error;
      }

      if (!data || !data.user) {
        console.error("No user data returned from registration");
        toast({
          title: "Registration failed",
          description: "Unable to create user account. Please try again later.",
          variant: "destructive"
        });
        return null;
      }

      console.log("Auth signup successful, user created:", data.user.id);

      // Wait for the database trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process invitation if it exists
      if (invitationCode && role === 'subcontractor') {
        console.log("Processing invitation code:", invitationCode);
        try {
          const { error: inviteError } = await supabase
            .rpc('verify_invitation_code', { code_param: invitationCode });

          if (inviteError) {
            console.error("Invitation verification error:", inviteError);
          } else {
            // Update invitation status
            const updateResult = await typedUpdate('invitations', { status: 'accepted' })
              .eq('code', invitationCode as any);
            
            console.log("Invitation accepted successfully");
          }
        } catch (inviteError) {
          console.error("Error processing invitation:", inviteError);
        }
      }

      // Check if the profile was created by the trigger
      try {
        const { data: profileData, error: profileFetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', filterById(data.user.id))
          .maybeSingle();
  
        if (profileFetchError) {
          console.error("Error fetching profile after registration:", profileFetchError);
        }
  
        // If profile doesn't exist, create it manually
        if (!profileData) {
          console.log("Profile not found, creating manually");
          // Create profile using helper
          const insertResult = await typedInsert('profiles', {
            id: data.user.id,
            email: email,
            name: name,
            role: role,
            company_name: companyName,
            email_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          const fallbackUser: User = {
            id: data.user.id,
            email: email,
            name: name,
            role: role,
            companyName: companyName,
            createdAt: new Date(),
            emailVerified: false
          };
          
          setCurrentUser(fallbackUser);
          
          toast({
            title: "Registration complete",
            description: "Your account was created successfully. Please check your email for verification.",
            variant: "default"
          });
          
          return fallbackUser;
        } else {
          // Profile was created by the trigger
          console.log("Profile created by trigger:", profileData);
          // Convert database profile to User type
          const user = convertDbProfileToUser(profileData);
          setCurrentUser(user);
          
          toast({
            title: "Registration successful",
            description: "Your account has been created successfully. Please check your email for verification."
          });
          
          return user;
        }
      } catch (profileError) {
        console.error("Error handling profile:", profileError);
        // Return minimal user info from auth
        const minimalUser: User = {
          id: data.user.id,
          email: email,
          name: name,
          role: role,
          companyName: companyName,
          createdAt: new Date(),
          emailVerified: false
        };
        
        setCurrentUser(minimalUser);
        return minimalUser;
      }
      
      // Send verification email
      if (data.user.email) {
        const emailSent = await sendEmailVerification();
        if (emailSent) {
          toast({
            title: "Verification email sent",
            description: "Please check your email to verify your account."
          });
        }
      }
      
      return null;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

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

      return Boolean(data);
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
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

