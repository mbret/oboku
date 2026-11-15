import { Paper, Stack, Text } from "@mantine/core"
import type { ReactNode } from "react"
import type { InstanceSettingsResponseDto } from "@oboku/shared"
import { useInstanceSettings } from "../useInstanceSettings"
import {
  NumberSettingForm,
  type NumberSettingFormProps,
} from "./NumberSettingForm"

type NumberSettingSectionProps = Omit<NumberSettingFormProps, "savedValue"> & {
  title: string
  description: string
  toSavedValue: (settings: InstanceSettingsResponseDto) => number
  children?: ReactNode
}

export function NumberSettingSection({
  title,
  description,
  toSavedValue,
  children,
  ...formProps
}: NumberSettingSectionProps) {
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

        {instanceSettings.data && (
          <NumberSettingForm
            {...formProps}
            savedValue={toSavedValue(instanceSettings.data)}
          />
        )}
      </Stack>
    </Paper>
  )
}
