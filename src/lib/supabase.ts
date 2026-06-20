import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface UploadRecord {
  id: number
  filename: string
  stat_at: string
  description: string | null
  row_count: number
  uploaded_at: string
}

export interface Member {
  id: number
  upload_id: number
  name: string
  contribution_rank: number | null
  contribution_weekly: number
  battle_weekly: number
  assist_weekly: number
  donate_weekly: number
  contribution_total: number
  battle_total: number
  assist_total: number
  donate_total: number
  power: number
  state: string | null
  group_name: string | null
}

export interface MemberWithStatus extends Member {
  stat_at: string
  is_active: boolean
}

/** 取得最新一次上傳批次的 stat_at */
export async function fetchLatestStatAt(): Promise<string | null> {
  const { data } = await supabase
    .from("upload_records")
    .select("stat_at")
    .order("stat_at", { ascending: false })
    .limit(1)
    .single()
  return data?.stat_at ?? null
}

/** 查詢時間區段內每位成員最新一筆紀錄，並標記在盟/退盟 */
export async function fetchMembersInRange(
  from: string,
  to: string,
): Promise<MemberWithStatus[]> {
  // 從 upload_records 為主表，join members，讓排序直接作用在主表
  const { data, error } = await supabase
    .from("upload_records")
    .select("stat_at, members(*)")
    .gte("stat_at", from)
    .lte("stat_at", to)
    .order("stat_at", { ascending: false })

  if (error) throw error
  if (!data) return []

  // 取得最新批次時間（整個 DB 最新，不限區段）
  const latestStatAt = await fetchLatestStatAt()

  // 展開所有 members，每人只保留最新一批次的紀錄（data 已按 stat_at desc）
  const seen = new Set<string>()
  const result: MemberWithStatus[] = []

  for (const batch of data) {
    const batchMembers = batch.members as Member[]
    for (const m of batchMembers) {
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

/** 新增上傳批次與成員資料，stat_at 重複時拒絕 */
export async function uploadCsvData(
  filename: string,
  statAt: string,
  description: string,
  rows: Omit<Member, "id" | "upload_id">[],
): Promise<{ error: string | null }> {
  // 檢查是否已存在相同 stat_at
  const { data: existing } = await supabase
    .from("upload_records")
    .select("id")
    .eq("stat_at", statAt)
    .maybeSingle()

  if (existing) {
    return { error: `此份統計資料（${statAt}）已上傳過，拒絕重複上傳。` }
  }

  // 寫入 upload_records
  const { data: record, error: recErr } = await supabase
    .from("upload_records")
    .insert({ filename, stat_at: statAt, description: description || null, row_count: rows.length })
    .select("id")
    .single()

  if (recErr || !record) {
    return { error: recErr?.message ?? "寫入上傳紀錄失敗" }
  }

  // 寫入 members（批次 insert）
  const members = rows.map((r) => ({ ...r, upload_id: record.id }))
  const { error: memErr } = await supabase.from("members").insert(members)

  if (memErr) {
    // 回滾：刪掉剛寫的 upload_records（cascade 會清 members）
    await supabase.from("upload_records").delete().eq("id", record.id)
    return { error: memErr.message }
  }

  return { error: null }
}
