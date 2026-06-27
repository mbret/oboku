import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin/email")({
  component: Outlet,
  staticData: { breadcrumb: "Emails" },
})
