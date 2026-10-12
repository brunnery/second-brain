/* Supabase connection. The anon key is public by design — access is
   protected by Row Level Security (see supabase/schema.sql).
   Override with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY if needed. */
export const SUPABASE_URL =
  import.meta.env?.VITE_SUPABASE_URL || "https://lsnmenyymqvzcclqqvph.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzbm1lbnl5bXF2emNjbHFxdnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzIzMjMsImV4cCI6MjA5OTk0ODMyM30.g7AIyvwGP0gn6Ig02RQXpWGEPzVkUugy7kA17q3CjNs";

export const APP_NAME = "Second Brain";
export const SCHEMA_VERSION = 2;
export const CURRENCY = "CHF";
