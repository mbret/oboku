import { Button, Group, NumberInput, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"
import type { AdminUpdateSettingsData } from "@oboku/shared"
import { useEffect } from "react"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

export type NumberSettingFormProps = {
  label: string
  saveLabel: string
  /** Shown when the value is below 1, or above `max`. */
  rangeError: string
  savedValue: number
  step?: number
  max?: number
  toSettings: (value: number) => AdminUpdateSettingsData["body"]
}

export function NumberSettingForm({
  label,
  saveLabel,
  rangeError,
  savedValue,
  step,
  max,
  toSettings,
}: NumberSettingFormProps) {
  const { mutate: updateSettings, isPending } = useUpdateInstanceSettings()
  const form = useForm<{ value: number | string }>({
    mode: "controlled",
    initialValues: { value: "" },
    validate: {
      value: function validateWithinRange(value) {
        const isWithinRange =
          typeof value === "number" &&
          value >= 1 &&
          (max === undefined || value <= max)

        return isWithinRange ? null : rangeError
      },
    },
  })

  useEffect(
    function syncFormFromSavedValue() {
      form.setValues({ value: savedValue })
    },
    [savedValue, form.setValues],
  )

  return (
    <form
      onSubmit={form.onSubmit(function saveSetting({ value }) {
        updateSettings(toSettings(Number(value)))
      })}
    >
      <Stack gap="sm">
        <NumberInput
          label={label}
          min={1}
          max={max}
          step={step}
          allowDecimal={false}
          {...form.getInputProps("value")}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {saveLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
