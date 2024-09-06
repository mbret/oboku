import { IS_MOBILE_DEVICE } from "../../constants"
import { useLocalSettings } from "../../settings/states"
import { useFullscreenOnMount } from "../../common/fullscreen/useFullscreenOnMount"

export const useFullscreenAutoSwitch = () => {
  const { readingFullScreenSwitchMode } = useLocalSettings()

  useFullscreenOnMount({
    enabled:
      readingFullScreenSwitchMode === "always" ||
      (readingFullScreenSwitchMode === "automatic" && IS_MOBILE_DEVICE)
  })
}
