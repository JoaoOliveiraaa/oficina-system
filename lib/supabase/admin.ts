import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase admin client with service role key.
 * This bypasses Row Level Security (RLS) and should ONLY be used in:
 * - Server-side API routes
 * - Webhook handlers
 * - Admin operations
 *
 * NEVER expose this client to the browser or use it in Client Components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
