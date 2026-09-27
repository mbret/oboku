import { Box, Fade, LinearProgress, styled } from "@mui/material"
import { memo, useEffect, useState } from "react"
import { Logo } from "./Logo"

const SLOW_BOOT_THRESHOLD_MS = 4000
const FADE_TIMEOUT_MS = 500

const getRemainingDelayBeforeSlowBoot = () =>
  Math.max(0, SLOW_BOOT_THRESHOLD_MS - performance.now())

const SplashScreenBox = styled(Box)(function styleSplashScreenBox({ theme }) {
  const aboveBlockingBackdrop = theme.zIndex.tooltip + 2

  return {
    position: "fixed",
    inset: 0,
    zIndex: aboveBlockingBackdrop,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.palette.background.default,
  }
})

const LogoBox = styled(Box)({
  position: "relative",
})

const SlowBootLinearProgress = styled(LinearProgress)(
  function styleSlowBootLinearProgress({ theme }) {
    return {
      position: "absolute",
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      width: 200,
      height: 8,
      marginTop: theme.spacing(3),
    }
  },
)

/**
 * Covers the whole boot, from the configuration fetch to the app shell being
 * ready. `appear` is off so the logo is painted on the first frame instead of
 * fading in, which also makes the handover between the two boot boundaries
 * (`LoadConfiguration` then `App`) invisible.
 */
export const SplashScreen = memo(function SplashScreen({
  show,
}: {
  show: boolean
}) {
  const [isBootSlow, setIsBootSlow] = useState(function isBootAlreadySlow() {
    return getRemainingDelayBeforeSlowBoot() === 0
  })

  useEffect(function revealSlowBootIndicatorWhenBootIsTakingLong() {
    const timeout = setTimeout(function markBootAsSlow() {
      setIsBootSlow(true)
    }, getRemainingDelayBeforeSlowBoot())

    return function cancelSlowBootIndicator() {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <Fade in={show} appear={false} unmountOnExit timeout={FADE_TIMEOUT_MS}>
      <SplashScreenBox>
        <LogoBox>
          <Logo />
          <Fade
            in={show && isBootSlow}
            appear={false}
            timeout={FADE_TIMEOUT_MS}
          >
            <SlowBootLinearProgress />
          </Fade>
        </LogoBox>
      </SplashScreenBox>
    </Fade>
  )
})
