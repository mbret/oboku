import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin/server-sync")({
  component: () => <Outlet />,
  staticData: { breadcrumb: "Server Sync" },
})
