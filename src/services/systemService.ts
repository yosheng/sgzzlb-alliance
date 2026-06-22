import { supabase } from "@/lib/supabase"
import type { SystemSetting, Profile } from "@/lib/supabase"

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

export async function clearAllianceData(): Promise<void> {
  const { error } = await supabase.rpc("clear_alliance_data")
  if (error) throw new Error(error.message)
}

export async function queryProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateProfile(
  id: string,
  fields: { role?: string; display_name?: string },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", id)
  if (error) throw new Error(error.message)
}
