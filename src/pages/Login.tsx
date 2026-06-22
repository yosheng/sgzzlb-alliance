import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { signIn } from "@/services/authService"
import { querySystemSettings } from "@/services/systemService"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? "/"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["system_settings"],
    queryFn: querySystemSettings,
    staleTime: 5 * 60 * 1000,
  })

  const allianceName = settings?.find((s) => s.code === "ALLIANCE_NAME")?.value ?? ""
  const emailDomain = settings?.find((s) => s.code === "EMAIL_DOMAIN")?.value ?? "yosheng.tw"

  const resolvedEmail = username && !username.includes("@")
    ? `${username}@${emailDomain}`
    : username

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      await signIn(resolvedEmail, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          {settingsLoading ? (
            <Skeleton className="h-6 w-32 mx-auto" />
          ) : (
            <h1 className="text-lg font-semibold">{allianceName || "同盟管理系统"}</h1>
          )}
          <p className="text-sm text-muted-foreground">请登入以继续</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">账号</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={`用户名 或 user@${emailDomain}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              autoFocus
            />
            {username && resolvedEmail !== username && (
              <p className="mt-1 text-xs text-muted-foreground">
                将以 <span className="text-foreground">{resolvedEmail}</span> 登入
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">密码</label>
            <input
              type="password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !username || !password}
          >
            {isPending ? "登入中…" : "登入"}
          </Button>
        </form>
      </div>
    </div>
  )
}