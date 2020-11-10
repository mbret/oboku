import { useWindowSize } from "react-use"

export const useVerticalTappingZoneHeight = () => {
  const windowSize = useWindowSize()

  return windowSize.height / 7
}

export const useHorizontalTappingZoneWidth = () => {
  const windowSize = useWindowSize()

  return windowSize.width / 6
}