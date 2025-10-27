import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User } from "@/lib/types/database"

export interface UserWithProfile {
  user: {
    id: string
    email: string
  }
  profile: User | null
}

/**
 * Get authenticated user with their profile from the users table
 * Redirects to login if not authenticated
 */
export async function getUserWithProfile(): Promise<UserWithProfile> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile from users table
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return {
    user: {
      id: user.id,
      email: user.email || "",
    },
    profile,
  }
}
