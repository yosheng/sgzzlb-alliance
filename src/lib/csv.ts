import type { Member } from "./supabase"

/**
 * 從固定格式檔名解析統計時間
 * 例：同盟统计2026年06月19日09时13分05秒 → 2026-06-19T09:13:05+08:00
 */
export function parseStatAtFromFilename(filename: string): string | null {
  const m = filename.match(
    /(\d{4})年(\d{2})月(\d{2})日(\d{2})时(\d{2})分(\d{2})秒/,
  )
  if (!m) return null
  const [, year, month, day, hour, min, sec] = m
  return `${year}-${month}-${day}T${hour}:${min}:${sec}+08:00`
}

const COLUMN_MAP: Record<string, keyof Omit<Member, "id" | "upload_id">> = {
  成员: "name",
  贡献排行: "contribution_rank",
  贡献本周: "contribution_weekly",
  战功本周: "battle_weekly",
  助攻本周: "assist_weekly",
  捐献本周: "donate_weekly",
  贡献总量: "contribution_total",
  战功总量: "battle_total",
  助攻总量: "assist_total",
  捐献总量: "donate_total",
  势力值: "power",
  所属州: "state",
  分组: "group_name",
}

const INT_FIELDS = new Set<string>([
  "contribution_rank",
  "contribution_weekly",
  "battle_weekly",
  "assist_weekly",
  "donate_weekly",
  "contribution_total",
  "battle_total",
  "assist_total",
  "donate_total",
  "power",
])

/** 解析 CSV 文字內容，回傳成員資料陣列 */
export function parseCsv(
  text: string,
): Omit<Member, "id" | "upload_id">[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim())

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim())
    const row: Record<string, unknown> = {}

    headers.forEach((header, i) => {
      const field = COLUMN_MAP[header]
      if (!field) return
      const raw = cols[i] ?? ""
      if (INT_FIELDS.has(field)) {
        row[field] = raw === "" ? null : parseInt(raw, 10)
      } else {
        row[field] = raw === "" ? null : raw
      }
    })

    return row as Omit<Member, "id" | "upload_id">
  })
}
