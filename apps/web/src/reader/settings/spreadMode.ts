import { useEffect } from "react"
import { localSettingsSignal } from "../../settings/useLocalSettings"
import { useReader } from "../states"

/**
 * Saves the spread mode chosen in the reader's layout menu as a device
 * setting, which the next reader is created with.
 */
export function usePersistSpreadMode() {
  const reader = useReader()

  useEffect(
    function saveSpreadModeWhenReaderChangesIt() {
      if (!reader) return

      const subscription = reader.settings
        .watch(["spreadMode"])
        .subscribe(function saveSpreadMode({ spreadMode }) {
          localSettingsSignal.update(function withSpreadMode(localSettings) {
            return { ...localSettings, readerSpreadMode: spreadMode }
          })
        })

      return function stopSavingSpreadMode() {
        subscription.unsubscribe()
      }
    },
    [reader],
  )
}
