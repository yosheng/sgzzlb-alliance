import { supabase } from "@/lib/supabase"
import type { SystemSetting } from "@/lib/supabase"

export async function querySystemSettings(): Promise<SystemSetting[]> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("id", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateSystemSetting(code: string, value: string): Promise<void> {
  const { error } = await supabase
    .from("system_settings")
    .update({ value })
    .eq("code", code)
  if (error) throw new Error(error.message)
}
