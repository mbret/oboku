import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { AdminCustomizationSection } from "@/features/admin/AdminCustomizationSection"
import { AdminDownloadsSection } from "@/features/admin/AdminDownloadsSection"
import { AdminPrivateNetworksSection } from "@/features/admin/AdminPrivateNetworksSection"

export const Route = createFileRoute("/_admin/")({
  component: AdminHomePage,
})

function AdminHomePage() {
  return (
    <Stack>
      <AdminCustomizationSection />
      <AdminDownloadsSection />
      <AdminPrivateNetworksSection />
    </Stack>
  )
}
