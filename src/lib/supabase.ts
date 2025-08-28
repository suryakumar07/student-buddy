import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  // This error will be thrown on the server, which is safe.
  throw new Error(
    'Supabase URL and/or Service Role Key are missing from environment variables.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
