import {
  Box,
  Fade,
  LinearProgress,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import { memo, useEffect, useState } from "react"
import { Logo } from "./Logo"

const SLOW_BOOT_THRESHOLD_MS = 4000
const FADE_TIMEOUT_MS = 500

const getRemainingDelayBeforeSlowBoot = () =>
  Math.max(0, SLOW_BOOT_THRESHOLD_MS - performance.now())

const SplashScreenBox = styled(Box)(({ theme }) => ({
  position: "fixed",
  inset: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.palette.background.default,
}))

const LogoBox = styled(Box)({
  position: "relative",
})

const SlowBootStack = styled(Stack)(({ theme }) => ({
  position: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 200,
  marginTop: theme.spacing(3),
  alignItems: "center",
  gap: theme.spacing(1),
}))

const SlowBootLinearProgress = styled(LinearProgress)({
  width: "100%",
})

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
  const [isBootSlow, setIsBootSlow] = useState(
    () => getRemainingDelayBeforeSlowBoot() === 0,
  )

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
          <Fade in={show && isBootSlow} timeout={FADE_TIMEOUT_MS}>
            <SlowBootStack>
              <SlowBootLinearProgress />
              <Typography variant="body2" color="text.secondary" noWrap>
                Still loading…
              </Typography>
            </SlowBootStack>
          </Fade>
        </LogoBox>
      </SplashScreenBox>
    </Fade>
  )
})
