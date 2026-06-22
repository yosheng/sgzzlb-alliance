import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerUser } from "@/services/authService"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  emailDomain: string
}

export function RegisterDialog({ open, onOpenChange, emailDomain }: Props) {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const registerMutation = useMutation({
    mutationFn: () => {
      const email = username.includes("@")
        ? username
        : `${username}@${emailDomain}`
      return registerUser(email, password)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
      onOpenChange(false)
    },
  })

  function handleOpenChange(open: boolean) {
    if (!open) {
      setUsername("")
      setPassword("")
      registerMutation.reset()
    }
    onOpenChange(open)
  }

  const resolvedEmail = username && !username.includes("@")
    ? `${username}@${emailDomain}`
    : username

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>新增用户</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">账号</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={`用户名 或 user@${emailDomain}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={registerMutation.isPending}
            />
            {username && resolvedEmail !== username && (
              <p className="mt-1 text-xs text-muted-foreground">
                将注册为 <span className="text-foreground">{resolvedEmail}</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">密码</label>
            <input
              type="password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={registerMutation.isPending}
            />
          </div>
        </div>
        {registerMutation.error && (
          <Alert variant="destructive">
            <AlertDescription>{registerMutation.error.message}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={registerMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending || !username || !password}
          >
            {registerMutation.isPending ? "注册中…" : "确认新增"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
