import { createFileRoute } from "@tanstack/react-router"
import { AdminNotificationsSection } from "@/features/notifications/AdminNotificationsSection"

export const Route = createFileRoute("/_admin/notifications")({
  component: AdminNotificationsSection,
  staticData: { breadcrumb: "Notifications" },
})
