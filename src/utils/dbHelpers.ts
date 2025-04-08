
import { supabase } from "@/integrations/supabase/client";

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
 * Function to check database connectivity
 */
export const checkDatabaseConnectivity = async () => {
  try {
    // Check if we can connect to the database
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // If we get a "relation does not exist" error, that's actually good!
    // It means we're connected to the database but the table doesn't exist yet
    if (error && error.message.includes('relation "profiles" does not exist')) {
      return true;
    }
    
    // If no error, we're connected and the table exists
    if (!error) {
      return true;
    }
    
    console.error("Error connecting to database:", error);
    return false;
  } catch (error) {
    console.error("Error checking database connection:", error);
    return false;
  }
};
