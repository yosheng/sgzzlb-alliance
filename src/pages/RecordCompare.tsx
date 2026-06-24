import { useState, useEffect } from "react"
import { ArrowLeftRightIcon, ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { queryUploadRecords, queryMembersByUploadId } from "@/services/uploadRecordService"
import type { UploadRecord, Member } from "@/lib/supabase"

// ── 类型 ──────────────────────────────────────────────────────

type NumericField = "contribution_total" | "battle_total" | "assist_total" | "donate_total" | "power"

const DIFF_FIELDS: { key: NumericField; label: string }[] = [
  { key: "contribution_total", label: "贡献总量" },
  { key: "battle_total", label: "战功总量" },
  { key: "assist_total", label: "助攻总量" },
  { key: "donate_total", label: "捐献总量" },
  { key: "power", label: "势力值" },
]

interface MemberRow {
  name: string
  src: Member | null
  tgt: Member | null
  group_name: string | null
  state: string | null
}

type SortDir = "asc" | "desc"
type SortKey = "group_name" | "state" | NumericField

const SORTABLE_META: SortKey[] = ["group_name", "state"]

// ── 工具函数 ──────────────────────────────────────────────────

function recordLabel(r: UploadRecord): string {
  const date = r.stat_at.slice(0, 10)
  return r.description ? `${date}（${r.description}）` : date
}

function diffPct(src: number, tgt: number): number | null {
  if (src === 0) return null
  return ((tgt - src) / src) * 100
}

function fmtPct(pct: number | null): string {
  if (pct === null) return "—"
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}%`
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDownIcon className="size-3 opacity-40" />
  return dir === "asc"
    ? <ArrowUpIcon className="size-3" />
    : <ArrowDownIcon className="size-3" />
}

function pctColor(pct: number | null): string {
  if (pct === null) return "text-muted-foreground"
  if (pct > 0) return "text-green-500"
  if (pct < 0) return "text-red-500"
  return "text-muted-foreground"
}

// ── 子组件 ──────────────────────────────────────────────────

function DiffCell({ srcVal, tgtVal }: { srcVal: number | null; tgtVal: number | null }) {
  if (srcVal === null && tgtVal === null) {
    return <TableCell className="text-center text-muted-foreground">—</TableCell>
  }

  const pct = srcVal !== null && tgtVal !== null ? diffPct(srcVal, tgtVal) : null
  const diff = srcVal !== null && tgtVal !== null ? tgtVal - srcVal : null
  const color = pctColor(pct)

  const tooltipLines = [
    tgtVal !== null ? `目标: ${tgtVal.toLocaleString()}` : "目标: —",
    srcVal !== null ? `来源: ${srcVal.toLocaleString()}` : "来源: —",
    diff !== null ? `差值: ${diff >= 0 ? "+" : ""}${diff.toLocaleString()}` : "",
  ].filter(Boolean)

  return (
    <TableCell className="text-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-default tabular-nums text-xs font-medium ${color}`}>
            {fmtPct(pct)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipLines.map((l) => <div key={l}>{l}</div>)}
        </TooltipContent>
      </Tooltip>
    </TableCell>
  )
}

// ── 主组件 ──────────────────────────────────────────────────

export default function RecordCompare() {
  const [srcId, setSrcId] = useState<string>("")
  const [tgtId, setTgtId] = useState<string>("")
  const [sortKey, setSortKey] = useState<SortKey>("contribution_total")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "group_name" || key === "state" ? "asc" : "desc")
    }
  }

  const { data: records = [], isLoading: recordsLoading, error: recordsError } =
    useQuery<UploadRecord[], Error>({
      queryKey: ["upload_records"],
      queryFn: queryUploadRecords,
    })

  useEffect(() => {
    if (records.length > 0 && tgtId === "") {
      setTgtId(String(records[0].id))
    }
  }, [records])

  const srcIdNum = srcId ? Number(srcId) : null
  const tgtIdNum = tgtId ? Number(tgtId) : null

  const { data: srcMembers, isLoading: srcLoading, error: srcError } =
    useQuery<Member[], Error>({
      queryKey: ["members_by_upload", srcIdNum],
      queryFn: () => queryMembersByUploadId(srcIdNum!),
      enabled: srcIdNum !== null,
    })

  const { data: tgtMembers, isLoading: tgtLoading, error: tgtError } =
    useQuery<Member[], Error>({
      queryKey: ["members_by_upload", tgtIdNum],
      queryFn: () => queryMembersByUploadId(tgtIdNum!),
      enabled: tgtIdNum !== null,
    })

  function handleSwap() {
    setSrcId(tgtId)
    setTgtId(srcId)
  }

  const rows: MemberRow[] = (() => {
    if (!srcMembers && !tgtMembers) return []
    const srcMap = new Map((srcMembers ?? []).map((m) => [m.name, m]))
    const tgtMap = new Map((tgtMembers ?? []).map((m) => [m.name, m]))
    const names = new Set([...srcMap.keys(), ...tgtMap.keys()])
    return [...names].map((name) => {
      const src = srcMap.get(name) ?? null
      const tgt = tgtMap.get(name) ?? null
      const latest = tgt ?? src!
      return { name, src, tgt, group_name: latest.group_name, state: latest.state }
    })
  })()

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0
    if (sortKey === "group_name" || sortKey === "state") {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      cmp = av < bv ? -1 : av > bv ? 1 : 0
    } else {
      const da = (a.tgt?.[sortKey] ?? 0) - (a.src?.[sortKey] ?? 0)
      const db = (b.tgt?.[sortKey] ?? 0) - (b.src?.[sortKey] ?? 0)
      cmp = da < db ? -1 : da > db ? 1 : 0
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  const isComparing = srcIdNum !== null && tgtIdNum !== null
  const dataLoading = srcLoading || tgtLoading
  const dataError = srcError ?? tgtError

  return (
    <div className="px-4 py-4 md:px-6">
      {/* 选择栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">来源</span>
          <Select
            value={srcId}
            onValueChange={(v) => {
              setSrcId(v)
              if (v === tgtId) setTgtId("")
            }}
            disabled={recordsLoading}
          >
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue placeholder="选择来源数据集" />
            </SelectTrigger>
            <SelectContent>
              {records.map((r) => (
                <SelectItem key={r.id} value={String(r.id)} disabled={String(r.id) === tgtId}>
                  {recordLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {srcId && (
            <Button size="icon" variant="ghost" className="size-6 shrink-0" onClick={() => setSrcId("")}>
              <XIcon className="size-3" />
            </Button>
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0"
          onClick={handleSwap}
          disabled={!srcId && !tgtId}
          title="互换来源与目标"
        >
          <ArrowLeftRightIcon className="size-4" />
        </Button>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">目标</span>
          <Select
            value={tgtId}
            onValueChange={(v) => {
              setTgtId(v)
              if (v === srcId) setSrcId("")
            }}
            disabled={recordsLoading}
          >
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue placeholder="选择目标数据集" />
            </SelectTrigger>
            <SelectContent>
              {records.map((r) => (
                <SelectItem key={r.id} value={String(r.id)} disabled={String(r.id) === srcId}>
                  {recordLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tgtId && (
            <Button size="icon" variant="ghost" className="size-6 shrink-0" onClick={() => setTgtId("")}>
              <XIcon className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {recordsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{recordsError.message}</AlertDescription>
        </Alert>
      )}

      {dataError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{dataError.message}</AlertDescription>
        </Alert>
      )}

      {!isComparing && (
        <p className="text-sm text-muted-foreground">请选择来源和目标数据集以开始比对。</p>
      )}

      {isComparing && (dataLoading || sorted.length > 0) && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 w-10 bg-background text-xs">#</TableHead>
              <TableHead className="sticky left-10 z-20 w-[120px] max-w-[120px] bg-background text-xs">成员</TableHead>
              {SORTABLE_META.map((key) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none text-xs hover:text-foreground"
                  onClick={() => handleSort(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {key === "group_name" ? "分组" : "所属州"}
                    <SortIcon active={sortKey === key} dir={sortDir} />
                  </span>
                </TableHead>
              ))}
              {DIFF_FIELDS.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none text-center text-xs hover:text-foreground"
                  onClick={() => handleSort(key)}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    {label}
                    <SortIcon active={sortKey === key} dir={sortDir} />
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: DIFF_FIELDS.length + 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-3 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : sorted.map((row, i) => (
                  <TableRow key={row.name}>
                    <TableCell className="sticky left-0 z-10 bg-background text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="sticky left-10 z-10 w-[120px] max-w-[120px] bg-background font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate">{row.name}</span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">{row.name}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.group_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.state ?? "—"}</TableCell>
                    {DIFF_FIELDS.map(({ key }) => (
                      <DiffCell
                        key={key}
                        srcVal={row.src?.[key] ?? null}
                        tgtVal={row.tgt?.[key] ?? null}
                      />
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      )}

      {isComparing && !dataLoading && sorted.length === 0 && !dataError && (
        <p className="text-sm text-muted-foreground">两个数据集均无成员数据。</p>
      )}
    </div>
  )
}
