import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { MenuIcon, UploadIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { UploadDialog } from "@/components/UploadDialog"

const ALLIANCE_NAME = import.meta.env.VITE_ALLIANCE_NAME as string

const NAV_ITEMS = [
  { to: "/", label: "统计面板" },
  { to: "/compare", label: "记录比对" },
  { to: "/records", label: "记录管理" },
] as const

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, label }) => (
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

  function handleUploadSuccess(rowCount: number) {
    console.log(`上传成功，共 ${rowCount} 条`)
    // 各页面自行通过 react-query invalidate 刷新，这里不需要额外处理
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-12 items-center gap-4 px-4 md:px-6">
          {/* 左：同盟名称 */}
          <span
            className="cursor-pointer text-sm font-semibold shrink-0"
            onClick={() => navigate("/")}
          >
            {ALLIANCE_NAME}
          </span>

          {/* 中：桌面导航（md 以上显示） */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            <NavItems />
          </nav>

          {/* 右：上传按钮 + 手机 hamburger */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <UploadIcon data-icon="inline-start" />
              <span className="hidden sm:inline">上传同盟统计</span>
            </Button>

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
            <SheetTitle>{ALLIANCE_NAME}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            <NavItems onClick={() => setSheetOpen(false)} />
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
