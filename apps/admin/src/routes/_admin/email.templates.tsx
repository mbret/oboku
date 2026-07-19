import { createFileRoute } from "@tanstack/react-router"
import { EmailTemplatesSection } from "@/features/email/EmailTemplatesSection"

export const Route = createFileRoute("/_admin/email/templates")({
  component: EmailTemplatesSection,
  staticData: { breadcrumb: "Templates" },
})
