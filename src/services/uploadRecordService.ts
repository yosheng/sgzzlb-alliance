import { supabase, type Member } from "@/lib/supabase"

export async function queryLatestStatAt(): Promise<string | null> {
  const { data } = await supabase
    .from("upload_records")
    .select("stat_at")
    .order("stat_at", { ascending: false })
    .limit(1)
    .single()
  return data?.stat_at ?? null
}

export async function insertCsvData(
  filename: string,
  statAt: string,
  description: string,
  rows: Omit<Member, "id" | "upload_id">[],
): Promise<void> {
  const { data: existing } = await supabase
    .from("upload_records")
    .select("id")
    .eq("stat_at", statAt)
    .maybeSingle()

  if (existing) {
    throw new Error(`此份统计数据（${statAt}）已上传过，拒绝重复上传。`)
  }

  const { data: record, error: recErr } = await supabase
    .from("upload_records")
    .insert({ filename, stat_at: statAt, description: description || null, row_count: rows.length })
    .select("id")
    .single()

  if (recErr || !record) {
    throw new Error(recErr?.message ?? "写入上传记录失败")
  }

  const { error: memErr } = await supabase
    .from("members")
    .insert(rows.map((r) => ({ ...r, upload_id: record.id })))

  if (memErr) {
    await supabase.from("upload_records").delete().eq("id", record.id)
    throw new Error(memErr.message)
  }
}
