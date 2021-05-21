import { useSetRecoilState } from "recoil"
import * as states from "./states"
import { useEffect } from "react"
import { useWindowSize } from "react-use"
import { Reader } from '@oboku/reader'
import { HORIZONTAL_TAPPING_RATIO } from "./constants"

export const useGestureHandler = (reader: Reader | undefined, hammer: HammerManager | undefined) => {
  const { width } = useWindowSize()
  const setIsMenuShown = useSetRecoilState(states.isMenuShownState)

  useEffect(() => {
    const onTap = ({ srcEvent, center }: HammerInput) => {
      const { normalizedEventPointerPositions, iframeOriginalEvent } = reader?.getEventInformation(srcEvent) || {
        normalizedEventPointerPositions: { x: center.x }
      }

      if (iframeOriginalEvent?.target) {
        const target = iframeOriginalEvent.target as HTMLElement

        // don't do anything if it was clicked on link
        // could also be a <span> inside a <a>, etc
        if (target.nodeName === `a` || target.closest('a')) return
      }

      if (normalizedEventPointerPositions && `x` in normalizedEventPointerPositions) {
        const { x = 0 } = normalizedEventPointerPositions

        if (!reader) {
          setIsMenuShown(val => !val)
        } else if (x < width * HORIZONTAL_TAPPING_RATIO) {
          reader?.turnLeft()
        } else if (x > width * (1 - HORIZONTAL_TAPPING_RATIO)) {
          reader?.turnRight()
        } else {
          setIsMenuShown(val => !val)
        }
      }
    }

    const onPanMove = (ev: HammerInput) => {
      if (reader) {
        if (ev.isFinal && !reader.isSelecting()) {
          const velocity = ev.velocityX
          if (velocity < -0.5) {
            reader.turnRight()
          }
          if (velocity > 0.5) {
            reader.turnLeft()
          }
        }
      }
    }

    hammer?.on('tap', onTap)
    hammer?.on('panmove panstart panend', onPanMove)

    return () => {
      hammer?.off('tap', onTap)
      hammer?.off('panmove panstart panend', onPanMove)
    }
  }, [hammer, reader, setIsMenuShown, width])
}