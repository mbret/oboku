import { createFileRoute } from "@tanstack/react-router"
import { AdminUsersSection } from "@/features/users/AdminUsersSection"

export const Route = createFileRoute("/_admin/users")({
  component: AdminUsersSection,
  staticData: { breadcrumb: "Users" },
})
