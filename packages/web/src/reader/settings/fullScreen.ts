import { useLocalSettings } from "../../settings/states"
import { useFullscreenOnMount } from "../../common/fullscreen/useFullscreenOnMount"
import { IS_MOBILE_DEVICE } from "../../common/utils"

export const useFullscreenAutoSwitch = () => {
  const { readingFullScreenSwitchMode } = useLocalSettings()

  useFullscreenOnMount({
    enabled:
      readingFullScreenSwitchMode === "always" ||
      (readingFullScreenSwitchMode === "automatic" && IS_MOBILE_DEVICE),
  })
}
