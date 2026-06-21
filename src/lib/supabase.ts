import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
)

// ── 类型 ──────────────────────────────────────────────────────

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

export interface SystemSetting {
  id: number
  code: string
  label: string
  value: string | null
}
