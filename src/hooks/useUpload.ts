import { useMutation, useQueryClient } from "@tanstack/react-query"
import { insertCsvData } from "@/services/uploadRecordService"
import { parseCsv, parseStatAtFromFilename } from "@/lib/csv"
import type { Member } from "@/lib/supabase"

interface UploadPayload {
  file: File
  description: string
}

interface UploadResult {
  rowCount: number
}

export function useUpload() {
  const queryClient = useQueryClient()

  return useMutation<UploadResult, Error, UploadPayload>({
    mutationFn: async ({ file, description }) => {
      const filename = file.name.replace(/\.[^.]+$/, "")
      const statAt = parseStatAtFromFilename(filename)
      if (!statAt) {
        throw new Error(`无法从文件名解析统计时间：${file.name}`)
      }

      const text = await file.text()
      const rows = parseCsv(text) as Omit<Member, "id" | "upload_id">[]
      if (rows.length === 0) {
        throw new Error("CSV 内容为空或格式错误")
      }

      await insertCsvData(filename, statAt, description, rows)
      return { rowCount: rows.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
      queryClient.invalidateQueries({ queryKey: ["upload_records"] })
    },
  })
}
