import { createFileRoute } from "@tanstack/react-router"
import { AdminMigrationSection } from "@/features/admin/AdminMigrationSection"

export const Route = createFileRoute("/_admin/migration")({
  component: AdminMigrationSection,
})
