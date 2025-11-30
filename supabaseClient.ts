
import { createClient } from '@supabase/supabase-js';

// Function to safely retrieve environment variables
// In Netlify (using Vite), variables must start with VITE_ to be exposed to the client.
const getEnvVar = (key: string) => {
  // 1. Check import.meta.env (Standard Vite)
  if (import.meta && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // 2. Check process.env (Fallback for other build systems)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Retrieve the variables
// Make sure to add these in your Netlify "Environment variables" settings
// SECURITY NOTE: 
// It is SAFE and expected to expose the ANON_KEY to the client (browser),
// PROVIDED YOU HAVE ENABLED Row Level Security (RLS) on your Supabase database tables.
// WARNING: NEVER expose the SERVICE_ROLE_KEY (admin key) in client-side code.
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validation to prevent crash on initialization
// If variables are missing, we use a placeholder to allow the app to load
// (The API calls will fail, which App.tsx handles by showing mock data)
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = supabaseKey ? supabaseKey : 'placeholder-key';

export const supabase = createClient(validUrl, validKey);
