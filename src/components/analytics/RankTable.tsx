import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type RankRow = { rank: number; name: string; group: string; value: number }

export default function RankTable({ title, rows }: { title: string; rows: RankRow[] }) {
  return (
    <Card>
      <CardHeader className="pt-0 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-xs">#</TableHead>
              <TableHead className="text-xs">成員</TableHead>
              <TableHead className="text-xs">組別</TableHead>
              <TableHead className="text-right text-xs">數值</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.rank}>
                <TableCell className="text-xs text-muted-foreground">{r.rank}</TableCell>
                <TableCell className="max-w-[80px] truncate text-xs font-medium">{r.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.group || "—"}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{r.value.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
