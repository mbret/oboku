import { useWindowSize } from "react-use"

export const useHorizontalTappingZoneWidth = () => {
  const windowSize = useWindowSize()

  return windowSize.width / 6
}