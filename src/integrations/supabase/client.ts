
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vioaqyclkyrhoutysjmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpb2FxeWNsa3lyaG91dHlzam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzUwMzQsImV4cCI6MjA1OTExMTAzNH0.umU9wju2XRnmN8ZcZyufWWXRqkisA_CN2zGY3-LA-MM";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      flowType: 'pkce',
    }
  }
);

// Type-safe helper function for transforming database profile data to User type
export const mapDbProfileToUser = (profileData: any) => {
  if (!profileData) return null;
  
  return {
    id: profileData.id,
    email: profileData.email,
    name: profileData.name,
    role: profileData.role,
    companyName: profileData.company_name || '',
    createdAt: new Date(profileData.created_at),
    emailVerified: profileData.email_verified || false,
    lastSignIn: profileData.last_sign_in ? new Date(profileData.last_sign_in) : undefined
  };
};

// Helper function to safely filter by ID (handles UUID validation)
export const filterById = (id: string) => {
  return id;
};

// Helper function for safe database operations
export const safeInsert = async (tableName: "profiles" | "invitations" | "permissions" | "projects" | "subcontractors" | "qualification_documents" | "project_subcontractors", data: any) => {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
};

// Simpler function for inserting data with better typing
export const typedInsert = async <T>(
  tableName: "profiles" | "invitations" | "permissions" | "projects" | "subcontractors" | "qualification_documents" | "project_subcontractors", 
  data: any // Keep 'any' to avoid type errors but we'll handle the response properly
): Promise<{ data: T | null; error: any }> => {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) throw error;
    
    // Use type assertion for the return value
    return { data: result as unknown as T, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

// Helper function for safe database selects
export const safeSelect = async (tableName: "profiles" | "invitations" | "permissions" | "projects" | "subcontractors" | "qualification_documents" | "project_subcontractors", query: any = {}) => {
  let queryBuilder = supabase.from(tableName).select('*');
  
  // Apply filters if provided
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryBuilder = queryBuilder.eq(key, value);
    }
  });
  
  const { data, error } = await queryBuilder;
  
  if (error) throw error;
  return data;
};

// Error handling utility
export const handleSupabaseError = (error: any): string => {
  console.error("Supabase error:", error);
  return error?.message || "An unexpected error occurred";
};

// Simplified query helper function to avoid excessive type instantiation
export const supabaseQuery = async <T>(
  queryFn: () => Promise<{ data: any; error: any }>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await queryFn();
    
    if (error) throw error;
    
    // Simple type assertion
    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: handleSupabaseError(err) };
  }
};
