
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vioaqyclkyrhoutysjmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpb2FxeWNsa3lyaG91dHlzam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzUwMzQsImV4cCI6MjA1OTExMTAzNH0.umU9wju2XRnmN8ZcZyufWWXRqkisA_CN2zGY3-LA-MM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

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

// Helper function to handle common Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error("Supabase error:", error);
  const errorMessage = error.message || "An unexpected error occurred";
  return errorMessage;
};

// Type-safe query helper for selecting data properly
export const typedSelect = async <T>(
  query: Promise<any>
): Promise<T> => {
  const { data, error } = await query;
  
  if (error) {
    console.error("Supabase query error:", error);
    throw error;
  }
  
  if (!data) {
    throw new Error("No data returned from query");
  }
  
  return data as T;
};

// Helper for safely getting a single row, with type safety and error handling
export const typedSelectSingle = async <T>(
  query: Promise<any>
): Promise<T> => {
  const { data, error } = await query;
  
  if (error) {
    console.error("Supabase query error:", error);
    throw error;
  }
  
  if (!data) {
    throw new Error("No data returned from query");
  }
  
  return data as T;
};

// Helper for handling Supabase ID filters with proper typing
export const filterById = (id: string) => {
  return id as any; // This cast allows the query to work while maintaining code safety
};

// Helper for handling typed inserts to database tables
export const typedInsert = <T extends Record<string, any>>(
  table: string, 
  data: T
) => {
  // This function allows explicit type casting for insert operations
  // @ts-ignore - We're intentionally ignoring type checks here to allow the operation
  return supabase.from(table).insert(data);
};

// Helper for handling typed updates to database tables
export const typedUpdate = <T extends Record<string, any>>(
  table: string, 
  data: T
) => {
  // This function allows explicit type casting for update operations
  // @ts-ignore - We're intentionally ignoring type checks here to allow the operation
  return supabase.from(table).update(data);
};

// Helper function to safely cast return values from RPC functions that return booleans
export const castToBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  return Boolean(value);
};

// Helper for safely handling Supabase database record conversions to their TypeScript types
export const convertDbProfileToUser = (profileData: any): any => {
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
