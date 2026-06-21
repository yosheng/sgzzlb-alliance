import { supabase } from "@/lib/supabase"

export async function registerUser(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
}
