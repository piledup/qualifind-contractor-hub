
import { supabase } from "@/integrations/supabase/client";
import { User, Subcontractor, Project, Invitation, UserRole } from "@/types";

// Helper function to get user's profile
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    return { data: data as User | null, error };
  } catch (err) {
    console.error("Error in getUserProfile:", err);
    return { data: null, error: err };
  }
};

// Helper function to safely query subcontractors
export const getSubcontractorsByInvitedBy = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('invited_by', userId);
    
    return { data: data as Subcontractor[] | null, error };
  } catch (err) {
    console.error("Error in getSubcontractorsByInvitedBy:", err);
    return { data: null, error: err };
  }
};

// Helper function to safely query projects
export const getProjectsByCreatedBy = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('created_by', userId);
    
    return { data: data as Project[] | null, error };
  } catch (err) {
    console.error("Error in getProjectsByCreatedBy:", err);
    return { data: null, error: err };
  }
};

// Helper function to safely query invitations
export const getInvitationsByGC = async (userId: string, status?: string) => {
  try {
    let query = supabase
      .from('invitations')
      .select('*')
      .eq('general_contractor_id', userId);
      
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    return { data: data as Invitation[] | null, error };
  } catch (err) {
    console.error("Error in getInvitationsByGC:", err);
    return { data: null, error: err };
  }
};

// Helper function to safely insert invitation data
export const createInvitation = async (invitationData: {
  general_contractor_id: string;
  email: string;
  code: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        general_contractor_id: invitationData.general_contractor_id,
        email: invitationData.email,
        code: invitationData.code,
        status: 'pending'
      })
      .select();
    
    return { data, error };
  } catch (err) {
    console.error("Error in createInvitation:", err);
    return { data: null, error: err };
  }
};

// Helper function to safely insert subcontractor data
export const createSubcontractor = async (subcontractorData: {
  invited_by: string;
  email: string;
  name?: string;
  company_name?: string;
  trade?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .insert({
        invited_by: subcontractorData.invited_by,
        email: subcontractorData.email,
        name: subcontractorData.name,
        company_name: subcontractorData.company_name,
        trade: subcontractorData.trade,
        qualification_status: 'pending',
        submission_status: 'unsubmitted',
        has_paid: false
      })
      .select();
    
    return { data, error };
  } catch (err) {
    console.error("Error in createSubcontractor:", err);
    return { data: null, error: err };
  }
};

// Helper function to safely insert project data
export const createProject = async (projectData: {
  created_by: string;
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        created_by: projectData.created_by,
        name: projectData.name,
        description: projectData.description,
        location: projectData.location,
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        budget: projectData.budget
      })
      .select();
    
    return { data, error };
  } catch (err) {
    console.error("Error in createProject:", err);
    return { data: null, error: err };
  }
};

// Helper function to safely get subcontractor by user ID
export const getSubcontractorByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    return { data: data as Subcontractor | null, error };
  } catch (err) {
    console.error("Error in getSubcontractorByUserId:", err);
    return { data: null, error: err };
  }
};

// Helper to verify an invitation code
export const verifyInvitationCode = async (code: string) => {
  try {
    const { data, error } = await supabase
      .rpc('verify_invitation_code', { code_param: code });
    
    return { data, error };
  } catch (err) {
    console.error("Error in verifyInvitationCode:", err);
    return { data: null, error: err };
  }
};

// Function to check database connectivity
export const checkDatabaseConnectivity = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    // If we get a "relation does not exist" error, that means
    // we're connected but the table doesn't exist yet
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
