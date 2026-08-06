import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { AdminCustomizationSection } from "@/features/admin/AdminCustomizationSection"
import { AdminDownloadsSection } from "@/features/admin/AdminDownloadsSection"

export const Route = createFileRoute("/_admin/")({
  component: AdminHomePage,
})

function AdminHomePage() {
  return (
    <Stack>
      <AdminCustomizationSection />
      <AdminDownloadsSection />
    </Stack>
  )
}
