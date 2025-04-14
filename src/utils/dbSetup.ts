
import { supabase, supabaseQuery } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Check if database tables exist
export const checkDatabaseTables = async (): Promise<boolean> => {
  try {
    // Check if profiles table exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    // If we can query the table without error, it exists
    return !error;
  } catch (error) {
    console.error("Error checking database tables:", error);
    return false;
  }
};

// Create a user profile in the database
export const createProfile = async (userData: {
  id: string;
  email: string;
  name: string;
  role: string;
  company_name?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.from('profiles').insert({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      company_name: userData.company_name,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error("Error creating profile:", error);
      return { success: false, message: `Failed to create profile: ${error.message}` };
    }

    return { success: true, message: "Profile created successfully" };
  } catch (error: any) {
    console.error("Error in createProfile:", error);
    return { success: false, message: `Error creating profile: ${error.message}` };
  }
};

// Check if a specific profile exists
export const checkProfileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking if profile exists:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in checkProfileExists:", error);
    return false;
  }
};

// Function to verify database connectivity
export const verifyDatabaseSetup = async (): Promise<void> => {
  try {
    const tablesExist = await checkDatabaseTables();
    
    if (tablesExist) {
      toast({
        title: "Database verification successful",
        description: "All required database tables exist",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Database verification failed",
        description: "Required database tables do not exist",
      });
    }
  } catch (error: any) {
    toast({
      variant: "destructive",
      title: "Database verification error",
      description: error.message || "An unexpected error occurred",
    });
  }
};
