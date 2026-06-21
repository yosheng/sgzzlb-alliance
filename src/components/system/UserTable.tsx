import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserPlusIcon } from "lucide-react"
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
import { registerUser } from "@/services/authService"
import type { Profile } from "@/lib/supabase"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '管理员',
  USER: '一般用户',
}

interface Props {
  profiles: Profile[]
  allowRegister: boolean
}

export function UserTable({ profiles, allowRegister }: Props) {
  const queryClient = useQueryClient()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const registerMutation = useMutation({
    mutationFn: () => registerUser(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
      setRegisterOpen(false)
      setEmail("")
      setPassword("")
    },
  })

  function openRegister() {
    setEmail("")
    setPassword("")
    registerMutation.reset()
    setRegisterOpen(true)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-foreground">用户管理</h2>
        {allowRegister && (
          <Button size="sm" onClick={openRegister}>
            <UserPlusIcon data-icon="inline-start" />
            新增用户
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead className="w-32">显示名称</TableHead>
            <TableHead className="w-28">角色</TableHead>
            <TableHead className="w-44">注册时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                暂无用户
              </TableCell>
            </TableRow>
          )}
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="text-sm font-mono truncate max-w-48">{profile.id}</TableCell>
              <TableCell>{profile.display_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{ROLE_LABEL[profile.role] ?? profile.role}</TableCell>
              <TableCell>{new Date(profile.created_at).toLocaleString("zh-CN")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={registerOpen} onOpenChange={(open) => { if (!open) setRegisterOpen(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={registerMutation.isPending}
              />
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
              onClick={() => setRegisterOpen(false)}
              disabled={registerMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending || !email || !password}
            >
              {registerMutation.isPending ? "注册中…" : "确认新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
