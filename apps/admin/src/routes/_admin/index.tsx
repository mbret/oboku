import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { AdminCustomizationSection } from "@/features/admin/AdminCustomizationSection"
import { AdminMetadataSection } from "@/features/admin/AdminMetadataSection"

export const Route = createFileRoute("/_admin/")({
  component: AdminHomePage,
})

function AdminHomePage() {
  return (
    <Stack>
      <AdminCustomizationSection />
      <AdminMetadataSection />
    </Stack>
  )
}
