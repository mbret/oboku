import { Stack, Tabs, Text, Title } from "@mantine/core"
import { AdminMicrosoftSection } from "./AdminMicrosoftSection"

export const AdminProvidersSection = () => {
  return (
    <Stack gap="md">
      <div>
        <Title order={3} mb="xs">
          Providers
        </Title>
        <Text size="sm" c="dimmed">
          Manage provider-specific application credentials shared by the
          instance.
        </Text>
      </div>

      <Tabs defaultValue="microsoft">
        <Tabs.List>
          <Tabs.Tab value="microsoft">Microsoft</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="microsoft" pt="md">
          <AdminMicrosoftSection />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
