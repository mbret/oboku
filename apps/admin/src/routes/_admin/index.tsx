import { createFileRoute } from "@tanstack/react-router"
import { AdminCustomizationSection } from "@/features/admin/AdminCustomizationSection"

export const Route = createFileRoute("/_admin/")({
  component: AdminHomePage,
})

function AdminHomePage() {
  return <AdminCustomizationSection />
}
