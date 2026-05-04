/**
 * Supabase Client Configuration
 * 
 * This module provides Supabase client instances for different use cases:
 * - Public client (anon key) for read-only operations
 * - Service client (service role key) for admin operations
 */

const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these in your .env file or environment');
  process.exit(1);
}

// Public client (for read-only operations, respects RLS)
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Service client (for admin operations, bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Test connection on startup
async function testConnection() {
  try {
    const { data, error } = await supabasePublic
      .from('apartments')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

module.exports = {
  supabasePublic,
  supabaseAdmin,
  testConnection
};
