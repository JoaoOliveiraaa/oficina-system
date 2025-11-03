import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "mecanico" | "recepcionista"

export interface UserProfile {
  id: string
  email: string
  nome: string | null
  telefone: string | null
  role: UserRole
  ativo: boolean
  created_at: string
  updated_at: string
}

/**
 * Get the current user's role from the database (server-side)
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  return userData?.role || null
}

/**
 * Get the current user's full profile (server-side)
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

  return userData
}

/**
 * Check if the current user has a specific role (server-side)
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRole = await getUserRole()
  return userRole === role
}

/**
 * Check if the current user is an admin (server-side)
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("admin")
}

/**
 * Get user role from client-side
 */
export async function getUserRoleClient(): Promise<UserRole | null> {
  const supabase = createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  return userData?.role || null
}

/**
 * Get user profile from client-side
 */
export async function getUserProfileClient(): Promise<UserProfile | null> {
  const supabase = createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

  return userData
}
