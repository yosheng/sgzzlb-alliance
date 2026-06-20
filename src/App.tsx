import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppShell } from "@/components/AppShell"
import MemberStats from "@/pages/MemberStats"
import RecordCompare from "@/pages/RecordCompare"
import RecordManager from "@/pages/RecordManager"

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <MemberStats /> },
      { path: "compare", element: <RecordCompare /> },
      { path: "records", element: <RecordManager /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
