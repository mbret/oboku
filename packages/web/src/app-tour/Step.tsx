import React, { useContext, useEffect, memo, useRef, useCallback, ReactNode } from "react"
import { useMeasure } from "react-use"
import { Step as StepType, TourContext, TourKey } from "./TourContext"

export const Step: React.FC<{
  number: number
  content?: StepType["content"]
  style?: React.CSSProperties
  id: TourKey
  spotlightSize?: number
  spotlightMargin?: number
  testID?: string
  withButtons?: boolean
  getSpotlightMeasures?: (element: HTMLElement) => DOMRect
  children?: ReactNode
}> = memo(
  ({
    withButtons = true,
    children,
    id,
    number,
    content,
    style,
    spotlightSize,
    spotlightMargin,
    getSpotlightMeasures
  }) => {
    const { registerOrUpdateStep } = useContext(TourContext) || {}
    const [measureRef, layout] = useMeasure()
    const ref = useRef<HTMLElement>()
    const registerRef = useCallback(
      (_ref) => {
        if (_ref) {
          measureRef(_ref)
          ref.current = _ref
        }
      },
      [measureRef]
    )
    const hasChildren = !!children
    const trackedElementLayoutWidth = layout.width
    const trackedElementLayoutHeight = layout.height

    useEffect(() => {
      // if (!trackedElementLayoutWidth || !trackedElementLayoutHeight) return;

      if (!hasChildren) {
        registerOrUpdateStep &&
          registerOrUpdateStep(id, number, {
            measures: undefined,
            spotlightSize,
            spotlightMargin,
            content,
            withButtons
          })
      } else {
        const measurableElement = ref.current
        const boundingRect =
          getSpotlightMeasures && measurableElement
            ? getSpotlightMeasures(measurableElement)
            : measurableElement?.getBoundingClientRect()
        registerOrUpdateStep &&
          registerOrUpdateStep(id, number, {
            measures: {
              x: 0,
              y: 0,
              width: boundingRect?.width || 0,
              height: boundingRect?.height || 0,
              pageX: boundingRect?.x || 0,
              pageY: boundingRect?.y || 0
            },
            spotlightSize,
            spotlightMargin,
            content,
            withButtons
          })
      }
    }, [
      getSpotlightMeasures,
      registerOrUpdateStep,
      id,
      number,
      trackedElementLayoutWidth,
      trackedElementLayoutHeight,
      withButtons,
      content,
      hasChildren,
      spotlightSize,
      spotlightMargin
    ])

    return (
      <div
        // {...{
        //   ...!hasChildren && {
        //     ref: registerRef
        //   }
        // }}
        ref={registerRef}
        style={style}
      >
        {children}
        {/* {React.Children.map(children, (child, index) => {
        console.warn(id, child)
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ref: registerRef
          })
        }
        return child
      })} */}
      </div>
    )
  }
)
