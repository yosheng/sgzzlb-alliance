import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PencilIcon, Trash2Icon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  queryUploadRecords,
  deleteUploadRecord,
  updateUploadRecordDescription,
} from "@/services/uploadRecordService"
import type { UploadRecord } from "@/lib/supabase"

export default function RecordManager() {
  const queryClient = useQueryClient()

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["upload_records"],
    queryFn: queryUploadRecords,
  })

  const [deleteTarget, setDeleteTarget] = useState<UploadRecord | null>(null)
  const [editTarget, setEditTarget] = useState<UploadRecord | null>(null)
  const [editDescription, setEditDescription] = useState("")

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUploadRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload_records"] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
      setDeleteTarget(null)
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, description }: { id: number; description: string }) =>
      updateUploadRecordDescription(id, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload_records"] })
      setEditTarget(null)
    },
  })

  function openEdit(record: UploadRecord) {
    setEditTarget(record)
    setEditDescription(record.description ?? "")
    editMutation.reset()
  }

  if (isLoading) {
    return (
      <div className="px-4 py-4 md:px-6">
        <p className="text-sm text-muted-foreground">加载中…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4 md:px-6">
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 md:px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>统计日期</TableHead>
            <TableHead>文件名</TableHead>
            <TableHead>备注</TableHead>
            <TableHead className="text-right">成员数</TableHead>
            <TableHead>上传时间</TableHead>
            <TableHead className="w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                暂无上传记录
              </TableCell>
            </TableRow>
          )}
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.stat_at}</TableCell>
              <TableCell className="max-w-48 truncate">{record.filename}</TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">
                {record.description ?? "—"}
              </TableCell>
              <TableCell className="text-right">{record.row_count}</TableCell>
              <TableCell>{new Date(record.uploaded_at).toLocaleString("zh-CN")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(record)}
                    title="编辑备注"
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(record)}
                    title="删除"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            将删除 <span className="font-medium text-foreground">{deleteTarget?.stat_at}</span> 的上传记录及其全部成员数据，此操作不可撤销。
          </p>
          {deleteMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>{deleteMutation.error.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "删除中…" : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑备注对话框 */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>编辑备注</DialogTitle>
          </DialogHeader>
          <textarea
            className="min-h-24 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入备注（选填）"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            disabled={editMutation.isPending}
          />
          {editMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>{editMutation.error.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={editMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={() =>
                editTarget && editMutation.mutate({ id: editTarget.id, description: editDescription })
              }
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
