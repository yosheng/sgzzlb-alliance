import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useLatestMembers } from "@/hooks/useMembers"
import type { Member } from "@/lib/supabase"
import PieChartCard, { type PieEntry } from "./PieChartCard"
import RankTable, { type RankRow } from "./RankTable"
import SlaveTable from "./SlaveTable"

// ── 資料轉換 ──────────────────────────────────────────

const POWER_RANGES = [
  { label: "0–10000", min: 0, max: 10000 },
  { label: "10000–15000", min: 10000, max: 15000 },
  { label: "15000–20000", min: 15000, max: 20000 },
  { label: "20000–25000", min: 20000, max: 25000 },
  { label: "25000+", min: 25000, max: Infinity },
]

function buildGroupPie(members: Member[], keyFn: (m: Member) => string | null): PieEntry[] {
  const counts: Record<string, number> = {}
  for (const m of members) {
    const k = keyFn(m) ?? "未知"
    counts[k] = (counts[k] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function buildPowerPie(members: Member[]): PieEntry[] {
  const counts: Record<string, number> = {}
  for (const r of POWER_RANGES) counts[r.label] = 0
  for (const m of members) {
    const r = POWER_RANGES.find((r) => m.power >= r.min && m.power < r.max)
    if (r) counts[r.label]++
  }
  return POWER_RANGES.map((r) => ({ name: r.label, value: counts[r.label] })).filter((d) => d.value > 0)
}

function buildRankRows(members: Member[], valueFn: (m: Member) => number): RankRow[] {
  return [...members]
    .sort((a, b) => valueFn(b) - valueFn(a))
    .slice(0, 10)
    .map((m, i) => ({ rank: i + 1, name: m.name, group: m.group_name ?? "", value: valueFn(m) }))
}

// ── 主組件 ────────────────────────────────────────────

export default function MemberAnalytics() {
  const { data: members = [], isLoading } = useLatestMembers()

  const statePie = useMemo(() => buildGroupPie(members, (m) => m.state), [members])
  const groupPie = useMemo(() => buildGroupPie(members, (m) => m.group_name), [members])
  const powerPie = useMemo(() => buildPowerPie(members), [members])

  const weeklyBattle = useMemo(() => buildRankRows(members, (m) => m.battle_weekly), [members])
  const weeklyAssist = useMemo(() => buildRankRows(members, (m) => m.assist_weekly), [members])
  const totalBattle = useMemo(() => buildRankRows(members, (m) => m.battle_total), [members])
  const totalAssist = useMemo(() => buildRankRows(members, (m) => m.assist_total), [members])

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    )
  }

  if (members.length === 0) return null

  return (
    <div className="mb-6 space-y-4">
      {/* 圓餅圖區 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PieChartCard title="州分布" data={statePie} />
        <PieChartCard title="組別分布" data={groupPie} />
        <PieChartCard title="勢力值區間分布" data={powerPie} />
      </div>

      {/* 榜單區 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RankTable title="周戰功榜 Top 10" rows={weeklyBattle} />
        <RankTable title="周助攻榜 Top 10" rows={weeklyAssist} />
        <RankTable title="總戰功榜 Top 10" rows={totalBattle} />
        <RankTable title="總助攻榜 Top 10" rows={totalAssist} />
      </div>

      {/* 地奴分析 */}
      <SlaveTable members={members} />
    </div>
  )
}
