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
import { parseCsv, parseStatAtFromFilename } from "@/lib/csv"
import { uploadCsvData } from "@/lib/supabase"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (rowCount: number) => void
}

export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose(next: boolean) {
    if (uploading) return
    if (!next) {
      setFile(null)
      setDescription("")
      setError(null)
    }
    onOpenChange(next)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (fileInputRef.current) fileInputRef.current.value = ""
    setFile(selected)
    setError(null)
  }

  async function handleSubmit() {
    if (!file) return

    const filename = file.name.replace(/\.[^.]+$/, "")
    const statAt = parseStatAtFromFilename(filename)
    if (!statAt) {
      setError(`無法從檔名解析統計時間：${file.name}`)
      return
    }

    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length === 0) {
      setError("CSV 內容為空或格式錯誤")
      return
    }

    setUploading(true)
    setError(null)
    const { error: uploadError } = await uploadCsvData(filename, statAt, description, rows)
    setUploading(false)

    if (uploadError) {
      setError(uploadError)
      return
    }

    setFile(null)
    setDescription("")
    onOpenChange(false)
    onSuccess(rows.length)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>上傳統計 CSV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 檔案選擇區 */}
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 transition-colors hover:bg-muted/40"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileIcon className="size-8 text-muted-foreground" />
            {file
              ? <span className="text-sm font-medium">{file.name}</span>
              : <span className="text-sm text-muted-foreground">點擊選擇 CSV 檔案</span>
            }
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* 備注輸入 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">備注</label>
            <textarea
              className="min-h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="輸入此份統計的備注（選填）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={uploading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "上傳中…" : "確認上傳"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
