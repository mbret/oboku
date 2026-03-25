import { createFileRoute } from "@tanstack/react-router"
import { AdminCoversSection } from "@/features/admin/AdminCoversSection"

export const Route = createFileRoute("/_admin/covers")({
  component: AdminCoversSection,
})
