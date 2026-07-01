import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { MenuIcon, UploadIcon, LogOutIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { UploadDialog } from "@/components/UploadDialog"
import { querySystemSettings, queryMyProfile } from "@/services/systemService"
import { signOut } from "@/services/authService"
import { useAuthStore } from "@/stores/authStore"

const NAV_ITEMS = [
  { to: "/", label: "最新统计", adminOnly: false },
  { to: "/interval", label: "区间统计", adminOnly: false },
  { to: "/compare", label: "记录比对", adminOnly: false },
  { to: "/records", label: "记录管理", adminOnly: true },
  { to: "/system", label: "系统管理", adminOnly: true },
] as const

function NavItems({ onClick, isAdmin }: { onClick?: () => void; isAdmin: boolean }) {
  return (
    <>
      {NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onClick}
          className={({ isActive }) =>
            cn(navigationMenuTriggerStyle(), isActive && "bg-muted text-foreground")
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  )
}

export function AppShell() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["system_settings"],
    queryFn: querySystemSettings,
    staleTime: 5 * 60 * 1000,
  })

  const { data: myProfile } = useQuery({
    queryKey: ["my_profile", session?.user.id],
    queryFn: () => queryMyProfile(session!.user.id),
    enabled: !!session,
  })

  const allianceName = settings?.find((s) => s.code === "ALLIANCE_NAME")?.value ?? ""
  const displayName = myProfile?.display_name ?? session?.user.email?.split("@")[0] ?? ""
  const isAdmin = myProfile?.role === "ADMIN"

  async function handleSignOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

  function handleUploadSuccess(rowCount: number) {
    console.log(`上传成功，共 ${rowCount} 条`)
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-12 items-center gap-4 px-4 md:px-6">
          {/* 左：同盟名称 */}
          {settingsLoading ? (
            <Skeleton className="h-4 w-24 shrink-0" />
          ) : (
            <span
              className="cursor-pointer text-sm font-semibold shrink-0"
              onClick={() => navigate("/")}
            >
              {allianceName}
            </span>
          )}

          {/* 中：桌面导航（md 以上显示） */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            <NavItems isAdmin={isAdmin} />
          </nav>

          {/* 右：上传按钮 + 登出 + 手机 hamburger */}
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadOpen(true)}
              >
                <UploadIcon data-icon="inline-start" />
                <span className="hidden sm:inline">上传同盟统计</span>
              </Button>
            )}

            {session && (
              <>
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  {displayName}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title={`登出 ${session.user.email}`}
                >
                  <LogOutIcon className="size-4" />
                </Button>
              </>
            )}

            {/* 手机端 hamburger（md 以下显示） */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSheetOpen(true)}
              aria-label="打开菜单"
            >
              <MenuIcon />
            </Button>
          </div>
        </div>
      </header>

      {/* 手机端侧边 drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-64 p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{allianceName}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            <NavItems isAdmin={isAdmin} onClick={() => setSheetOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      {/* 页面内容 */}
      <main>
        <Outlet />
      </main>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}