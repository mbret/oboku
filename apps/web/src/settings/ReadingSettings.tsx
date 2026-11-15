import type { MessageDescriptor } from "@lingui/core"
import { msg } from "@lingui/core/macro"
import { useLingui } from "@lingui/react/macro"
import { ListItemSelect, ListItemSwitch } from "../common/lists"
import { localSettingsSignal, useLocalSettings } from "./useLocalSettings"

type LocalSettings = ReturnType<typeof useLocalSettings>

const fullScreenModes: Record<
  LocalSettings["readingFullScreenSwitchMode"],
  MessageDescriptor
> = {
  automatic: msg`Automatic (based on device)`,
  always: msg`Always`,
  never: msg`Never`,
}

const fullScreenChoices = (
  Object.keys(fullScreenModes) as LocalSettings["readingFullScreenSwitchMode"][]
).map((value) => ({ value, label: fullScreenModes[value] }))

/**
 * Reading-related settings shared between the global settings screen
 * and the in-reader settings list.
 */
export const ReadingSettings = () => {
  const { t, i18n } = useLingui()
  const localSettings = useLocalSettings([
    "readerWakeLockEnabled",
    "readerFloatingProgress",
    "readerFloatingTime",
    "readingFullScreenSwitchMode",
  ])

  return (
    <>
      <ListItemSelect
        primary={t`Automatically switch to fullscreen upon opening`}
        value={localSettings.readingFullScreenSwitchMode}
        choices={fullScreenChoices.map((choice) => ({
          ...choice,
          label: i18n._(choice.label),
        }))}
        onChange={(value) => {
          localSettingsSignal.update((state) => ({
            ...state,
            readingFullScreenSwitchMode: value,
          }))
        }}
      />
      <ListItemSwitch
        primary={t`Show current time`}
        secondary={t`Display the current time on overlay of the book (not in comics)`}
        onClick={() => {
          localSettingsSignal.update((state) => ({
            ...state,
            readerFloatingTime:
              state.readerFloatingTime === "bottom"
                ? ("off" as const)
                : ("bottom" as const),
          }))
        }}
        checked={localSettings.readerFloatingTime === "bottom"}
      />
      <ListItemSwitch
        primary={t`Show current progress`}
        secondary={t`Display the current book progress on overlay of the book (not in comics)`}
        onClick={() => {
          localSettingsSignal.update((state) => ({
            ...state,
            readerFloatingProgress:
              state.readerFloatingProgress === "bottom"
                ? ("off" as const)
                : ("bottom" as const),
          }))
        }}
        checked={localSettings.readerFloatingProgress === "bottom"}
      />
      <ListItemSwitch
        primary={t`Keep screen on`}
        secondary={t`Prevent the device screen from turning off while reading`}
        onClick={() => {
          localSettingsSignal.update((state) => ({
            ...state,
            readerWakeLockEnabled: !state.readerWakeLockEnabled,
          }))
        }}
        checked={!!localSettings.readerWakeLockEnabled}
      />
    </>
  )
}
