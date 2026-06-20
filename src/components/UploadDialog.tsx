import React, { useRef, useState } from "react"
import { FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useUpload } from "@/hooks/useUpload"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (rowCount: number) => void
}

export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")

  const { mutate, isPending, error, reset } = useUpload()

  function handleClose(next: boolean) {
    if (isPending) return
    if (!next) {
      setFile(null)
      setDescription("")
      reset()
    }
    onOpenChange(next)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (fileInputRef.current) fileInputRef.current.value = ""
    setFile(selected)
    reset()
  }

  function handleSubmit() {
    if (!file) return
    mutate(
      { file, description },
      {
        onSuccess: ({ rowCount }) => {
          setFile(null)
          setDescription("")
          onOpenChange(false)
          onSuccess?.(rowCount)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>上传统计 CSV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 transition-colors hover:bg-muted/40"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileIcon className="size-8 text-muted-foreground" />
            {file
              ? <span className="text-sm font-medium">{file.name}</span>
              : <span className="text-sm text-muted-foreground">点击选择 CSV 文件</span>
            }
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">备注</label>
            <textarea
              className="min-h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="输入此份统计的备注（选填）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isPending}>
            {isPending ? "上传中…" : "确认上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
