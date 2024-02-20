import React, { useEffect, memo, ReactNode } from "react"
import { appTourSignal } from "./states"
import { TourContent } from "./TourContent"
import { TourKey } from "./TourContext"
import { useSignalValue } from "reactjrx"

type Props = {
  id: TourKey
  show?: boolean
  unskippable?: boolean
  onClose: () => void
  children: ReactNode
}

export const Tour: React.FC<Props> = memo(
  ({ children, id, show = false, unskippable, onClose }) => {
    const { currentOpenedTour } = useSignalValue(appTourSignal)

    useEffect(() => {
      if (!show) {
        appTourSignal.setValue((old) => {
          if (old.currentOpenedTour === id) {
            return { currentOpenedTour: undefined }
          }
          return old
        })
      }
      if (show) {
        appTourSignal.setValue((old) => {
          if (
            old.currentOpenedTour === undefined ||
            old.currentOpenedTour !== id
          ) {
            return { currentOpenedTour: id }
          }
          return old
        })
      }
    }, [show, currentOpenedTour, id])

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
