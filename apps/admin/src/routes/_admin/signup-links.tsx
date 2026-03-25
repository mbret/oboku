import { createFileRoute } from "@tanstack/react-router"
import { AdminSignUpLinksSection } from "@/features/admin/AdminSignUpLinksSection"

export const Route = createFileRoute("/_admin/signup-links")({
  component: AdminSignUpLinksSection,
})
