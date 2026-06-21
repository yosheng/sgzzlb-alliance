import { supabase, type Member, type UploadRecord } from "@/lib/supabase"

export async function queryUploadRecords(): Promise<UploadRecord[]> {
  const { data, error } = await supabase
    .from("upload_records")
    .select("*")
    .order("stat_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function deleteUploadRecord(id: number): Promise<void> {
  const { error: memErr } = await supabase.from("members").delete().eq("upload_id", id)
  if (memErr) throw new Error(memErr.message)
  const { error: recErr } = await supabase.from("upload_records").delete().eq("id", id)
  if (recErr) throw new Error(recErr.message)
}

export async function updateUploadRecordDescription(id: number, description: string): Promise<void> {
  const { error } = await supabase
    .from("upload_records")
    .update({ description: description || null })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function queryLatestStatAt(): Promise<string | null> {
  const { data } = await supabase
    .from("upload_records")
    .select("stat_at")
    .order("stat_at", { ascending: false })
    .limit(1)
    .single()
  return data?.stat_at ?? null
}

export async function checkStatAtExists(statAt: string): Promise<boolean> {
  const { data } = await supabase
    .from("upload_records")
    .select("id")
    .eq("stat_at", statAt)
    .maybeSingle()
  return !!data
}

export async function queryMembersByUploadId(uploadId: number): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("upload_id", uploadId)
  if (error) throw new Error(error.message)
  return data ?? []
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
