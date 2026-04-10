import { createFileRoute } from "@tanstack/react-router"
import { AdminProvidersSection } from "@/features/admin/AdminProvidersSection"

export const Route = createFileRoute("/_admin/providers")({
  component: AdminProvidersSection,
  staticData: { breadcrumb: "Providers" },
})
