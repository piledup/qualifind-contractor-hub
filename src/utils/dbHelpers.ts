import { supabase, filterById } from "@/integrations/supabase/client";

/**
 * Helper function to safely query subcontractors and handle type issues
 */
export const querySubcontractorsByInvitedBy = async (userId: string) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('invited_by', userId);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error querying subcontractors:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely query projects and handle type issues
 */
export const queryProjectsByCreatedBy = async (userId: string) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('created_by', userId);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error querying projects:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely query invitations and handle type issues
 */
export const queryInvitationsByGC = async (userId: string, status?: string) => {
  try {
    let query = supabase
      .from('invitations')
      .select('*')
      // @ts-ignore - We're handling the type conversion manually
      .eq('general_contractor_id', userId);
      
    if (status) {
      // @ts-ignore - We're handling the type conversion manually
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error querying invitations:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely insert invitation data
 */
export const insertInvitation = async (invitationData: any) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('invitations')
      .insert(invitationData);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error inserting invitation:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely update invitation data
 */
export const updateInvitationExpiry = async (invitationId: string, expiryDate: string) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('invitations')
      .update({ expires_at: expiryDate })
      .eq('id', invitationId);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating invitation:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely insert subcontractor data
 */
export const insertSubcontractor = async (subcontractorData: any) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('subcontractors')
      .insert(subcontractorData);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error inserting subcontractor:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely insert project data
 */
export const insertProject = async (projectData: any) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error inserting project:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely query project subcontractors
 */
export const queryProjectSubcontractors = async (projectIds: string[]) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('project_subcontractors')
      .select('*')
      .in('project_id', projectIds);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error querying project subcontractors:", error);
    return { data: null, error };
  }
};

/**
 * Helper function to safely query subcontractor by user ID
 */
export const querySubcontractorByUserId = async (userId: string) => {
  try {
    // @ts-ignore - We're handling the type conversion manually
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error querying subcontractor:", error);
    return { data: null, error };
  }
};

/**
 * Create a new SQL function in the database
 * This function will be used to create tables if they don't exist
 */
export const createSqlFunction = async () => {
  try {
    const sql = `
    CREATE OR REPLACE FUNCTION create_tables_if_not_exist()
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      table_exists boolean;
    BEGIN
      -- Check if profiles table exists
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      ) INTO table_exists;
      
      -- Create profiles table if it doesn't exist
      IF NOT table_exists THEN
        CREATE TABLE public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          company_name TEXT,
          email_verified BOOLEAN DEFAULT FALSE,
          last_sign_in TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" 
          ON public.profiles 
          FOR SELECT 
          USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" 
          ON public.profiles 
          FOR UPDATE 
          USING (auth.uid() = id);
        
        RETURN TRUE;
      END IF;
      
      RETURN TRUE;
    END;
    $$;`;
    
    // Execute the SQL statement to create the function
    const { error } = await supabase.rpc('create_tables_if_not_exist');
    
    if (error) {
      console.error("Error creating SQL function:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in createSqlFunction:", error);
    return false;
  }
};
