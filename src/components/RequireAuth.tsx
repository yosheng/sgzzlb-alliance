import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { Skeleton } from "@/components/ui/skeleton"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}