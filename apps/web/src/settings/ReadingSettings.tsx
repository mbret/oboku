import { ListItemSelect, ListItemSwitch } from "../common/lists"
import { localSettingsSignal, useLocalSettings } from "./useLocalSettings"

type LocalSettings = ReturnType<typeof useLocalSettings>

const fullScreenModes: Record<
  LocalSettings["readingFullScreenSwitchMode"],
  string
> = {
  automatic: "Automatic (based on device)",
  always: "Always",
  never: "Never",
}

const fullScreenChoices = (
  Object.keys(fullScreenModes) as LocalSettings["readingFullScreenSwitchMode"][]
).map((value) => ({ value, label: fullScreenModes[value] }))

/**
 * Reading-related settings shared between the global settings screen
 * and the in-reader settings list.
 */
export const ReadingSettings = () => {
  const localSettings = useLocalSettings([
    "readerWakeLockEnabled",
    "readerFloatingProgress",
    "readerFloatingTime",
    "readingFullScreenSwitchMode",
  ])

  return (
    <>
      <ListItemSelect
        primary="Automatically switch to fullscreen upon opening"
        value={localSettings.readingFullScreenSwitchMode}
        choices={fullScreenChoices}
        onChange={(value) => {
          localSettingsSignal.update((state) => ({
            ...state,
            readingFullScreenSwitchMode: value,
          }))
        }}
      />
      <ListItemSwitch
        primary="Show current time"
        secondary="Display the current time on overlay of the book (not in comics)"
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
        primary="Show current progress"
        secondary="Display the current book progress on overlay of the book (not in comics)"
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
        primary="Keep screen on"
        secondary="Prevent the device screen from turning off while reading"
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
