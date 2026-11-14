import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "@mantine/core"
import { AdminCustomizationSection } from "@/features/admin/AdminCustomizationSection"
import { AdminDownloadsSection } from "@/features/admin/AdminDownloadsSection"
import { AdminOpdsSection } from "@/features/admin/AdminOpdsSection"
import { AdminPrivateNetworksSection } from "@/features/admin/AdminPrivateNetworksSection"
import { AdminStreamingSection } from "@/features/admin/AdminStreamingSection"

export const Route = createFileRoute("/_admin/")({
  component: AdminHomePage,
})

function AdminHomePage() {
  return (
    <Stack>
      <AdminCustomizationSection />
      <AdminDownloadsSection />
      <AdminOpdsSection />
      <AdminStreamingSection />
      <AdminPrivateNetworksSection />
    </Stack>
  )
}
