import { createFileRoute } from "@tanstack/react-router"
import { AdminEmailSection } from "@/features/email/AdminEmailSection"

export const Route = createFileRoute("/_admin/email/")({
  component: AdminEmailSection,
})
