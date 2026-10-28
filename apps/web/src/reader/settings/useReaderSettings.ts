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
        readerFontScale: changes.fontScale ?? localSettings.readerFontScale,
        readerSpreadMode: changes.spreadMode ?? localSettings.readerSpreadMode,
      }
    },
  )
}

/**
 * The reader settings the user changes in react-reader, the font scale and the
 * spread mode, from its menus or with a pinch, kept on the device and resolved
 * to what the reader should use. A device that has not changed its font scale
 * yet uses the account-wide `readerGlobalFontScale`, which older versions of
 * the app save. `updateReaderSettings` saves only the settings it is given, as
 * react-reader reports them.
 *
 * TODO(ask the maintainer, added 2026-09): after a few months, once older
 * versions of the app are gone, raise dropping the fallback to
 * `readerGlobalFontScale` with the maintainer rather than removing it: a
 * device that never changed its font scale since would go back to the default.
 * The field stays in the RxDB settings schema while CouchDB documents hold it.
 */
export function useReaderSettings() {
  const { readerFontScale, readerSpreadMode } = useLocalSettings([
    "readerFontScale",
    "readerSpreadMode",
  ])
  const { data: accountSettings } = useSettings()
  const readerSettings: ReactReaderSettings = {
    fontScale:
      readerFontScale ?? accountSettings?.readerGlobalFontScale ?? undefined,
    spreadMode: readerSpreadMode,
  }

  return {
    readerSettings,
    updateReaderSettings: saveReaderSettingsOnDevice,
  }
}
