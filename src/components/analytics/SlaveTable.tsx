import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Member } from "@/lib/supabase"

type SlaveKey = "weekly" | "total"

function slaveIndex(m: Member, mode: SlaveKey) {
  if (mode === "weekly") return m.power / (m.battle_weekly + m.assist_weekly + 1)
  return m.power / (m.battle_total + m.assist_total + 1)
}

export default function SlaveTable({ members }: { members: Member[] }) {
  const [mode, setMode] = useState<SlaveKey>("weekly")

  const rows = useMemo(
    () =>
      [...members]
        .sort((a, b) => slaveIndex(b, mode) - slaveIndex(a, mode))
        .slice(0, 30),
    [members, mode],
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pt-0 pb-2">
        <CardTitle className="text-sm">地奴分析（Top 30）</CardTitle>
        <div className="flex gap-1">
          <Badge
            variant={mode === "weekly" ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setMode("weekly")}
          >
            本週
          </Badge>
          <Badge
            variant={mode === "total" ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setMode("total")}
          >
            總量
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-xs">#</TableHead>
              <TableHead className="text-xs">成員</TableHead>
              <TableHead className="text-xs">組別</TableHead>
              <TableHead className="text-right text-xs">勢力值</TableHead>
              <TableHead className="text-right text-xs">戰功{mode === "weekly" ? "本週" : "總量"}</TableHead>
              <TableHead className="text-right text-xs">助攻{mode === "weekly" ? "本週" : "總量"}</TableHead>
              <TableHead className="text-right text-xs">地奴指數</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m, i) => {
              const battle = mode === "weekly" ? m.battle_weekly : m.battle_total
              const assist = mode === "weekly" ? m.assist_weekly : m.assist_total
              const idx = Math.round(slaveIndex(m, mode))
              const isWarning = battle + assist === 0
              return (
                <TableRow key={m.id} className={isWarning ? "bg-red-500/5" : undefined}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="max-w-[80px] truncate text-xs font-medium">{m.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.group_name || "—"}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{m.power.toLocaleString()}</TableCell>
                  <TableCell className={`text-right text-xs tabular-nums ${battle === 0 ? "text-red-500" : ""}`}>
                    {battle.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right text-xs tabular-nums ${assist === 0 ? "text-red-500" : ""}`}>
                    {assist.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums font-medium">
                    {idx.toLocaleString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
