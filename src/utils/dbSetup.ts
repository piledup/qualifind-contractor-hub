
import { supabase } from "@/integrations/supabase/client";

// Utility function to check if tables exist and create them if needed
export const ensureTablesExist = async (): Promise<{ success: boolean, message: string }> => {
  try {
    // Check if profiles table exists
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .single();
    
    if (tablesError) {
      console.error("Error checking if tables exist:", tablesError);
      return { success: false, message: `Error checking tables: ${tablesError.message}` };
    }
    
    // If profiles table doesn't exist, create it
    if (!tablesData) {
      console.log("Profiles table doesn't exist. Creating it...");
      
      const { error: createError } = await supabase.rpc('create_profiles_table');
      
      if (createError) {
        console.error("Error creating profiles table:", createError);
        return { success: false, message: `Error creating profiles table: ${createError.message}` };
      }
      
      return { success: true, message: "Profiles table created successfully" };
    }
    
    return { success: true, message: "All required tables already exist" };
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
