// Supabase configuration
const SUPABASE_URL = 'https://vgijdkxcazkdgmrtwyxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaWpka3hjYXprZGdtcnR3eXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTczNDYsImV4cCI6MjA3ODQ3MzM0Nn0.9TJo2jJV1hzHsWwuaQj91JAidFqbBeOxLifNHNTc-O4';

// Initialize Supabase client (must use window.supabase)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized:', supabaseClient ? '✅' : '❌');