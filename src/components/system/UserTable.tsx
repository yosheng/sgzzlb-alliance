import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserPlusIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RegisterDialog } from "@/components/system/RegisterDialog"
import { updateProfile } from "@/services/systemService"
import type { Profile, ProfileRole } from "@/lib/supabase"

const ROLE_LABEL: Record<ProfileRole, string> = {
  ADMIN: '管理员',
  USER: '一般用户',
}

const ROLES: ProfileRole[] = ['ADMIN', 'USER']

interface EditState {
  id: string
  display_name: string
  role: ProfileRole
}

interface Props {
  profiles: Profile[]
  allowRegister: boolean
  emailDomain: string
}

export function UserTable({ profiles, allowRegister, emailDomain }: Props) {
  const queryClient = useQueryClient()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)

  const updateMutation = useMutation({
    mutationFn: (state: EditState) =>
      updateProfile(state.id, { role: state.role, display_name: state.display_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
      setEditState(null)
    },
  })

  function openEdit(profile: Profile) {
    updateMutation.reset()
    setEditState({
      id: profile.id,
      display_name: profile.display_name ?? "",
      role: profile.role,
    })
  }

  function cancelEdit() {
    setEditState(null)
    updateMutation.reset()
  }

  const isEditing = (id: string) => editState?.id === id

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-foreground">用户管理</h2>
        {allowRegister && (
          <Button size="sm" onClick={() => setRegisterOpen(true)}>
            <UserPlusIcon data-icon="inline-start" />
            新增用户
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead className="w-36">显示名称</TableHead>
            <TableHead className="w-28">角色</TableHead>
            <TableHead className="w-44">注册时间</TableHead>
            <TableHead className="w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                暂无用户
              </TableCell>
            </TableRow>
          )}
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="text-sm font-mono truncate max-w-48">{profile.id}</TableCell>
              <TableCell>
                {isEditing(profile.id) ? (
                  <input
                    type="text"
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={editState!.display_name}
                    onChange={(e) => setEditState((s) => s && { ...s, display_name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") updateMutation.mutate(editState!)
                      if (e.key === "Escape") cancelEdit()
                    }}
                    autoFocus
                    disabled={updateMutation.isPending}
                  />
                ) : (
                  <span className="text-sm">
                    {profile.display_name ?? <span className="text-muted-foreground">—</span>}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {isEditing(profile.id) ? (
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={editState!.role}
                    onChange={(e) => setEditState((s) => s && { ...s, role: e.target.value as ProfileRole })}
                    disabled={updateMutation.isPending}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm">{ROLE_LABEL[profile.role] ?? profile.role}</span>
                )}
              </TableCell>
              <TableCell className="text-sm">{new Date(profile.created_at).toLocaleString("zh-CN")}</TableCell>
              <TableCell>
                {isEditing(profile.id) ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => updateMutation.mutate(editState!)}
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
                    onClick={() => openEdit(profile)}
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

      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        emailDomain={emailDomain}
      />
    </section>
  )
}