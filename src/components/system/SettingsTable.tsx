import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PencilIcon, CheckIcon, XIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateSystemSetting } from "@/services/systemService"
import type { SystemSetting } from "@/lib/supabase"

interface Props {
  settings: SystemSetting[]
}

export function SettingsTable({ settings }: Props) {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<SystemSetting | null>(null)
  const [editValue, setEditValue] = useState("")

  const updateMutation = useMutation({
    mutationFn: ({ code, value }: { code: string; value: string }) =>
      updateSystemSetting(code, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_settings"] })
      setEditTarget(null)
    },
  })

  function openEdit(setting: SystemSetting) {
    setEditTarget(setting)
    setEditValue(setting.value ?? "")
    updateMutation.reset()
  }

  function cancelEdit() {
    setEditTarget(null)
    updateMutation.reset()
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-foreground mb-3">系统配置</h2>
      {updateMutation.error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{updateMutation.error.message}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">配置项</TableHead>
            <TableHead>当前值</TableHead>
            <TableHead className="w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.map((setting) => (
            <TableRow key={setting.code}>
              <TableCell className="font-medium">{setting.label}</TableCell>
              <TableCell>
                {editTarget?.code === setting.code ? (
                  <input
                    type="text"
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") updateMutation.mutate({ code: setting.code, value: editValue })
                      if (e.key === "Escape") cancelEdit()
                    }}
                    autoFocus
                    disabled={updateMutation.isPending}
                  />
                ) : (
                  <span className="text-sm">
                    {setting.value || <span className="text-muted-foreground">—</span>}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editTarget?.code === setting.code ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => updateMutation.mutate({ code: setting.code, value: editValue })}
                      disabled={updateMutation.isPending}
                      title="保存"
                    >
                      <CheckIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={cancelEdit}
                      disabled={updateMutation.isPending}
                      title="取消"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(setting)}
                    title="编辑"
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
