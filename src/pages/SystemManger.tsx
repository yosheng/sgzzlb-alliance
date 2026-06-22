import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2Icon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { SettingsTable } from "@/components/system/SettingsTable"
import { UserTable } from "@/components/system/UserTable"
import { querySystemSettings, clearAllianceData, queryProfiles } from "@/services/systemService"

export default function SystemManager() {
  const queryClient = useQueryClient()
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const { data: settings = [], isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ["system_settings"],
    queryFn: querySystemSettings,
  })

  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ["profiles"],
    queryFn: queryProfiles,
  })

  const clearMutation = useMutation({
    mutationFn: clearAllianceData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload_records"] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
      setClearConfirmOpen(false)
    },
  })

  const allowRegister = settings.find((s) => s.code === "ALLOW_REGISTER")?.value === "true"
  const emailDomain = settings.find((s) => s.code === "EMAIL_DOMAIN")?.value ?? "yosheng.tw"

  if (settingsLoading || profilesLoading) {
    return (
      <div className="px-4 py-4 md:px-6 space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  if (settingsError || profilesError) {
    return (
      <div className="px-4 py-4 md:px-6">
        <Alert variant="destructive">
          <AlertDescription>{((settingsError ?? profilesError) as Error).message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 md:px-6 space-y-8">
      <SettingsTable settings={settings} />

      <UserTable profiles={profiles} allowRegister={allowRegister} emailDomain={emailDomain} />

      <section className="border-t border-border pt-6">
        <h2 className="text-sm font-medium text-foreground mb-1">危险操作</h2>
        <p className="text-xs text-muted-foreground mb-3">清除后无法恢复，请谨慎操作。</p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { clearMutation.reset(); setClearConfirmOpen(true) }}
        >
          <Trash2Icon data-icon="inline-start" />
          清除联盟数据
        </Button>
      </section>

      <Dialog open={clearConfirmOpen} onOpenChange={(open) => { if (!open) setClearConfirmOpen(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认清除联盟数据</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            将清除所有上传记录与成员数据，id 序列同步重置。此操作不可撤销。
          </p>
          {clearMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>{clearMutation.error.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearConfirmOpen(false)}
              disabled={clearMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
            >
              {clearMutation.isPending ? "清除中…" : "确认清除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
