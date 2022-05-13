import { Backdrop, Box, Button, Modal, useTheme } from "@mui/material"
import makeStyles from "@mui/styles/makeStyles"
import React, { useContext, useEffect, useRef, useState } from "react"
import { useWindowSize } from "react-use"
import { Step, TourContext, TourKey } from "./TourContext"
import { useCSS } from "../common/utils"
import { Carousel } from "react-responsive-carousel"

type Props = {
  id: TourKey
  unskippable?: boolean
  onClose: () => void
}

const getSpotlightSize = (step: Step | undefined) => {
  const containerMeasure = step?.measures || {
    pageX: 0,
    pageY: 0,
    width: 0,
    height: 0
  }
  const margin = step?.spotlightMargin || 30
  const spotlightSize =
    step?.spotlightSize || (containerMeasure?.width || 0) + margin

  return spotlightSize
}

export const TourContent: React.FC<Props> = ({ id, unskippable, onClose }) => {
  const classes = useClasses()
  const { height: windowHeight, width: windowWidth } = useWindowSize()
  const { tours = {} } = useContext(TourContext) || {}
  const steps = tours[id]?.steps
  const swiperRef = useRef<Carousel>()
  const [step, setStep] = useState(0)
  const [isCarouselMoving, setIsCarouselMoving] = useState(false)
  const numberOfSteps = Object.keys(steps || {}).length
  const currentStep = steps ? steps[step + 1] : undefined
  const containerMeasure = currentStep?.measures || {
    pageX: 0,
    pageY: 0,
    width: 0,
    height: 0
  }
  const displaySpotlight = !isCarouselMoving && !!currentStep?.measures
  const styles = useStyles({
    numberOfSteps,
    withButtons: !!currentStep?.withButtons
  })
  const isFinalStep = step === numberOfSteps - 1
  const stepsAsArray = Object.values(steps || {})
  const stepContents = stepsAsArray.map((item) => item.content)
  const [carouselKey, setCarouselKey] = useState(0)

  /**
   * So theses are the svg path used to draw everything you see on the spotlight.
   * I took inspiration from https://github.com/xcarpentier/rn-tourguide for the
   * spotlight small circle (mobileSvgSpotlightPath). If you want to change the shapes
   * or just play with it I suggest to use some tools (ex. https://jxnblk.github.io/).
   * Careful when you do any change, this part is quite annoying to get right.
   * Here are some extra documentation about the tablet background circle
   * @see https://stackoverflow.com/questions/5737975/circle-drawing-with-svgs-arc-path
   */
  const spotlightSize = getSpotlightSize(currentStep)
  const spotlightSvgX =
    containerMeasure?.pageX + containerMeasure?.width / 2 - spotlightSize / 2
  const spotlightSvgY = containerMeasure?.pageY + containerMeasure?.height / 2
  const svgSpotlightPath = `
    M${spotlightSvgX},${spotlightSvgY}Za1 1 0 1 0 ${spotlightSize} 0 1 1 0 1 0-${spotlightSize} 0
  `
  const mobileSvgBackgroundFillerPath = `M0,0H${windowWidth}V${windowHeight}H0V0Z`

  useEffect(() => {
    setCarouselKey((value) => value + 1)
  }, [stepsAsArray.length])

  return (
    <Modal
      open={true}
      style={styles.modal}
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      BackdropComponent={Backdrop}
      BackdropProps={{
        style: {
          backgroundColor: "transparent"
        }
      }}
    >
      <>
        <div>
          <svg pointerEvents="none" width={windowWidth} height={windowHeight}>
            <path
              fill={`rgba(0, 0, 0, 0.9)`}
              fillRule="evenodd"
              strokeWidth={1}
              d={`${mobileSvgBackgroundFillerPath} ${
                displaySpotlight ? svgSpotlightPath : ""
              }`}
            />
          </svg>
        </div>
        <div style={styles.container}>
          <div style={styles.carouselContainer}>
            {stepContents.length > 0 && (
              <Carousel
                swipeable={true}
                emulateTouch={true}
                autoPlay={false}
                interval={2147483647}
                // weird hack to force re-render. For some reason using dynamic stepContents does not play
                // well with it and it will fail into calculation of swipe
                key={carouselKey}
                showThumbs={false}
                showArrows={false}
                showIndicators={stepContents.length > 1}
                showStatus={false}
                onChange={(stepIndex) => {
                  setStep(stepIndex)
                  setIsCarouselMoving(false)
                }}
                transitionTime={100}
                ref={swiperRef as any}
                onSwipeStart={() => setIsCarouselMoving(true)}
                width={`100%`}
                className={classes.carouselInner}
              >
                {stepContents.map((stepContent, index) => (
                  <div key={index} style={styles.stepContainer}>
                    {typeof stepContent !== "function" && stepContent}
                    {typeof stepContent === "function" &&
                      stepContent({
                        onClose,
                        spotlightMeasures:
                          tours[id]?.steps[index + 1]?.measures,
                        spotlightSize: getSpotlightSize(
                          tours[id]?.steps[index + 1]
                        )
                      })}
                  </div>
                ))}
              </Carousel>
            )}
          </div>
          {currentStep?.withButtons && (
            <div style={styles.bottomContainer}>
              <Box
                style={styles.nexButtonContainer}
                justifyContent="center"
                display="flex"
              >
                <Button
                  // style={styles.nextButton}
                  variant={isFinalStep ? "contained" : "outlined"}
                  size="large"
                  onClick={() => {
                    if (isFinalStep) {
                      onClose()
                    } else {
                      swiperRef.current?.increment()
                    }
                  }}
                >
                  {!isFinalStep ? "next" : "Got it"}
                </Button>
              </Box>
            </div>
          )}
        </div>
      </>
    </Modal>
  )
}

const useClasses = makeStyles((theme) => ({
  carouselInner: {
    width: "100%",
    "& .carousel-slider": {
      height: "100%"
    },
    "& .slider-wrapper": {
      height: "100%"
    },
    "& .slider": {
      height: "100%"
    }
  }
}))

const useStyles = ({
  numberOfSteps,
  withButtons
}: {
  numberOfSteps: number
  withButtons: boolean
}) => {
  const BULLET_SAFE_AREA = 40
  const theme = useTheme()

  return useCSS(
    () => ({
      modal: {
        // We disable the focus ring for mouse, touch and keyboard users.
        // At some point, it would be better to keep it for keyboard users.
        // :focus-ring CSS pseudo-class will help.
        outline: "none",
        "& > :lastChild": {
          // outline: 'none',
        }
      },
      container: {
        width: "100%",
        height: "100%",
        display: "flex",
        position: "absolute",
        top: 0,
        flexFlow: "column"
      },
      carouselContainer: {
        flex: 1,
        display: "flex",
        ...(withButtons && {
          paddingBottom: theme.spacing(2)
        })
      },
      bottomContainer: {
        flex: 0.2
      },
      stepContainer: {
        flex: 1,
        ...(numberOfSteps > 1 && {
          paddingBottom: BULLET_SAFE_AREA
        }),
        height: "100%",
        display: "flex"
      },
      nexButtonContainer: { alignItems: "center", marginBottom: 20 }
    }),
    [theme, numberOfSteps, withButtons]
  )
}
