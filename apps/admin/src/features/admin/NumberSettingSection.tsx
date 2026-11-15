import type { InstanceSettingsResponseDto } from "@oboku/shared"
import { InstanceSettingsSection } from "./InstanceSettingsSection"
import {
  NumberSettingForm,
  type NumberSettingFormProps,
} from "./NumberSettingForm"

type NumberSettingSectionProps = Omit<NumberSettingFormProps, "savedValue"> & {
  title: string
  description: string
  toSavedValue: (settings: InstanceSettingsResponseDto) => number
}

export function NumberSettingSection({
  title,
  description,
  toSavedValue,
  ...formProps
}: NumberSettingSectionProps) {
  return (
    <InstanceSettingsSection
      title={title}
      description={description}
      renderSettings={function renderNumberSettingForm(settings) {
        return (
          <NumberSettingForm
            {...formProps}
            savedValue={toSavedValue(settings)}
          />
        )
      }}
    />
  )
}
