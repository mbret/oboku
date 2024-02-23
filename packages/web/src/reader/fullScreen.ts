import { useEffect } from "react"
import screenfull from "screenfull"
import { IS_MOBILE_DEVICE } from "../constants"
import { Report } from "../debug/report.shared"
import { useLocalSettings } from "../settings/states"

export const useFullScreenSwitch = () => {
  const localSettings = useLocalSettings()

  useEffect(() => {
    if (
      (localSettings.readingFullScreenSwitchMode === "always" ||
        (localSettings.readingFullScreenSwitchMode === "automatic" &&
          IS_MOBILE_DEVICE)) &&
      screenfull.isEnabled &&
      !screenfull.isFullscreen
    ) {
      screenfull
        .request(undefined, { navigationUI: "hide" })
        .catch(Report.error)
    }

    return () => {
      if (screenfull.isEnabled && screenfull.isFullscreen) {
        screenfull.exit().catch(Report.error)
      }
    }
  }, [localSettings])
}
