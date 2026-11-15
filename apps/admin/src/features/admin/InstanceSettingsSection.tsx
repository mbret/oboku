import { Paper, Stack, Text } from "@mantine/core"
import type { ReactNode } from "react"
import type { InstanceSettingsResponseDto } from "@oboku/shared"
import { useInstanceSettings } from "../useInstanceSettings"

type InstanceSettingsSectionProps = {
  title: string
  description: string
  /** Shown under the description, above the settings. */
  children?: ReactNode
  renderSettings: (settings: InstanceSettingsResponseDto) => ReactNode
}

export function InstanceSettingsSection({
  title,
  description,
  children,
  renderSettings,
}: InstanceSettingsSectionProps) {
  const instanceSettings = useInstanceSettings()

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </div>

        {children}

        {instanceSettings.isLoading && (
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        )}

        {instanceSettings.error && (
          <Text size="sm" c="red">
            Error: {instanceSettings.error.message}
          </Text>
        )}

        {instanceSettings.data && renderSettings(instanceSettings.data)}
      </Stack>
    </Paper>
  )
}
