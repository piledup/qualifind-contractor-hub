
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
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
      console.log("Checking existing session:", session?.user?.id);
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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }

      if (data) {
        console.log("User profile fetched:", data);
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
      } else {
        console.warn("No profile found for user:", userId);
        setCurrentUser(null);
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
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
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
      console.log("Registration data:", { email, name, companyName, role });
      
      // First create the user in Supabase auth
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
        console.error("Registration error details:", error);
        
        // Handle specific error cases
        if (error.message.includes('already registered')) {
          toast({
            title: "Email already registered",
            description: "This email address is already in use. Please login instead.",
            variant: "destructive"
          });
        } else if (error.message.includes('Database error')) {
          toast({
            title: "Database error encountered",
            description: "We're experiencing technical difficulties. Trying alternate registration method...",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Registration failed",
            description: error.message || "There was a problem creating your account",
            variant: "destructive"
          });
          throw error;
        }
      }

      if (!data || !data.user) {
        console.error("No user data returned from sign up");
        toast({
          title: "Registration failed",
          description: "Unable to create user account. Please try again later.",
          variant: "destructive"
        });
        return null;
      }

      console.log("Auth sign up successful:", data);

      // Process invitation if it exists
      if (invitationCode && role === 'subcontractor') {
        try {
          console.log("Processing invitation code:", invitationCode);
          const { error: inviteError } = await supabase
            .rpc('verify_invitation_code', { code_param: invitationCode })
            .single();

          if (inviteError) {
            console.error("Invitation verification error:", inviteError);
          } else {
            const { error: updateError } = await supabase
              .from('invitations')
              .update({ status: 'accepted' })
              .eq('code', invitationCode);
            
            if (updateError) {
              console.error("Error updating invitation:", updateError);
            } else {
              console.log("Invitation accepted successfully");
            }
          }
        } catch (inviteProcessError) {
          console.error("Error processing invitation:", inviteProcessError);
        }
      }

      // Now wait briefly to ensure the trigger has time to create the profile
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to fetch the user profile
      let profileData = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!profileData && attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`Attempt ${attempts} to fetch profile for user: ${data.user.id}`);
          
          const { data: fetchedProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Error fetching profile after registration:", profileError);
          } else if (fetchedProfile) {
            console.log("Successfully fetched profile after registration:", fetchedProfile);
            profileData = fetchedProfile;
            break;
          } else {
            console.warn(`No profile found after registration attempt ${attempts}, may need to create manually`);
            
            // If it's the last attempt, try to create the profile manually
            if (attempts === maxAttempts) {
              console.log("Creating profile manually as last resort");
              
              // If no profile exists, create one manually
              const { data: insertedProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email || email,
                  name,
                  role,
                  company_name: companyName,
                  email_verified: false
                })
                .select()
                .single();
              
              if (insertError) {
                console.error("Error manually creating profile:", insertError);
                toast({
                  title: "Profile creation failed",
                  description: "We couldn't create your user profile. Please contact support.",
                  variant: "destructive"
                });
              } else {
                console.log("Profile created manually after registration:", insertedProfile);
                profileData = insertedProfile;
              }
            } else {
              // Wait before trying again
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (profileFetchError) {
          console.error("Error in profile fetch/creation process:", profileFetchError);
          
          // If it's the last attempt, try the fallback
          if (attempts === maxAttempts) {
            break;
          }
          
          // Wait before trying again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Create user object
      let user: User | null = null;
      if (profileData) {
        user = {
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
      } else {
        // Fallback if we couldn't get the profile
        user = {
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
        
        // Try one more time to create the profile asynchronously
        setTimeout(async () => {
          try {
            const { error: lastInsertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || email,
                name,
                role,
                company_name: companyName,
                email_verified: false
              });
              
            if (lastInsertError) {
              console.error("Final attempt to create profile failed:", lastInsertError);
            } else {
              console.log("Profile created in final async attempt");
            }
          } catch (finalError) {
            console.error("Final profile creation attempt error:", finalError);
          }
        }, 0);
      }
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully."
      });
      
      // Send verification email
      if (data.user.email) {
        await sendEmailVerification();
        toast({
          title: "Verification email sent",
          description: "Please check your email to verify your account."
        });
      }
      
      return user;
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

      return data || false;
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  };

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
