import { createFileRoute } from "@tanstack/react-router"
import { AdminSecuritySection } from "@/features/security/AdminSecuritySection"

export const Route = createFileRoute("/_admin/security")({
  component: AdminSecuritySection,
  staticData: { breadcrumb: "Security" },
})
