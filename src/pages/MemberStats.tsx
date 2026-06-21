import { useState } from "react"
import { ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table"
import { useMembers } from "@/hooks/useMembers"
import type { MemberWithStatus } from "@/lib/supabase"

// ── 工具函数 ──────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function toISOWithTZ(localValue: string): string {
  return new Date(localValue).toISOString()
}

// ── 排序 ──────────────────────────────────────────────────────

type SortKey = keyof MemberWithStatus
type SortDir = "asc" | "desc"

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "成员" },
  { key: "is_active", label: "状态" },
  { key: "group_name", label: "分组" },
  { key: "state", label: "所属州" },
  { key: "contribution_weekly", label: "贡献本周" },
  { key: "battle_weekly", label: "战功本周" },
  { key: "assist_weekly", label: "助攻本周" },
  { key: "donate_weekly", label: "捐献本周" },
  { key: "contribution_total", label: "贡献总量" },
  { key: "battle_total", label: "战功总量" },
  { key: "assist_total", label: "助攻总量" },
  { key: "donate_total", label: "捐献总量" },
  { key: "power", label: "势力值" },
]

function sortMembers(members: MemberWithStatus[], key: SortKey, dir: SortDir) {
  return [...members].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (av == null) return 1
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === "asc" ? cmp : -cmp
  })
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDownIcon data-icon="inline-end" className="size-3 opacity-40" />
  return sortDir === "asc"
    ? <ArrowUpIcon data-icon="inline-end" className="size-3" />
    : <ArrowDownIcon data-icon="inline-end" className="size-3" />
}

// ── 页面组件 ──────────────────────────────────────────────────

export default function MemberStats() {
  const now = new Date()
  const [rangeFrom, setRangeFrom] = useState(toLocalDatetimeValue(getMondayOfWeek(now)))
  const [rangeTo, setRangeTo] = useState(toLocalDatetimeValue(now))
  const [queryFrom, setQueryFrom] = useState(toISOWithTZ(toLocalDatetimeValue(getMondayOfWeek(now))))
  const [queryTo, setQueryTo] = useState(toISOWithTZ(toLocalDatetimeValue(now)))

  const [sortKey, setSortKey] = useState<SortKey>("contribution_weekly")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const { data: members = [], isLoading, error: queryError, refetch } = useMembers(queryFrom, queryTo)

  function handleQuery() {
    setQueryFrom(toISOWithTZ(rangeFrom))
    setQueryTo(toISOWithTZ(rangeTo))
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = sortMembers(members, sortKey, sortDir)

  return (
    <div className="px-4 py-4 md:px-6">
      {/* 筛选栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          开始
          <input
            type="datetime-local"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          结束
          <input
            type="datetime-local"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
          />
        </label>
        <Button size="sm" onClick={handleQuery} disabled={isLoading}>
          {isLoading ? "查询中…" : "查询"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading}>
          刷新
        </Button>
      </div>

      {queryError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{queryError.message}</AlertDescription>
        </Alert>
      )}

      {!isLoading && members.length === 0 && !queryError && (
        <p className="text-sm text-muted-foreground">
          当前区段无数据，请上传 CSV 或调整时间范围。
        </p>
      )}

      {(isLoading || members.length > 0) && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-xs">#</TableHead>
              {COLUMNS.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none text-xs hover:text-foreground"
                  onClick={() => handleSort(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMNS.length + 1 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-3 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              sorted.map((m, i) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    {m.is_active
                      ? <Badge className="bg-green-500 text-white hover:bg-green-600">在盟</Badge>
                      : <Badge className="bg-red-500 text-white hover:bg-red-600">退盟</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.group_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.state ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{m.contribution_weekly.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.battle_weekly.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.assist_weekly.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.donate_weekly.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.contribution_total.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.battle_total.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.assist_total.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.donate_total.toLocaleString()}</TableCell>
                  <TableCell className="tabular-nums">{m.power.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {!isLoading && members.length > 0 && (
            <TableCaption>
              共 {members.length} 位成员 ·{" "}
              {members.filter((m) => m.is_active).length} 在盟 /{" "}
              {members.filter((m) => !m.is_active).length} 退盟
            </TableCaption>
          )}
        </Table>
      )}
    </div>
  )
}
