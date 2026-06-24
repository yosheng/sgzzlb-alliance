import { supabase, type Member, type MemberWithStatus } from "@/lib/supabase"
import { queryLatestStatAt } from "@/services/uploadRecordService"

export async function queryLatestMembers(): Promise<Member[]> {
  const { data: record } = await supabase
    .from("upload_records")
    .select("id")
    .order("stat_at", { ascending: false })
    .limit(1)
    .single()
  if (!record) return []
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("upload_id", record.id)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function queryMembersInRange(
  from: string,
  to: string,
): Promise<MemberWithStatus[]> {
  const [{ data, error }, latestStatAt] = await Promise.all([
    supabase
      .from("upload_records")
      .select("stat_at, members(*)")
      .gte("stat_at", from)
      .lte("stat_at", to)
      .order("stat_at", { ascending: false }),
    queryLatestStatAt(),
  ])

  if (error) throw error
  if (!data) return []

  const seen = new Set<string>()
  const result: MemberWithStatus[] = []

  for (const batch of data) {
    for (const m of batch.members as Member[]) {
      if (seen.has(m.name)) continue
      seen.add(m.name)
      result.push({
        ...m,
        stat_at: batch.stat_at,
        is_active: latestStatAt !== null && batch.stat_at === latestStatAt,
      })
    }
  }

  return result
}
