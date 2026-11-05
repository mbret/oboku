import type { ReactReaderSettings } from "@prose-reader/react-reader"
import {
  type LocalSettings,
  localSettingsSignal,
  useLocalSettings,
} from "../../settings/useLocalSettings"
import { useSettings } from "../../settings/useSettings"

function saveReaderSettingsOnDevice(changes: ReactReaderSettings) {
  localSettingsSignal.update(
    function withReaderSettings(localSettings): LocalSettings {
      return {
        ...localSettings,
        ...("fontScale" in changes && {
          readerFontScale: changes.fontScale ?? null,
        }),
        ...("spreadMode" in changes && {
          readerSpreadMode: changes.spreadMode ?? null,
        }),
        ...("theme" in changes && { readerTheme: changes.theme ?? null }),
      }
    },
  )
}

/**
 * The reader settings the user changes in react-reader's menus, the font scale,
 * the spread mode and the theme, as this device keeps them. A setting the
 * device has no value for is left to `defaultReaderSettings`, then to the
 * reader. The default font scale is the account-wide `readerGlobalFontScale`,
 * which older versions of the app save. `updateReaderSettings` saves only the
 * settings it is given, as react-reader reports them: a setting reported as
 * `undefined` goes back to its default on this device.
 *
 * TODO(ask the maintainer, added 2026-09): after a few months, once older
 * versions of the app are gone, raise dropping the default from
 * `readerGlobalFontScale` with the maintainer rather than removing it: a
 * device that never changed its font scale since would go back to the
 * reader's default. The field stays in the RxDB settings schema while CouchDB
 * documents hold it.
 */
export function useReaderSettings() {
  const { readerFontScale, readerSpreadMode, readerTheme } = useLocalSettings([
    "readerFontScale",
    "readerSpreadMode",
    "readerTheme",
  ])
  const { data: accountSettings } = useSettings()
  const readerSettings: ReactReaderSettings = {
    fontScale: readerFontScale ?? undefined,
    spreadMode: readerSpreadMode ?? undefined,
    theme: readerTheme ?? undefined,
  }
  const defaultReaderSettings: ReactReaderSettings = {
    fontScale: accountSettings?.readerGlobalFontScale ?? undefined,
  }

  return {
    readerSettings,
    defaultReaderSettings,
    updateReaderSettings: saveReaderSettingsOnDevice,
  }
}
