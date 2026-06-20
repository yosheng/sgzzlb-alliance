import { useState, useCallback, useEffect } from "react"
import { ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon, UploadIcon } from "lucide-react"
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
import { UploadDialog } from "@/components/UploadDialog"
import { fetchMembersInRange, type MemberWithStatus } from "@/lib/supabase"

// ── 工具函式 ──────────────────────────────────────────────────
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
  { key: "name", label: "成員" },
  { key: "is_active", label: "狀態" },
  { key: "group_name", label: "分組" },
  { key: "state", label: "所屬州" },
  { key: "contribution_weekly", label: "貢獻本週" },
  { key: "battle_weekly", label: "戰功本週" },
  { key: "assist_weekly", label: "助攻本週" },
  { key: "donate_weekly", label: "捐獻本週" },
  { key: "contribution_total", label: "貢獻總量" },
  { key: "battle_total", label: "戰功總量" },
  { key: "assist_total", label: "助攻總量" },
  { key: "donate_total", label: "捐獻總量" },
  { key: "power", label: "勢力值" },
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

// ── 主元件 ────────────────────────────────────────────────────
export default function App() {
  const now = new Date()
  const [rangeFrom, setRangeFrom] = useState(toLocalDatetimeValue(getMondayOfWeek(now)))
  const [rangeTo, setRangeTo] = useState(toLocalDatetimeValue(now))

  const [members, setMembers] = useState<MemberWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>("contribution_weekly")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const handleQuery = useCallback(async () => {
    setLoading(true)
    setQueryError(null)
    try {
      const data = await fetchMembersInRange(toISOWithTZ(rangeFrom), toISOWithTZ(rangeTo))
      setMembers(data)
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : "查詢失敗")
    } finally {
      setLoading(false)
    }
  }, [rangeFrom, rangeTo])

  useEffect(() => {
    handleQuery()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function handleUploadSuccess(rowCount: number) {
    setUploadSuccess(`上傳成功，共 ${rowCount} 筆成員資料`)
    handleQuery()
    setTimeout(() => setUploadSuccess(null), 4000)
  }

  const sorted = sortMembers(members, sortKey, sortDir)

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* 頂部工具列 */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-2 text-base font-semibold">同盟成員統計</h1>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            開始
            <input
              type="datetime-local"
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            結束
            <input
              type="datetime-local"
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
            />
          </label>
          <Button size="sm" onClick={handleQuery} disabled={loading}>
            {loading ? "查詢中…" : "查詢"}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {uploadSuccess && (
              <span className="text-xs text-muted-foreground">{uploadSuccess}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <UploadIcon data-icon="inline-start" />
              上傳 CSV
            </Button>
          </div>
        </div>

        {queryError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{queryError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* 主內容 */}
      <div className="px-6 py-4">
        {!loading && members.length === 0 && !queryError && (
          <p className="text-sm text-muted-foreground">
            目前區段無資料，請上傳 CSV 或調整時間範圍。
          </p>
        )}

        {(loading || members.length > 0) && (
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
              {loading ? (
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
                        ? <Badge variant="default">在盟</Badge>
                        : <Badge variant="secondary">退盟</Badge>
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
            {!loading && members.length > 0 && (
              <TableCaption>
                共 {members.length} 位成員 ·{" "}
                {members.filter((m) => m.is_active).length} 在盟 /{" "}
                {members.filter((m) => !m.is_active).length} 退盟
              </TableCaption>
            )}
          </Table>
        )}
      </div>

      <UploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
