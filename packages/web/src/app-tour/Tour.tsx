import React, { useEffect, memo, ReactNode } from "react"
import { useRecoilState } from "recoil"
import { appTourState } from "./states"
import { TourContent } from "./TourContent"
import { TourKey } from "./TourContext"

type Props = {
  id: TourKey
  show?: boolean
  unskippable?: boolean
  onClose: () => void
  children: ReactNode
}

export const Tour: React.FC<Props> = memo(
  ({ children, id, show = false, unskippable, onClose }) => {
    const [{ currentOpenedTour }, setAooTourState] =
      useRecoilState(appTourState)

    useEffect(() => {
      if (!show) {
        setAooTourState((old) => {
          if (old.currentOpenedTour === id) {
            return { currentOpenedTour: undefined }
          }
          return old
        })
      }
      if (show) {
        setAooTourState((old) => {
          if (
            old.currentOpenedTour === undefined ||
            old.currentOpenedTour !== id
          ) {
            return { currentOpenedTour: id }
          }
          return old
        })
      }
    }, [show, currentOpenedTour, id, setAooTourState])

    return (
      <>
        {show && currentOpenedTour === id && (
          <TourContent id={id} unskippable={unskippable} onClose={onClose} />
        )}
        {children}
      </>
    )
  }
)
