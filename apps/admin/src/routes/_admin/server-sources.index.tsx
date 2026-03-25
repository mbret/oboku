import { createFileRoute } from "@tanstack/react-router"
import { AdminServerSourcesSection } from "@/features/serverSources/AdminServerSourcesSection"

export const Route = createFileRoute("/_admin/server-sources/")({
  component: AdminServerSourcesSection,
})
