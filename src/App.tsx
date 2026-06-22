import { useEffect } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import { RequireAuth } from "@/components/RequireAuth"
import { useAuthStore } from "@/stores/authStore"
import MemberStats from "@/pages/MemberStats"
import RecordCompare from "@/pages/RecordCompare"
import RecordManager from "@/pages/RecordManager"
import SystemManger from "@/pages/SystemManger"
import Login from "@/pages/Login"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <MemberStats /> },
      { path: "compare", element: <RecordCompare /> },
      { path: "records", element: <RecordManager /> },
      { path: "system", element: <SystemManger /> },
    ],
  },
])

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  return <RouterProvider router={router} />
}