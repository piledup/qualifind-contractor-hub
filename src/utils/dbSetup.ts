
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Utility function to check if profiles table exists and create it if needed
export const ensureTablesExist = async (): Promise<{ success: boolean, message: string }> => {
  try {
    // Try to query the profiles table directly - if it exists, this will succeed
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // If no error, the table exists
    if (!error) {
      return { success: true, message: "All required tables already exist" };
    }
    
    // If error contains "relation profiles does not exist", we need to create it
    if (error.message && error.message.includes('relation "profiles" does not exist')) {
      console.log("Profiles table doesn't exist. Creating it via SQL...");
      
      // Run SQL to create the profiles table
      const { error: createError } = await supabase.rpc('create_tables_if_not_exist');
      
      if (createError) {
        console.error("Error creating profiles table:", createError);
        return { success: false, message: `Error creating profiles table: ${createError.message}` };
      }
      
      return { success: true, message: "Profiles table created successfully" };
    }
    
    return { success: false, message: `Unexpected error checking tables: ${error.message}` };
  } catch (error: any) {
    console.error("Error in ensureTablesExist:", error);
    return { success: false, message: `Error checking/creating tables: ${error.message}` };
  }
};

// Function to check if a specific profile exists
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

// Function to manually create a profile
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

// Manual database verification that can be triggered by users
export const verifyDatabaseSetup = async (): Promise<void> => {
  try {
    const result = await ensureTablesExist();
    
    if (result.success) {
      toast({
        title: "Database verification successful",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Database verification failed",
        description: result.message,
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
